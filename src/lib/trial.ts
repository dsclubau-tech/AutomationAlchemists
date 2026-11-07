import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PRICING_CONFIG, formatPrice } from '@/config/pricing';
import { formatBillingDate } from '@/lib/billingView';

export interface TrialPublicData {
  enabled: boolean;
  trial_days?: number;
  slot_cap?: number;
  slots_taken?: number;
  slots_left?: number;
}

export interface TrialStatusClaim {
  ends_at: string;
  converted: boolean;
  revoked: boolean;
}

export interface TrialStatusData {
  enabled: boolean;
  eligible: boolean;
  reason: string;
  already_claimed: boolean;
  has_access: boolean;
  claim: TrialStatusClaim | null;
  slot_cap?: number;
  slots_left?: number;
  slots_taken?: number;
  trial_days?: number;
  denied_reason?: string | null;
  card_denial_count?: number;
}

const isPrerendering = (): boolean =>
  typeof window !== 'undefined' && Boolean((window as unknown as { __PRERENDER__?: boolean }).__PRERENDER__);

/**
 * Sanitises redirect paths for login/signup redirection.
 * Allows only strings starting with a single '/', not '//' or '/\', no '://', no '\',
 * no control characters, maximum 200 characters. Falls back to '/'.
 */
export function sanitizeNext(raw: unknown): string {
  if (typeof raw !== 'string') return '/';
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 200) return '/';
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) return '/';
  if (trimmed.includes('://') || trimmed.includes('\\')) return '/';
  if (/[\x00-\x1F\x7F]/.test(trimmed)) return '/';
  return trimmed;
}

/**
 * Maps claim/denial reasons to client-friendly messages.
 * Never reveals which other account used a card.
 * Phone numbers no longer block or deny trials (v1.14.0).
 */

export const CARD_DENIAL_RETRY_CAP = 3;

/**
 * Returns user-facing Subscribe button text formatted with current promotional pricing.
 */
export function getSubscribeButtonText(priceMonthly: number = PRICING_CONFIG.launchPrice): string {
  return `Subscribe at ${formatPrice(priceMonthly)}/month`;
}

export const TRIAL_DENIAL_TEXTS = {
  cardAlreadyUsedTitle: 'This card was already used for a free trial.',
  cardAlreadyUsedSubtitle: 'You can use another card to start your free trial, or subscribe now.',
  cardAlreadyUsedCappedTitle: 'This card was already used for a free trial.',
  cardAlreadyUsedCappedSubtitle: 'The free trial is no longer available for this account.',
  emailAlreadyUsedTitle: 'This account or email has already used the free trial.',
  emailAlreadyUsedSubtitle: 'You can still subscribe to CP Bot directly without a trial.',
  notEligibleTitle: "A free trial isn't available for this account.",
  notEligibleSubtitle: 'You can subscribe at A$4.99/month.',
  useAnotherCardButton: 'Use another card',
  freeTrialNoLongerAvailable: 'The free trial is no longer available for this account.',
} as const;

export interface DeniedTrialChoice {
  isDenied: boolean;
  reason: string | null;
  cardDenialCount: number;
  isCapped: boolean;
  canRetryCard: boolean;
  title: string;
  description: string;
  subscribeButtonText: string;
  useAnotherCardButtonText: string;
}

/**
 * Pure helper returning customer-facing choices when a trial is denied.
 * All wording lives in src/lib/trial.ts.
 */
export function getDeniedTrialChoice(
  deniedReason?: string | null,
  cardDenialCount: number = 0,
  priceMonthly: number = PRICING_CONFIG.launchPrice,
  hasActiveAccess: boolean = false,
  isEligible?: boolean,
  trialReason?: string | null
): DeniedTrialChoice {
  const reason = deniedReason || null;
  const isCapped = cardDenialCount >= CARD_DENIAL_RETRY_CAP;
  const subscribeButtonText = getSubscribeButtonText(priceMonthly);
  const useAnotherCardButtonText = TRIAL_DENIAL_TEXTS.useAnotherCardButton;

  if (!reason || hasActiveAccess) {
    return {
      isDenied: false,
      reason: null,
      cardDenialCount,
      isCapped: false,
      canRetryCard: false,
      title: '',
      description: '',
      subscribeButtonText,
      useAnotherCardButtonText,
    };
  }

  // 1. Email already used / claimed (or trialReason is 'already_claimed'):
  // User is ineligible precisely because email has already used a trial.
  if (reason === 'already_claimed' || trialReason === 'already_claimed') {
    return {
      isDenied: true,
      reason: 'already_claimed',
      cardDenialCount,
      isCapped: false,
      canRetryCard: false,
      title: TRIAL_DENIAL_TEXTS.emailAlreadyUsedTitle,
      description: TRIAL_DENIAL_TEXTS.emailAlreadyUsedSubtitle,
      subscribeButtonText,
      useAnotherCardButtonText,
    };
  }

  // 2. Card already used AND server confirms account IS eligible for a trial:
  if (reason === 'card_already_used' && isEligible === true) {
    if (isCapped) {
      return {
        isDenied: true,
        reason,
        cardDenialCount,
        isCapped: true,
        canRetryCard: false,
        title: TRIAL_DENIAL_TEXTS.cardAlreadyUsedCappedTitle,
        description: TRIAL_DENIAL_TEXTS.cardAlreadyUsedCappedSubtitle,
        subscribeButtonText,
        useAnotherCardButtonText,
      };
    }
    return {
      isDenied: true,
      reason,
      cardDenialCount,
      isCapped: false,
      canRetryCard: true,
      title: TRIAL_DENIAL_TEXTS.cardAlreadyUsedTitle,
      description: TRIAL_DENIAL_TEXTS.cardAlreadyUsedSubtitle,
      subscribeButtonText,
      useAnotherCardButtonText,
    };
  }

  // 3. Ineligible (isEligible === false, e.g. not_eligible / existing subscription row):
  // Server says no trial is possible for this account. Do NOT say the card was already used.
  // Use calm wording:
  if (isEligible === false) {
    return {
      isDenied: true,
      reason: trialReason || reason,
      cardDenialCount,
      isCapped: false,
      canRetryCard: false,
      title: TRIAL_DENIAL_TEXTS.notEligibleTitle,
      description: `You can subscribe at ${formatPrice(priceMonthly)}/month.`,
      subscribeButtonText,
      useAnotherCardButtonText,
    };
  }

  // 4. Status not loaded yet (isEligible === undefined / loading) or unknown reason fallback:
  // Must NOT offer "Use another card" before eligibility is confirmed true.
  return {
    isDenied: true,
    reason,
    cardDenialCount,
    isCapped: false,
    canRetryCard: false,
    title: TRIAL_DENIAL_TEXTS.notEligibleTitle,
    description: `You can subscribe at ${formatPrice(priceMonthly)}/month.`,
    subscribeButtonText,
    useAnotherCardButtonText,
  };
}

export function getClaimErrorMessage(reason: string, priceMonthly: number = PRICING_CONFIG.launchPrice): string {
  switch (reason) {
    case 'checkout_required':
      return 'Please complete card verification in checkout to start your free trial.';
    case 'card_already_used':
      return `This card has already been used for a free trial. You can subscribe at ${formatPrice(priceMonthly)}/month instead.`;
    case 'card_missing':
      return 'A valid payment card is required to start the free trial.';
    case 'no_slots':
    case 'sold_out':
      return 'All free-trial spots have been claimed.';
    case 'email_not_allowed':
      return 'Please use a personal email address to start the free trial.';
    case 'already_claimed':
      return 'This account or email has already used the free trial.';
    case 'disabled':
      return "The free trial isn't available right now.";
    case 'email_unconfirmed':
      return 'Please confirm your email first, then try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

/**
 * Formats trial remaining time and expiry date.
 * Formats date uniformly in Australia/Sydney timezone (matching getBillingView).
 */
export function formatTrialTimeLeft(endsAt: string): {
  text: string;
  hoursLeft: number;
  daysLeft: number;
  formattedDate: string;
} {
  const endsDate = new Date(endsAt);
  const formattedDate = formatBillingDate(endsAt);
  const time = endsDate.getTime();
  if (isNaN(time)) {
    return { text: '0 hours left', hoursLeft: 0, daysLeft: 0, formattedDate };
  }
  const diff = time - Date.now();
  if (diff <= 0) {
    return { text: '0 hours left', hoursLeft: 0, daysLeft: 0, formattedDate };
  }
  const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (hoursLeft < 48) {
    return {
      text: `${hoursLeft} ${hoursLeft === 1 ? 'hour' : 'hours'} left`,
      hoursLeft,
      daysLeft,
      formattedDate,
    };
  }
  return {
    text: `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`,
    hoursLeft,
    daysLeft,
    formattedDate,
  };
}

/**
 * Fetches public trial offer statistics (callable signed-out).
 * Fails safe to { ok: false, reason: 'network' } and never throws.
 */
export async function getTrialPublic(
  toolSlug: string = 'rccp'
): Promise<{ ok: true; data: TrialPublicData } | { ok: false; reason: 'network' }> {
  if (isPrerendering()) {
    return { ok: false, reason: 'network' };
  }
  try {
    const { data, error } = await supabase.rpc('get_trial_public', {
      p_tool_slug: toolSlug,
    });
    if (error || !data) {
      return { ok: false, reason: 'network' };
    }
    return { ok: true, data: data as TrialPublicData };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/**
 * Fetches authenticated user's trial status.
 * Fails safe to { ok: false, reason: 'network' } and never throws.
 */
export async function getTrialStatus(
  toolSlug: string = 'rccp'
): Promise<{ ok: true; data: TrialStatusData } | { ok: false; reason: 'network' }> {
  if (isPrerendering()) {
    return { ok: false, reason: 'network' };
  }
  try {
    const { data, error } = await supabase.rpc('get_trial_status', {
      p_tool_slug: toolSlug,
    });
    if (error || !data) {
      return { ok: false, reason: 'network' };
    }
    return { ok: true, data: data as TrialStatusData };
  } catch {
    return { ok: false, reason: 'network' };
  }
}


/**
 * Hook for public trial offer data (client-side only).
 */
export function useTrialPublic(toolSlug: string = 'rccp') {
  const [data, setData] = useState<TrialPublicData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getTrialPublic(toolSlug).then(res => {
      if (mounted) {
        if (res.ok) {
          setData(res.data);
        }
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [toolSlug]);

  return { data, loading };
}

/**
 * Hook for authenticated user trial status.
 */
export function useTrialStatus(toolSlug: string = 'rccp', userId?: string) {
  const [data, setData] = useState<TrialStatusData | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));

  const fetchStatus = useCallback(async () => {
    if (!userId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await getTrialStatus(toolSlug);
    if (res.ok) {
      setData(res.data);
    }
    setLoading(false);
  }, [toolSlug, userId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { data, loading, refetch: fetchStatus };
}
