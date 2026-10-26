import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
 * Never reveals which other account used a card or phone number.
 */
export function getClaimErrorMessage(reason: string, priceMonthly: number = 9): string {
  switch (reason) {
    case 'checkout_required':
      return 'Please complete card verification in checkout to start your free trial.';
    case 'card_already_used':
      return `This card has already been used for a free trial. You can subscribe at A$${priceMonthly}/month instead.`;
    case 'phone_already_used':
      return `This phone number has already been used for a free trial. You can subscribe at A$${priceMonthly}/month instead.`;
    case 'phone_missing':
      return 'A valid phone number is required to start the free trial.';
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
 */
export function formatTrialTimeLeft(endsAt: string): {
  text: string;
  hoursLeft: number;
  daysLeft: number;
  formattedDate: string;
} {
  const endsDate = new Date(endsAt);
  const formattedDate = endsDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const diff = endsDate.getTime() - Date.now();
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
