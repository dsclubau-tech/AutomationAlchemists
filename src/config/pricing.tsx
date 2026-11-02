import React from 'react';

/**
 * Central Pricing Configuration for Automation Alchemists.
 *
 * Current business facts:
 * - Paid product: CP Bot (named "Copy Paste Bot" in Stripe, slug "cpbot", lookup "rccp").
 * - Return Converter and Invoice Generator are FREE.
 * - Standard price: A$9.99/mo (GST inclusive).
 * - Launch price: A$4.99/mo (GST inclusive, currently active checkout price).
 * - No countdown or end date is set; launchEndsOn is null.
 */
export const PRICING_CONFIG = {
  standardPrice: 9.99,
  launchPrice: 4.99,
  currency: 'AUD' as const,
  gstInclusive: true as const,
  launchEndsOn: null as string | null,
};

export const TERMS_URL = 'https://rccp.automationalchemists.com/terms-of-service';
export const PRIVACY_URL = 'https://rccp.automationalchemists.com/privacy';

export function formatPrice(amount: number, prefix: string = 'A$'): string {
  return `${prefix}${amount.toFixed(2)}`;
}

/**
 * Exact plain text trial copy for tests / non-React contexts:
 * "Free for 30 days, then A$4.99/month (launch price, normally A$9.99), incl. GST, charged automatically until you cancel. By starting your trial you agree to the Terms of Service and Privacy Policy."
 */
export function getTrialLineText(trialDays: number = 30): string {
  return `Free for ${trialDays} days, then ${formatPrice(PRICING_CONFIG.launchPrice)}/month (launch price, normally ${formatPrice(PRICING_CONFIG.standardPrice)}), incl. GST, charged automatically until you cancel. By starting your trial you agree to the Terms of Service and Privacy Policy.`;
}

/**
 * Reusable trial line component rendered next to every trial CTA button.
 * Links to Terms of Service and Privacy Policy opening in new tabs with rel="noopener noreferrer".
 */
export const TrialTermsLine: React.FC<{
  trialDays?: number;
  className?: string;
}> = ({
  trialDays = 30,
  className = 'text-xs text-teal-900/70 font-display',
}) => {
  return (
    <span className={className}>
      Free for {trialDays} days, then {formatPrice(PRICING_CONFIG.launchPrice)}/month (launch price, normally {formatPrice(PRICING_CONFIG.standardPrice)}), incl. GST, charged automatically until you cancel. By starting your trial you agree to the{' '}
      <a
        href={TERMS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-teal-900 transition-colors"
      >
        Terms of Service
      </a>{' '}
      and{' '}
      <a
        href={PRIVACY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="underline hover:text-teal-900 transition-colors"
      >
        Privacy Policy
      </a>
      .
    </span>
  );
};

/**
 * Reusable launch price display component:
 * Crossed-out standard price (with sr-only was A$9.99), launch price A$4.99/month, Launch price badge, and incl. GST.
 */
export const LaunchPriceDisplay: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 gap-y-1 ${className}`}>
      <span className="line-through text-teal-900/50 text-sm">
        <s>
          <span className="sr-only">was {formatPrice(PRICING_CONFIG.standardPrice)}</span>
          {formatPrice(PRICING_CONFIG.standardPrice)}
        </s>
      </span>
      <span className="font-bold text-teal-900 text-base">
        {formatPrice(PRICING_CONFIG.launchPrice)}/month
      </span>
      <span className="text-xs bg-teal-600/10 text-teal-700 font-semibold px-2 py-0.5 rounded font-display whitespace-nowrap">
        Launch price
      </span>
      <span className="text-xs text-teal-900/60 font-medium font-display whitespace-nowrap">
        incl. GST
      </span>
    </span>
  );
};
