/**
 * Stripe API Version Compatibility Utilities
 *
 * Provides helpers to support multiple Stripe API payload versions seamlessly:
 * - Legacy pinned API versions (e.g. 2023-10-16 / 2024-04-10) with top-level subscription periods and invoice.subscription.
 * - Modern API versions (e.g. 2026-02-25.clover) where subscription periods moved to subscription.items.data[n]
 *   and invoice subscriptions moved to invoice.parent.subscription_details.subscription.
 */

export interface SubscriptionPeriod {
  start: string;
  end: string;
}

/**
 * Extracts subscription current period start and end timestamps as ISO 8601 strings.
 *
 * Resolution order:
 * 1. sub.current_period_start and sub.current_period_end when both are numbers.
 * 2. sub.items.data[0].current_period_start and sub.items.data[0].current_period_end (clover shape).
 *
 * If neither source contains valid numeric timestamps, returns null.
 * Guaranteed never to call .toISOString() on an invalid Date or NaN.
 */
export function getPeriod(sub: any): SubscriptionPeriod | null {
  if (!sub || typeof sub !== 'object') {
    return null;
  }

  let startNum: number | undefined;
  let endNum: number | undefined;

  // 1. Check top-level period timestamps (legacy pinned versions)
  if (
    typeof sub.current_period_start === 'number' &&
    typeof sub.current_period_end === 'number' &&
    !isNaN(sub.current_period_start) &&
    !isNaN(sub.current_period_end)
  ) {
    startNum = sub.current_period_start;
    endNum = sub.current_period_end;
  } else {
    // 2. Check first item in items.data (clover / multi-item subscription models)
    const firstItem = sub.items?.data?.[0];
    if (
      firstItem &&
      typeof firstItem.current_period_start === 'number' &&
      typeof firstItem.current_period_end === 'number' &&
      !isNaN(firstItem.current_period_start) &&
      !isNaN(firstItem.current_period_end)
    ) {
      startNum = firstItem.current_period_start;
      endNum = firstItem.current_period_end;
    }
  }

  if (startNum === undefined || endNum === undefined) {
    return null;
  }

  const startDate = new Date(startNum * 1000);
  const endDate = new Date(endNum * 1000);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return null;
  }

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
}

/**
 * Resolves the Stripe subscription ID from an invoice object across API versions.
 *
 * Resolution order:
 * 1. invoice.subscription (string ID or object with id property)
 * 2. invoice.parent?.subscription_details?.subscription (string ID or object with id property)
 *
 * Returns trimmed subscription ID string, or null if unresolvable.
 */
export function getInvoiceSubscriptionId(invoice: any): string | null {
  if (!invoice || typeof invoice !== 'object') {
    return null;
  }

  // 1. Check top-level invoice.subscription (legacy shape)
  const directSub = invoice.subscription;
  if (typeof directSub === 'string' && directSub.trim().length > 0) {
    return directSub.trim();
  }
  if (
    directSub &&
    typeof directSub === 'object' &&
    typeof directSub.id === 'string' &&
    directSub.id.trim().length > 0
  ) {
    return directSub.id.trim();
  }

  // 2. Check invoice.parent?.subscription_details?.subscription (clover shape)
  const parentSub = invoice.parent?.subscription_details?.subscription;
  if (typeof parentSub === 'string' && parentSub.trim().length > 0) {
    return parentSub.trim();
  }
  if (
    parentSub &&
    typeof parentSub === 'object' &&
    typeof parentSub.id === 'string' &&
    parentSub.id.trim().length > 0
  ) {
    return parentSub.id.trim();
  }

  return null;
}
