export type TrialBannerState = 'loading' | 'available' | 'low' | 'sold_out' | 'hidden';

export interface TrialBannerInput {
  spotsLeft?: number | null;
  slotCap?: number | null;
  enabled?: boolean | null;
  trialDays?: number | null;
  loading?: boolean;
  fetchError?: boolean;
}

export interface TrialBannerView {
  state: TrialBannerState;
  shouldRender: boolean;
  spotsLeft: number;
  slotCap: number;
  percentageLeft: number;
  badgeText: string;
  headline: string;
  subtext: string;
  isUrgent: boolean;
  ctaText: string;
  ctaMode: 'start_trial' | 'get_access';
}

/**
 * Pure helper evaluating trial banner display state.
 *
 * States:
 * - 'loading': skeleton placeholder, no layout jump.
 * - 'hidden': offer disabled, fetch error, or invalid cap.
 * - 'sold_out': 0 spots left; truthfully explains spots are full and CP Bot is available at launch price.
 * - 'low': spotsLeft <= 10% of slotCap; subtle urgency styling ("Only N left").
 * - 'available': normal state with real spots left.
 */
export function getTrialBannerView(input: TrialBannerInput): TrialBannerView {
  if (input.loading) {
    return {
      state: 'loading',
      shouldRender: true,
      spotsLeft: 0,
      slotCap: 0,
      percentageLeft: 0,
      badgeText: '',
      headline: '',
      subtext: '',
      isUrgent: false,
      ctaText: '',
      ctaMode: 'start_trial',
    };
  }

  if (
    input.fetchError ||
    input.enabled === false ||
    input.enabled === null ||
    input.enabled === undefined ||
    input.slotCap === null ||
    input.slotCap === undefined ||
    input.slotCap <= 0 ||
    input.spotsLeft === null ||
    input.spotsLeft === undefined
  ) {
    return {
      state: 'hidden',
      shouldRender: false,
      spotsLeft: 0,
      slotCap: 0,
      percentageLeft: 0,
      badgeText: '',
      headline: '',
      subtext: '',
      isUrgent: false,
      ctaText: '',
      ctaMode: 'start_trial',
    };
  }

  const slotCap = input.slotCap;
  const spotsLeft = Math.max(0, input.spotsLeft);
  const percentageLeft = Math.max(0, Math.min(100, Math.round((spotsLeft / slotCap) * 100)));
  const trialDays = input.trialDays || 30;

  if (spotsLeft === 0) {
    return {
      state: 'sold_out',
      shouldRender: true,
      spotsLeft: 0,
      slotCap,
      percentageLeft: 0,
      badgeText: 'Free trial full',
      headline: 'All free-trial spots have been claimed',
      subtext: 'Free trial capacity is full, but CP Bot is still available at our launch price.',
      isUrgent: false,
      ctaText: 'Get CP Bot now',
      ctaMode: 'get_access',
    };
  }

  // Low boundary: spots left <= 10% of cap (e.g. <= 10 for cap 100, <= 1 for cap 5)
  const lowThreshold = Math.max(1, Math.ceil(slotCap * 0.1));
  const isLow = spotsLeft <= lowThreshold;

  if (isLow) {
    return {
      state: 'low',
      shouldRender: true,
      spotsLeft,
      slotCap,
      percentageLeft,
      badgeText: 'Almost gone',
      headline: `Only ${spotsLeft} free-trial spot${spotsLeft === 1 ? '' : 's'} left`,
      subtext: `${spotsLeft} of ${slotCap} promotional spots remaining before offer closes`,
      isUrgent: true,
      ctaText: 'Claim your spot now',
      ctaMode: 'start_trial',
    };
  }

  return {
    state: 'available',
    shouldRender: true,
    spotsLeft,
    slotCap,
    percentageLeft,
    badgeText: 'Limited free trial',
    headline: `${spotsLeft} of ${slotCap} free-trial spots left`,
    subtext: `Claim your full ${trialDays}-day trial before all spots are taken.`,
    isUrgent: false,
    ctaText: 'Start your free trial',
    ctaMode: 'start_trial',
  };
}
