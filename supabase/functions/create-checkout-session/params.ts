export const CARD_DENIAL_RETRY_CAP = 3;

/**
 * Checks whether the number of card denials has reached or exceeded the retry cap (3).
 * When true, trial eligibility is revoked and checkout falls back to standard paid checkout.
 */
export function isCardDenialCapExceeded(cardDenialCount: number, cap: number = CARD_DENIAL_RETRY_CAP): boolean {
  return cardDenialCount >= cap;
}

export interface DetermineTrialEligibilityInput {
  productSlug: string;
  isEligibleFromRpc?: boolean;
  rpcTrialDays?: number;
  rpcReason?: string | null;
  cardDenialCount?: number;
  skipTrial?: boolean;
}

export interface DetermineTrialEligibilityResult {
  isEligibleTrial: boolean;
  trialDays: number;
  reason: string | null;
}

/**
 * Pure helper deciding trial eligibility.
 * Rules:
 * 1. Only 'rccp' product can have a trial.
 * 2. If client requests skipTrial, trial is stripped (client can only REMOVE trial, never grant one).
 * 3. Server-side RPC eligibility must be true; otherwise trial is denied with RPC reason.
 * 4. Card denial count must be under CARD_DENIAL_RETRY_CAP (3); otherwise capped.
 */
export function determineTrialEligibility(
  input: DetermineTrialEligibilityInput
): DetermineTrialEligibilityResult {
  if (input.productSlug !== 'rccp') {
    return { isEligibleTrial: false, trialDays: 0, reason: null };
  }

  // Client skipTrial flag can only REMOVE the trial, never grant one.
  if (input.skipTrial) {
    return { isEligibleTrial: false, trialDays: 0, reason: 'skip_trial' };
  }

  if (!input.isEligibleFromRpc) {
    return {
      isEligibleTrial: false,
      trialDays: 0,
      reason: input.rpcReason || 'not_eligible',
    };
  }

  if (isCardDenialCapExceeded(input.cardDenialCount ?? 0)) {
    return {
      isEligibleTrial: false,
      trialDays: 0,
      reason: 'card_denials_capped',
    };
  }

  return {
    isEligibleTrial: true,
    trialDays: Number(input.rpcTrialDays) || 30,
    reason: null,
  };
}

export const TERMS_URL = 'https://rccp.automationalchemists.com/terms-of-service';
export const PRIVACY_URL = 'https://rccp.automationalchemists.com/privacy';
export const TERMS_CONSENT_MESSAGE = `I agree to the [Terms of Service](${TERMS_URL}) and [Privacy Policy](${PRIVACY_URL}).`;

export interface BuildCheckoutSessionParamsOptions {
  user: {
    id: string;
    email?: string | null;
  };
  productSlug: string;
  effectiveQuantity: number;
  productId: string;
  basePriceId: string;
  finalUnitAmount: number | null;
  priceSource: string;
  origin: string;
  isEligibleTrial: boolean;
  trialDays?: number;
  gstTaxRateId?: string | null;
  trialStartDate?: Date;
  catalogPriceMonthly?: number | null;
  customerId?: string | null;
  nameCollection?: {
    individual?: {
      enabled: boolean;
      optional?: boolean;
    };
    business?: {
      enabled: boolean;
      optional?: boolean;
    };
  } | null;
}

export interface CheckoutSessionParams {
  payment_method_types: string[];
  mode: 'subscription';
  customer?: string;
  customer_email?: string;
  customer_update?: {
    name?: 'auto' | 'never';
    address?: 'auto' | 'never';
    shipping?: 'auto' | 'never';
  };
  billing_address_collection: 'required';
  name_collection?: {
    individual?: {
      enabled: boolean;
      optional?: boolean;
    };
    business?: {
      enabled: boolean;
      optional?: boolean;
    };
  };
  client_reference_id: string;
  metadata: Record<string, string>;
  subscription_data: {
    metadata: Record<string, string>;
    default_tax_rates: string[];
    trial_period_days?: number;
    trial_settings?: {
      end_behavior: {
        missing_payment_method: 'cancel';
      };
    };
  };
  line_items: Array<{
    price_data?: {
      currency: string;
      unit_amount: number;
      recurring: { interval: 'month' };
      product: string;
    };
    price?: string;
    quantity: number;
  }>;
  success_url: string;
  cancel_url: string;
  consent_collection: {
    terms_of_service: 'required';
  };
  custom_text: {
    terms_of_service_acceptance: {
      message: string;
    };
    submit?: {
      message: string;
    };
  };
  payment_method_collection?: 'always';
  phone_number_collection: {
    enabled: boolean;
  };
}

/**
 * Pure helper to build Stripe Checkout Session parameters.
 * Enforces:
 * - FAIL CLOSED if gstTaxRateId is missing or empty string.
 * - subscription_data.default_tax_rates = [gstTaxRateId] on both trial & non-trial.
 * - billing_address_collection = 'required' across all sessions.
 * - phone_number_collection = { enabled: true } across all sessions.
 * - customer_update = { name: 'auto', address: 'auto' } ONLY when customerId is provided.
 * - name_collection included when provided (e.g. { individual: { enabled: true, optional: false }, business: { enabled: true, optional: true } }).
 * - terms consent collection = 'required' with custom_text markdown links.
 * - ABSOLUTELY NO automatic_tax.
 */
export function buildCheckoutSessionParams(
  options: BuildCheckoutSessionParamsOptions
): CheckoutSessionParams {
  const taxRateId = options.gstTaxRateId?.trim();
  if (!taxRateId) {
    throw new Error('GST tax rate not configured');
  }

  const lineItems = options.finalUnitAmount !== null
    ? [
        {
          price_data: {
            currency: 'aud',
            unit_amount: options.finalUnitAmount,
            recurring: { interval: 'month' as const },
            product: options.productId,
          },
          quantity: options.effectiveQuantity,
        },
      ]
    : [
        {
          price: options.basePriceId,
          quantity: options.effectiveQuantity,
        },
      ];

  const sessionMetadata: Record<string, string> = {
    user_id: options.user.id,
    tool_slug: options.productSlug,
    price_source: options.priceSource,
  };

  const params: CheckoutSessionParams = {
    payment_method_types: ['card'],
    mode: 'subscription',
    client_reference_id: options.user.id,
    billing_address_collection: 'required',
    phone_number_collection: {
      enabled: true,
    },
    metadata: sessionMetadata,
    subscription_data: {
      metadata: sessionMetadata,
      default_tax_rates: [taxRateId],
    },
    line_items: lineItems,
    success_url: `${options.origin}/dashboard?checkout=success`,
    cancel_url: `${options.origin}/tools/${options.productSlug}`,
    consent_collection: {
      terms_of_service: 'required',
    },
    custom_text: {
      terms_of_service_acceptance: {
        message: TERMS_CONSENT_MESSAGE,
      },
    },
  };

  if (options.customerId) {
    params.customer = options.customerId;
    params.customer_update = {
      name: 'auto',
      address: 'auto',
    };
  } else if (options.user.email) {
    params.customer_email = options.user.email;
  }

  if (options.nameCollection) {
    params.name_collection = options.nameCollection;
  }

  if (options.isEligibleTrial) {
    sessionMetadata.trial = 'true';
    params.metadata = sessionMetadata;
    const trialDays = options.trialDays || 30;

    params.subscription_data = {
      metadata: sessionMetadata,
      trial_period_days: trialDays,
      trial_settings: {
        end_behavior: {
          missing_payment_method: 'cancel',
        },
      },
      default_tax_rates: [taxRateId],
    };
    params.payment_method_collection = 'always';
    params.phone_number_collection = {
      enabled: true,
    };

    let priceNumber = 4.99;
    if (options.finalUnitAmount !== null && options.finalUnitAmount !== undefined) {
      priceNumber = options.finalUnitAmount / 100;
    } else if (options.catalogPriceMonthly !== undefined && options.catalogPriceMonthly !== null) {
      const cleaned = String(options.catalogPriceMonthly).replace(/[^0-9.]/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed) && parsed > 0) {
        priceNumber = parsed;
      }
    }

    const displayPrice = priceNumber.toFixed(2);

    params.custom_text.submit = {
      message: `${trialDays} days free, then A$${displayPrice}/month (incl. GST), charged automatically until you cancel.`,
    };
  }

  // Strict assertion: ensure no automatic_tax anywhere
  const untyped = params as Record<string, unknown>;
  if ('automatic_tax' in untyped || 'automatic_tax' in (params.subscription_data as Record<string, unknown>)) {
    throw new Error('automatic_tax must never be enabled');
  }

  return params;
}
