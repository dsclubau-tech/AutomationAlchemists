export interface BillingSubscriptionInput {
  product_slug?: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end?: boolean | null;
  is_trial?: boolean | null;
  manually_granted?: boolean | null;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
}

export type BillingState =
  | 'none'
  | 'trialing'
  | 'trialing_canceled'
  | 'active'
  | 'active_canceled'
  | 'past_due'
  | 'expired';

export interface BillingView {
  state: BillingState;
  banner: string | null;
  primaryAction: {
    action: 'subscribe' | 'manage_billing';
    label: string;
  } | null;
  formattedDate?: string | null;
}

/**
 * Database grace buffer applied to trialing subscriptions.
 * In migration 034 (034_card_trial_identity.sql:789), process_stripe_webhook_event adds:
 * `v_target_period_end := p_current_period_end + interval '6 hours';`
 * This stops pg_cron from prematurely expiring access during Stripe's ~1h invoicing window.
 * The true customer-facing expiration date is the stored period end minus this buffer.
 */
export const TRIAL_GRACE_BUFFER_HOURS = 6;
export const TRIAL_GRACE_BUFFER_MS = TRIAL_GRACE_BUFFER_HOURS * 60 * 60 * 1000;

/**
 * Returns the effective date for a subscription period end.
 * For trialing subscriptions (is_trial = true or status = 'trialing'), subtracts the
 * 6-hour database grace buffer so that customer-facing UI displays the true Stripe trial_end.
 * For paid subscriptions or non-trial rows, returns the date unadjusted.
 */
export function getEffectiveTrialEnd(
  currentPeriodEnd: string | number | Date | null | undefined,
  isTrial: boolean = true
): Date | null {
  if (!currentPeriodEnd) return null;
  const d = currentPeriodEnd instanceof Date ? currentPeriodEnd : new Date(currentPeriodEnd);
  if (isNaN(d.getTime())) return null;
  if (!isTrial) return d;
  return new Date(d.getTime() - TRIAL_GRACE_BUFFER_MS);
}

/**
 * Formats dates in Australia/Sydney timezone using en-AU locale, e.g. "3 December 2026".
 * Standard single date format used consistently across dashboard cards, banners, and billing views.
 */
export function formatBillingDate(dateVal: string | number | Date | null | undefined): string {
  if (!dateVal) return '';
  const date = dateVal instanceof Date ? dateVal : new Date(dateVal);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Australia/Sydney',
  });
}

/**
 * Pure function to calculate dashboard billing states and banner messaging.
 *
 * Required states & behaviour:
 * - none/expired/canceled-and-ended: show the trial or Subscribe CTA as today.
 * - trialing (active, is_trial true):
 *     "Free trial active - ends on <date>"; button "Manage billing".
 *     If cancel_at_period_end: "Trial cancelled - access until <date>"; button "Manage billing".
 * - active paid:
 *     "Subscription active - renews on <date>"; "Manage billing".
 *     If cancel_at_period_end: "Cancelled - access until <date>"; "Manage billing".
 * - past_due:
 *     Clear banner "Payment failed - CP Bot is paused. Update your payment method to restore access."
 *     Primary button "Update payment method" (opens billing portal).
 *     NO Subscribe / Start trial action in this state.
 */
export function getBillingView(
  subscription: BillingSubscriptionInput | null | undefined,
  now: Date | number | string = new Date()
): BillingView {
  if (!subscription) {
    return {
      state: 'none',
      banner: null,
      primaryAction: {
        action: 'subscribe',
        label: 'Subscribe',
      },
    };
  }

  // 1. PAST_DUE state takes precedence (account is paused due to failed payment)
  if (subscription.status === 'past_due') {
    return {
      state: 'past_due',
      banner: 'Payment failed - CP Bot is paused. Update your payment method to restore access.',
      primaryAction: {
        action: 'manage_billing',
        label: 'Update payment method',
      },
    };
  }

  const nowMs =
    now instanceof Date
      ? now.getTime()
      : typeof now === 'string'
      ? new Date(now).getTime()
      : now;

  const endMs = subscription.current_period_end
    ? new Date(subscription.current_period_end).getTime()
    : null;

  const isEnded = endMs !== null && !isNaN(endMs) && endMs <= nowMs;

  // 2. Expired or canceled (ended)
  // Principle: The dashboard must NEVER claim access that the access gate denies.
  // When status is 'canceled', access is ended immediately regardless of current_period_end.
  // The "Cancelling - access until DATE" state remains ONLY when the gate still grants access
  // (status 'active' or 'trialing' with cancel_at_period_end: true).
  if (subscription.status === 'canceled' || isEnded) {
    return {
      state: 'expired',
      banner: null,
      primaryAction: {
        action: 'subscribe',
        label: 'Subscribe',
      },
    };
  }

  // 3. TRIALING state (status === 'trialing' or is_trial is true)
  const isTrial = Boolean(subscription.is_trial || subscription.status === 'trialing');
  if (isTrial && (subscription.status === 'active' || subscription.status === 'trialing')) {
    const effectiveEnd = getEffectiveTrialEnd(subscription.current_period_end, true);
    const formattedDate = formatBillingDate(effectiveEnd);
    if (subscription.cancel_at_period_end) {
      return {
        state: 'trialing_canceled',
        banner: formattedDate
          ? `Trial cancelled - access until ${formattedDate}`
          : 'Trial cancelled',
        primaryAction: {
          action: 'manage_billing',
          label: 'Manage billing',
        },
        formattedDate,
      };
    }
    return {
      state: 'trialing',
      banner: formattedDate
        ? `Free trial active - ends on ${formattedDate}`
        : 'Free trial active',
      primaryAction: {
        action: 'manage_billing',
        label: 'Manage billing',
      },
      formattedDate,
    };
  }

  // 4. ACTIVE PAID state
  if (subscription.status === 'active') {
    const formattedDate = formatBillingDate(subscription.current_period_end);
    if (subscription.cancel_at_period_end) {
      return {
        state: 'active_canceled',
        banner: formattedDate
          ? `Cancelled - access until ${formattedDate}`
          : 'Cancelled',
        primaryAction: {
          action: 'manage_billing',
          label: 'Manage billing',
        },
        formattedDate,
      };
    }
    return {
      state: 'active',
      banner: formattedDate
        ? `Subscription active - renews on ${formattedDate}`
        : 'Subscription active',
      primaryAction: {
        action: 'manage_billing',
        label: 'Manage billing',
      },
      formattedDate,
    };
  }

  // Fallback (none / inactive)
  return {
    state: 'none',
    banner: null,
    primaryAction: {
      action: 'subscribe',
      label: 'Subscribe',
    },
  };
}
