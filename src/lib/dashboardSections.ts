import { VISIBLE_TOOL_SLUGS } from '@/data/tools';

export interface DbToolLike {
  id?: string;
  slug: string;
  name?: string;
  status: 'coming_soon' | 'available' | 'maintenance' | 'hidden';
  price_monthly?: number;
  is_free?: boolean;
  short_description?: string;
  description?: string;
  sort_order?: number;
}

export interface SubscriptionLike {
  product_slug: string;
  status: string;
  current_period_end: string | null;
  is_trial?: boolean;
  manually_granted?: boolean;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
}

export interface OrderbotStoresLike {
  active_store_count?: number;
  stores?: any[];
}

/**
 * Checks if a subscription row represents active, unexpired access.
 */
export function isSubscriptionActive(
  sub: SubscriptionLike,
  nowMs: number = Date.now()
): boolean {
  if (sub.status !== 'active' && sub.status !== 'trialing') {
    return false;
  }
  if (!sub.current_period_end) {
    // Null current_period_end represents lifetime / perpetual access (e.g. manual grant with no expiration)
    return true;
  }
  const endMs = new Date(sub.current_period_end).getTime();
  if (isNaN(endMs)) {
    return false;
  }
  return endMs > nowMs;
}

/**
 * Checks whether the user has active, unexpired access to a tool.
 * Resolves catalog slug 'rccp' to include internal access slug 'cpbot'.
 */
export function hasActiveToolAccess(
  toolSlug: string,
  subscriptions: SubscriptionLike[],
  isFreeTool: boolean = false,
  nowMs: number = Date.now()
): boolean {
  if (toolSlug === 'rccp' || isFreeTool) {
    return true;
  }
  return subscriptions.some(s => {
    const matchesSlug = toolSlug === 'rccp'
      ? (s.product_slug === 'cpbot' || s.product_slug === 'rccp')
      : s.product_slug === toolSlug;
    return matchesSlug && isSubscriptionActive(s, nowMs);
  });
}

/**
 * Categorizes tools into exactly one section: Your tools, Available, or Coming soon.
 * Enforces:
 * 1. A tool card appears in exactly ONE section.
 * 2. Active tools (active or trialing, not expired, including manual grants) appear only under "Your tools".
 * 3. Coming soon only lists tools the user does NOT own.
 * 4. Deduplication by tool slug after resolving access slug (rccp and cpbot share one card).
 * 5. Order Bot exception: visible in Your tools with stores, in Available with sub only, hidden otherwise.
 * 6. Invoice Generator is always hidden.
 */
export function categorizeDashboardTools(
  dbTools: DbToolLike[],
  subscriptions: SubscriptionLike[],
  orderbotStores?: OrderbotStoresLike | null,
  nowMs: number = Date.now()
): {
  activeTools: DbToolLike[];
  availableTools: DbToolLike[];
  comingSoonTools: DbToolLike[];
} {
  const hasOrderbotSub = subscriptions.some(
    s => s.product_slug === 'orderbot' && isSubscriptionActive(s, nowMs)
  );
  const hasOrderbotStores = (orderbotStores?.active_store_count ?? 0) > 0;
  const hasOrderbotAccess = hasOrderbotSub || hasOrderbotStores;

  // 1. SECTION 1: Your tools (activeTools)
  const activeTools = dbTools.filter(t => {
    if (t.slug === 'invoicegen') return false;
    if (t.slug === 'orderbot') {
      return hasOrderbotAccess && hasOrderbotStores;
    }
    if (t.slug === 'rccp') return true;
    if (!(VISIBLE_TOOL_SLUGS as readonly string[]).includes(t.slug)) return false;

    const hasActive = subscriptions.some(
      s => s.product_slug === t.slug && isSubscriptionActive(s, nowMs)
    );
    return t.is_free || hasActive;
  });

  const activeSlugs = new Set(activeTools.map(t => t.slug));

  // 2. SECTION 2: Available (availableTools)
  const availableTools = dbTools.filter(t => {
    if (t.slug === 'invoicegen') return false;
    if (t.slug === 'orderbot') {
      // Order Bot card shown in Available ONLY if user has active/trialing subscription but no stores yet
      return hasOrderbotSub && !hasOrderbotStores;
    }
    // Must not appear in Your tools
    if (activeSlugs.has(t.slug)) return false;
    if (t.slug === 'rccp') return false;
    if (t.is_free) return false;
    if (!(VISIBLE_TOOL_SLUGS as readonly string[]).includes(t.slug)) return false;

    const hasActive = subscriptions.some(
      s => s.product_slug === t.slug && isSubscriptionActive(s, nowMs)
    );
    return !hasActive && (t.status === 'available' || t.status === 'maintenance');
  });

  const availableSlugs = new Set(availableTools.map(t => t.slug));

  // 3. SECTION 3: Coming soon (comingSoonTools)
  // Coming soon only lists tools the user does not own, and never duplicates active or available tools
  const comingSoonTools = dbTools.filter(t => {
    if (t.slug === 'invoicegen') return false;
    if (t.slug === 'orderbot') return false;
    if (activeSlugs.has(t.slug)) return false;
    if (availableSlugs.has(t.slug)) return false;
    return t.status === 'coming_soon' && (VISIBLE_TOOL_SLUGS as readonly string[]).includes(t.slug);
  });

  return { activeTools, availableTools, comingSoonTools };
}

/**
 * Determines if "Manage subscription" should be shown on a tool card.
 * ONLY show when:
 * - The row has a Stripe link (stripe_customer_id or stripe_subscription_id)
 * - AND manually_granted is NOT true.
 * For manual grants or rows without Stripe, returns false.
 */
export function canManageSubscription(sub?: SubscriptionLike | null): boolean {
  if (!sub) return false;
  if (sub.manually_granted) return false;
  const hasStripeLink = Boolean(
    (sub.stripe_customer_id && sub.stripe_customer_id.trim().length > 0) ||
    (sub.stripe_subscription_id && sub.stripe_subscription_id.trim().length > 0)
  );
  return hasStripeLink;
}

/**
 * Generates subscription date label.
 * - Trial row: "Free trial ends {date}" (or "Free trial active")
 * - Manual grant: "{prefix} access until {date}" (or "{prefix} access: no end date")
 * - Paid row: "{prefix} renews {date}"
 */
export function getSubscriptionDateText(
  sub?: SubscriptionLike | null,
  toolPrefix?: string
): string | null {
  if (!sub) return null;

  // 1. Trial row
  if (sub.is_trial || sub.status === 'trialing') {
    if (sub.current_period_end) {
      const formatted = new Date(sub.current_period_end).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return `Free trial ends ${formatted}`;
    }
    return 'Free trial active';
  }

  // 2. Manual grant
  if (sub.manually_granted) {
    if (sub.current_period_end) {
      const formatted = new Date(sub.current_period_end).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return toolPrefix ? `${toolPrefix} access until ${formatted}` : `Access until ${formatted}`;
    }
    return toolPrefix ? `${toolPrefix} access: no end date` : `Access: no end date`;
  }

  // 3. Paid row
  if (sub.current_period_end) {
    const formatted = new Date(sub.current_period_end).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return toolPrefix ? `${toolPrefix} renews ${formatted}` : `Renews ${formatted}`;
  }

  return null;
}
