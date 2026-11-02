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
 * Formats dates in Australia/Sydney timezone using en-AU locale, e.g. "30 November 2026".
 */
export function formatBillingDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
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

  // 2. Expired or canceled and ended
  if (isEnded || subscription.status === 'canceled') {
    if (isEnded || !subscription.current_period_end) {
      return {
        state: 'expired',
        banner: null,
        primaryAction: {
          action: 'subscribe',
          label: 'Subscribe',
        },
      };
    }
  }

  // 3. TRIALING state (status === 'trialing' or is_trial is true)
  const isTrial = Boolean(subscription.is_trial || subscription.status === 'trialing');
  if (isTrial && (subscription.status === 'active' || subscription.status === 'trialing')) {
    const formattedDate = formatBillingDate(subscription.current_period_end);
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

  // 5. Canceled status with future period end
  if (subscription.status === 'canceled' && !isEnded && subscription.current_period_end) {
    const formattedDate = formatBillingDate(subscription.current_period_end);
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
