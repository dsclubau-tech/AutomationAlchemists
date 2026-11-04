import esbuild from 'esbuild';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
  };
}

const paramsEntry = path.resolve(__dirname, '../supabase/functions/create-checkout-session/params.ts');
const billingEntry = path.resolve(__dirname, '../src/lib/billingView.ts');
const pricingEntry = path.resolve(__dirname, '../src/config/pricing.tsx');
const trialEntry = path.resolve(__dirname, '../src/lib/trial.ts');
const authFlowEntry = path.resolve(__dirname, '../src/lib/authFlow.ts');

const tempParamsBundle = path.resolve(__dirname, 'temp-params.mjs');
const tempBillingBundle = path.resolve(__dirname, 'temp-billing.mjs');
const tempPricingBundle = path.resolve(__dirname, 'temp-pricing.mjs');
const tempTrialBundle = path.resolve(__dirname, 'temp-trial.mjs');
const tempAuthFlowBundle = path.resolve(__dirname, 'temp-auth-flow.mjs');

console.log('═══════════════════════════════════════════════════════════════');
console.log('   LAUNCH READINESS TEST SUITE (v1.11.0 Offline Assertions)    ');
console.log('═══════════════════════════════════════════════════════════════\n');

try {
  // Bundle helper modules with esbuild for offline Node execution
  esbuild.buildSync({
    entryPoints: [paramsEntry],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    outfile: tempParamsBundle,
  });

  esbuild.buildSync({
    entryPoints: [billingEntry],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    outfile: tempBillingBundle,
  });

  esbuild.buildSync({
    entryPoints: [pricingEntry],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    outfile: tempPricingBundle,
  });

  esbuild.buildSync({
    entryPoints: [trialEntry],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': '"https://mock.supabase.co"',
      'import.meta.env.VITE_SUPABASE_ANON_KEY': '"mock-anon-key"',
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': '"mock-key"',
    },
    outfile: tempTrialBundle,
  });

  esbuild.buildSync({
    entryPoints: [authFlowEntry],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
    outfile: tempAuthFlowBundle,
  });
  const { buildCheckoutSessionParams, isCardDenialCapExceeded, determineTrialEligibility, CARD_DENIAL_RETRY_CAP, TERMS_URL, PRIVACY_URL } = await import(`file://${tempParamsBundle.replace(/\\/g, '/')}`);
  const { getBillingView, formatBillingDate, getEffectiveTrialEnd, TRIAL_GRACE_BUFFER_HOURS, TRIAL_GRACE_BUFFER_MS } = await import(`file://${tempBillingBundle.replace(/\\/g, '/')}`);
  const { getClaimErrorMessage, getDeniedTrialChoice, getSubscribeButtonText } = await import(`file://${tempTrialBundle.replace(/\\/g, '/')}`);
  const { getSignUpSuccessState, SIGNUP_CONFIRMATION_NOTICE } = await import(`file://${tempAuthFlowBundle.replace(/\\/g, '/')}`);
  const { PRICING_CONFIG, formatPrice, getTrialLineText } = await import(`file://${tempPricingBundle.replace(/\\/g, '/')}`);

  // ─────────────────────────────────────────────────────────────
  // (A) Checkout Params Helper Tests
  // ─────────────────────────────────────────────────────────────
  console.log('--- Suite A: Checkout Parameters Helper ---');

  // Test A1: Fails closed when GST tax rate ID is missing or empty
  assert.throws(
    () => {
      buildCheckoutSessionParams({
        user: { id: 'usr_test_1', email: 'test@example.com' },
        productSlug: 'rccp',
        effectiveQuantity: 1,
        productId: 'prod_rccp_live',
        basePriceId: 'price_rccp_launch',
        finalUnitAmount: 499,
        priceSource: 'admin_price',
        origin: 'https://automationalchemists.com',
        isEligibleTrial: false,
        gstTaxRateId: '',
      });
    },
    /GST tax rate not configured/,
    'Must throw clear error when gstTaxRateId is empty'
  );

  assert.throws(
    () => {
      buildCheckoutSessionParams({
        user: { id: 'usr_test_1', email: 'test@example.com' },
        productSlug: 'rccp',
        effectiveQuantity: 1,
        productId: 'prod_rccp_live',
        basePriceId: 'price_rccp_launch',
        finalUnitAmount: 499,
        priceSource: 'admin_price',
        origin: 'https://automationalchemists.com',
        isEligibleTrial: false,
        gstTaxRateId: undefined,
      });
    },
    /GST tax rate not configured/,
    'Must throw clear error when gstTaxRateId is undefined'
  );
  console.log('  ✓ Test A1: Fails closed when STRIPE_GST_TAX_RATE_ID is missing or empty.');

  // Test A2: Standard checkout params (non-trial)
  const standardParams = buildCheckoutSessionParams({
    user: { id: 'usr_paid_123', email: 'paid@example.com' },
    productSlug: 'rccp',
    effectiveQuantity: 1,
    productId: 'prod_rccp_live',
    basePriceId: 'price_rccp_launch',
    finalUnitAmount: 499,
    priceSource: 'admin_price',
    origin: 'https://automationalchemists.com',
    isEligibleTrial: false,
    gstTaxRateId: 'txr_gst_manual_live_123',
  });

  assert.strictEqual(standardParams.mode, 'subscription');
  assert.strictEqual(standardParams.customer_email, 'paid@example.com');
  assert.strictEqual(standardParams.metadata.tool_slug, 'rccp');
  assert.deepStrictEqual(standardParams.subscription_data.default_tax_rates, ['txr_gst_manual_live_123']);
  assert.strictEqual(standardParams.consent_collection.terms_of_service, 'required');
  assert.ok(standardParams.custom_text.terms_of_service_acceptance.message.includes(TERMS_URL));
  assert.ok(standardParams.custom_text.terms_of_service_acceptance.message.includes(PRIVACY_URL));
  assert.strictEqual('automatic_tax' in standardParams, false, 'Root params must NOT contain automatic_tax');
  assert.strictEqual('automatic_tax' in standardParams.subscription_data, false, 'subscription_data must NOT contain automatic_tax');
  assert.strictEqual(standardParams.line_items[0].price_data?.unit_amount, 499);
  console.log('  ✓ Test A2: Standard non-trial params include default_tax_rates, terms consent, NO automatic_tax.');

  // Test A3: Trial checkout params
  const trialParams = buildCheckoutSessionParams({
    user: { id: 'usr_trial_456', email: 'trial@example.com' },
    productSlug: 'rccp',
    effectiveQuantity: 1,
    productId: 'prod_rccp_live',
    basePriceId: 'price_rccp_launch',
    finalUnitAmount: 499,
    priceSource: 'admin_price',
    origin: 'https://automationalchemists.com',
    isEligibleTrial: true,
    trialDays: 30,
    gstTaxRateId: 'txr_gst_manual_live_123',
    trialStartDate: new Date('2026-11-01T00:00:00Z'),
  });

  assert.strictEqual(trialParams.metadata.trial, 'true');
  assert.strictEqual(trialParams.subscription_data.trial_period_days, 30);
  assert.strictEqual(trialParams.subscription_data.trial_settings?.end_behavior.missing_payment_method, 'cancel');
  assert.deepStrictEqual(trialParams.subscription_data.default_tax_rates, ['txr_gst_manual_live_123']);
  assert.strictEqual(trialParams.payment_method_collection, 'always');
  assert.strictEqual(trialParams.phone_number_collection?.enabled, true);
  assert.strictEqual(trialParams.consent_collection.terms_of_service, 'required');
  assert.strictEqual(
    trialParams.custom_text.submit?.message,
    '30 days free, then A$4.99/month (incl. GST), charged automatically until you cancel.'
  );
  assert.strictEqual(trialParams.custom_text.submit?.message.includes('A$$'), false, 'Must not contain double dollar signs');
  assert.strictEqual('automatic_tax' in trialParams, false, 'Trial params must NOT contain automatic_tax');
  assert.strictEqual('automatic_tax' in trialParams.subscription_data, false, 'Trial subscription_data must NOT contain automatic_tax');

  // Test A4: Override with fixed_price 300 cents (A$3.00)
  const overrideTrialParams = buildCheckoutSessionParams({
    user: { id: 'usr_override_789', email: 'discount@example.com' },
    productSlug: 'rccp',
    effectiveQuantity: 1,
    productId: 'prod_rccp_live',
    basePriceId: 'price_rccp_launch',
    finalUnitAmount: 300,
    priceSource: 'user_override',
    origin: 'https://automationalchemists.com',
    isEligibleTrial: true,
    trialDays: 30,
    gstTaxRateId: 'txr_gst_manual_live_123',
  });

  assert.strictEqual(
    overrideTrialParams.custom_text.submit?.message,
    '30 days free, then A$3.00/month (incl. GST), charged automatically until you cancel.'
  );
  assert.strictEqual(overrideTrialParams.custom_text.submit?.message.includes('A$$'), false);
  assert.strictEqual(standardParams.custom_text?.submit?.message, undefined, 'Non-trial session must not have submit trial message');
  console.log('  ✓ Test A3: Trial params include trial settings, phone collection, default_tax_rates, NO automatic_tax.');
  console.log('  ✓ Test A4: custom_text.submit message verified for standard trial, non-trial, and 300c override.');

  // Test A5: Billing address is required and phone number collection is enabled on all checkouts
  assert.strictEqual(standardParams.billing_address_collection, 'required');
  assert.strictEqual(trialParams.billing_address_collection, 'required');
  assert.strictEqual(standardParams.phone_number_collection?.enabled, true);
  assert.strictEqual(trialParams.phone_number_collection?.enabled, true);
  console.log('  ✓ Test A5: billing_address_collection is required and phone_number_collection is enabled on all sessions.');

  // Test A6: name_collection supports required individual name and optional business name
  const nameCollectionConfig = {
    individual: { enabled: true, optional: false },
    business: { enabled: true, optional: true },
  };
  const sessionWithNameCollection = buildCheckoutSessionParams({
    user: { id: 'usr_business_1', email: 'business@example.com' },
    productSlug: 'rccp',
    effectiveQuantity: 1,
    productId: 'prod_rccp_live',
    basePriceId: 'price_rccp_launch',
    finalUnitAmount: 499,
    priceSource: 'admin_price',
    origin: 'https://automationalchemists.com',
    isEligibleTrial: false,
    gstTaxRateId: 'txr_gst_manual_live_123',
    nameCollection: nameCollectionConfig,
  });

  assert.deepStrictEqual(sessionWithNameCollection.name_collection, nameCollectionConfig);
  assert.strictEqual(sessionWithNameCollection.name_collection.individual.optional, false);
  assert.strictEqual(sessionWithNameCollection.name_collection.business.optional, true);
  assert.strictEqual(standardParams.name_collection, undefined, 'Default session without nameCollection option omits name_collection');
  console.log('  ✓ Test A6: name_collection supports individual required and business optional.');

  // Test A7: customer_update only valid together with customer id
  const sessionWithCustomer = buildCheckoutSessionParams({
    user: { id: 'usr_cust_1', email: 'cust@example.com' },
    productSlug: 'rccp',
    effectiveQuantity: 1,
    productId: 'prod_rccp_live',
    basePriceId: 'price_rccp_launch',
    finalUnitAmount: 499,
    priceSource: 'admin_price',
    origin: 'https://automationalchemists.com',
    isEligibleTrial: false,
    gstTaxRateId: 'txr_gst_manual_live_123',
    customerId: 'cus_existing_12345',
  });

  assert.strictEqual(sessionWithCustomer.customer, 'cus_existing_12345');
  assert.deepStrictEqual(sessionWithCustomer.customer_update, { name: 'auto', address: 'auto' });
  assert.strictEqual(sessionWithCustomer.customer_email, undefined, 'When customer ID is present, customer_email must not be passed');

  // When customerId is NOT provided, customer_update must be omitted
  assert.strictEqual(standardParams.customer, undefined);
  assert.strictEqual(standardParams.customer_email, 'paid@example.com');
  assert.strictEqual('customer_update' in standardParams, false, 'customer_update must be omitted when customer_email is used');
  console.log('  ✓ Test A7: customer_update ({ name: "auto", address: "auto" }) attached ONLY when customer ID is provided; omitted with customer_email.\n');

  // ─────────────────────────────────────────────────────────────
  // (B) getBillingView Pure Helper Tests
  // ─────────────────────────────────────────────────────────────
  console.log('--- Suite B: getBillingView Pure Function Tests ---');

  const fixedNow = new Date('2026-11-02T12:00:00Z');

  // Test B1: Null / undefined subscription -> none
  const viewNone = getBillingView(null, fixedNow);
  assert.strictEqual(viewNone.state, 'none');
  assert.strictEqual(viewNone.banner, null);
  assert.strictEqual(viewNone.primaryAction?.action, 'subscribe');
  console.log('  ✓ Test B1: Null subscription returns none state with subscribe action.');

  // Test B2: Expired subscription -> expired
  const viewExpired = getBillingView({
    product_slug: 'cpbot',
    status: 'active',
    current_period_end: '2026-10-01T00:00:00Z', // in past relative to fixedNow
    is_trial: false,
  }, fixedNow);
  assert.strictEqual(viewExpired.state, 'expired');
  assert.strictEqual(viewExpired.banner, null);
  assert.strictEqual(viewExpired.primaryAction?.action, 'subscribe');
  console.log('  ✓ Test B2: Expired period_end returns expired state with subscribe action.');

  // Test B3: Trial active (is_trial true)
  const viewTrial = getBillingView({
    product_slug: 'cpbot',
    status: 'trialing',
    current_period_end: '2026-11-30T00:00:00Z',
    is_trial: true,
    cancel_at_period_end: false,
  }, fixedNow);
  assert.strictEqual(viewTrial.state, 'trialing');
  assert.ok(viewTrial.banner?.startsWith('Free trial active - ends on 30 November 2026'));
  assert.strictEqual(viewTrial.primaryAction?.action, 'manage_billing');
  assert.strictEqual(viewTrial.primaryAction?.label, 'Manage billing');
  console.log('  ✓ Test B3: Trial active displays formatted end date in Sydney time and Manage billing action.');

  // Test B4: Trial active with cancel_at_period_end: true
  const viewTrialCanceling = getBillingView({
    product_slug: 'cpbot',
    status: 'trialing',
    current_period_end: '2026-11-30T00:00:00Z',
    is_trial: true,
    cancel_at_period_end: true,
  }, fixedNow);
  assert.strictEqual(viewTrialCanceling.state, 'trialing_canceled');
  assert.ok(viewTrialCanceling.banner?.startsWith('Trial cancelled - access until 30 November 2026'));
  assert.strictEqual(viewTrialCanceling.primaryAction?.action, 'manage_billing');
  console.log('  ✓ Test B4: Trial cancel_at_period_end displays "Trial cancelled - access until <date>".');

  // Test B5: Active paid subscription
  const viewActivePaid = getBillingView({
    product_slug: 'cpbot',
    status: 'active',
    current_period_end: '2026-11-30T00:00:00Z',
    is_trial: false,
    cancel_at_period_end: false,
  }, fixedNow);
  assert.strictEqual(viewActivePaid.state, 'active');
  assert.ok(viewActivePaid.banner?.startsWith('Subscription active - renews on 30 November 2026'));
  assert.strictEqual(viewActivePaid.primaryAction?.action, 'manage_billing');
  console.log('  ✓ Test B5: Active paid displays "Subscription active - renews on <date>" and Manage billing.');

  // Test B6: Active paid with cancel_at_period_end: true
  const viewPaidCanceling = getBillingView({
    product_slug: 'cpbot',
    status: 'active',
    current_period_end: '2026-11-30T00:00:00Z',
    is_trial: false,
    cancel_at_period_end: true,
  }, fixedNow);
  assert.strictEqual(viewPaidCanceling.state, 'active_canceled');
  assert.ok(viewPaidCanceling.banner?.startsWith('Cancelled - access until 30 November 2026'));
  assert.strictEqual(viewPaidCanceling.primaryAction?.action, 'manage_billing');
  console.log('  ✓ Test B6: Active cancel_at_period_end displays "Cancelled - access until <date>".');

  // Test B7: PAST_DUE state
  const viewPastDue = getBillingView({
    product_slug: 'cpbot',
    status: 'past_due',
    current_period_end: '2026-11-30T00:00:00Z',
    is_trial: false,
  }, fixedNow);
  assert.strictEqual(viewPastDue.state, 'past_due');
  assert.strictEqual(
    viewPastDue.banner,
    'Payment failed - CP Bot is paused. Update your payment method to restore access.'
  );
  assert.strictEqual(viewPastDue.primaryAction?.label, 'Update payment method');
  assert.notStrictEqual(viewPastDue.primaryAction?.action, 'subscribe');
  console.log('  ✓ Test B7: past_due displays paused banner and "Update payment method" with NO subscribe action.');

  // Test B8: Trial ending 18:30 Sydney time (buffer crosses midnight into 4 December)
  // Real trial end in Stripe: 2026-12-03T18:30:00+11:00 (2026-12-03T07:30:00.000Z)
  // Webhook stored current_period_end: real end + 6h grace = 2026-12-04T00:30:00+11:00 (2026-12-03T13:30:00.000Z)
  // UI must subtract 6h buffer and display 3 December 2026 in Australia/Sydney time.
  const storedTrialEvening = '2026-12-03T13:30:00.000Z'; // 00:30 on 4 Dec in Sydney
  const effectiveEveningEnd = getEffectiveTrialEnd(storedTrialEvening, true);
  assert.strictEqual(
    formatBillingDate(effectiveEveningEnd),
    '3 December 2026',
    'Effective end must format to 3 December 2026 in Sydney time'
  );

  const viewTrialEvening = getBillingView({
    product_slug: 'cpbot',
    status: 'trialing',
    current_period_end: storedTrialEvening,
    is_trial: true,
  }, fixedNow);
  assert.strictEqual(viewTrialEvening.state, 'trialing');
  assert.strictEqual(viewTrialEvening.banner, 'Free trial active - ends on 3 December 2026');
  assert.strictEqual(viewTrialEvening.formattedDate, '3 December 2026');
  console.log('  ✓ Test B8: Trial ending 18:30 Sydney (buffer crosses midnight) correctly displays 3 December 2026.');

  // Test B9: Trial ending 05:00 Sydney time (buffer does not cross midnight)
  // Real trial end: 2026-12-03T05:00:00+11:00 (2026-12-02T18:00:00.000Z)
  // Webhook stored: 2026-12-03T11:00:00+11:00 (2026-12-03T00:00:00.000Z)
  const storedTrialMorning = '2026-12-03T00:00:00.000Z';
  const effectiveMorningEnd = getEffectiveTrialEnd(storedTrialMorning, true);
  assert.strictEqual(
    formatBillingDate(effectiveMorningEnd),
    '3 December 2026',
    'Morning trial effective end must format to 3 December 2026'
  );

  const viewTrialMorning = getBillingView({
    product_slug: 'cpbot',
    status: 'trialing',
    current_period_end: storedTrialMorning,
    is_trial: true,
  }, fixedNow);
  assert.strictEqual(viewTrialMorning.state, 'trialing');
  assert.strictEqual(viewTrialMorning.banner, 'Free trial active - ends on 3 December 2026');
  assert.strictEqual(viewTrialMorning.formattedDate, '3 December 2026');
  console.log('  ✓ Test B9: Trial ending 05:00 Sydney (buffer does not cross midnight) displays 3 December 2026.');

  // Test B10: Trial ending around daylight-saving transition (April & October 2026)
  // In April 2026: Sydney ends daylight saving on 5 April 2026 (AEDT UTC+11 -> AEST UTC+10 at 03:00 AEDT / 16:00 UTC 4 Apr).
  // Real trial end: 2026-04-05T01:30:00+11:00 (2026-04-04T14:30:00.000Z).
  // Stored +6h buffer: 2026-04-04T20:30:00.000Z (06:30 AEST on 5 Apr 2026).
  const storedAprilDst = '2026-04-04T20:30:00.000Z';
  const effectiveAprilDst = getEffectiveTrialEnd(storedAprilDst, true);
  assert.strictEqual(formatBillingDate(effectiveAprilDst), '5 April 2026');
  const viewAprilDst = getBillingView({
    product_slug: 'cpbot',
    status: 'trialing',
    current_period_end: storedAprilDst,
    is_trial: true,
  }, new Date('2026-04-01T00:00:00Z'));
  assert.strictEqual(viewAprilDst.banner, 'Free trial active - ends on 5 April 2026');

  // October 2026: Sydney begins daylight saving on 4 October 2026 (AEST UTC+10 -> AEDT UTC+11 at 02:00).
  // Real trial end: 2026-10-04T21:00:00+11:00 (2026-10-04T10:00:00.000Z).
  // Stored +6h buffer: 2026-10-04T16:00:00.000Z (03:00 AEDT on 5 Oct 2026 - crossed midnight!).
  const storedOctDst = '2026-10-04T16:00:00.000Z';
  const effectiveOctDst = getEffectiveTrialEnd(storedOctDst, true);
  assert.strictEqual(formatBillingDate(effectiveOctDst), '4 October 2026');
  const viewOctDst = getBillingView({
    product_slug: 'cpbot',
    status: 'trialing',
    current_period_end: storedOctDst,
    is_trial: true,
  }, new Date('2026-10-01T00:00:00Z'));
  assert.strictEqual(viewOctDst.banner, 'Free trial active - ends on 4 October 2026');
  console.log('  ✓ Test B10: Trial ending around daylight-saving change correctly adjusts buffer across transitions.');

  // Test B11: Shared buffer constant verification and paid subscription buffer isolation
  assert.strictEqual(TRIAL_GRACE_BUFFER_HOURS, 6, 'Shared buffer hours must equal 6');
  assert.strictEqual(TRIAL_GRACE_BUFFER_MS, 6 * 60 * 60 * 1000, 'Shared buffer ms must equal 21,600,000');

  // Paid subscription (is_trial = false) must NOT have buffer subtracted
  const paidPeriodEnd = '2026-12-04T00:30:00.000Z'; // 11:30 AM 4 Dec Sydney
  const effectivePaid = getEffectiveTrialEnd(paidPeriodEnd, false);
  assert.strictEqual(effectivePaid?.getTime(), new Date(paidPeriodEnd).getTime(), 'Paid subscription end must not be altered');
  const viewPaid = getBillingView({
    product_slug: 'cpbot',
    status: 'active',
    current_period_end: paidPeriodEnd,
    is_trial: false,
  }, fixedNow);
  assert.strictEqual(viewPaid.banner, 'Subscription active - renews on 4 December 2026');
  console.log('  ✓ Test B11: Shared buffer constants verified and paid subscriptions stay unadjusted.\n');


  // ─────────────────────────────────────────────────────────────
  // (E) Task B - Trial Uniqueness by Email & Card (Phone Removal)
  // ─────────────────────────────────────────────────────────────
  console.log('--- Suite E: Task B Denial Messages & Phone Non-blocking ---');

  // Phone denial reasons are removed and fall back to generic error
  const phoneUsedMsg = getClaimErrorMessage('phone_already_used');
  assert.strictEqual(phoneUsedMsg, 'Something went wrong. Please try again.', 'phone_already_used must return generic message');

  const phoneMissingMsg = getClaimErrorMessage('phone_missing');
  assert.strictEqual(phoneMissingMsg, 'Something went wrong. Please try again.', 'phone_missing must return generic message');

  // Card and email denial reasons remain intact
  const cardUsedMsg = getClaimErrorMessage('card_already_used');
  assert.strictEqual(cardUsedMsg, 'This card has already been used for a free trial. You can subscribe at A$4.99/month instead.');

  const cardMissingMsg = getClaimErrorMessage('card_missing');
  assert.strictEqual(cardMissingMsg, 'A valid payment card is required to start the free trial.');

  const claimedMsg = getClaimErrorMessage('already_claimed');
  assert.strictEqual(claimedMsg, 'This account or email has already used the free trial.');

  const emailNotAllowedMsg = getClaimErrorMessage('email_not_allowed');
  assert.strictEqual(emailNotAllowedMsg, 'Please use a personal email address to start the free trial.');

  console.log('  ✓ Test E1: Phone denial messages removed; card and email denial messages preserved.\n');

  // ─────────────────────────────────────────────────────────────
  // (F) Release v1.15.0 - Denied-Trial Choices & Sign-Up Flow Tests
  // ─────────────────────────────────────────────────────────────
  console.log('--- Suite F: Denied-Trial Choices & Sign-Up Flow Tests ---');

  // Test F1: isCardDenialCapExceeded pure helper
  assert.strictEqual(isCardDenialCapExceeded(0), false);
  assert.strictEqual(isCardDenialCapExceeded(1), false);
  assert.strictEqual(isCardDenialCapExceeded(2), false);
  assert.strictEqual(isCardDenialCapExceeded(3), true);
  assert.strictEqual(isCardDenialCapExceeded(4), true);
  console.log('  ✓ Test F1: Card denial retry cap (3) evaluated correctly server-side.');

  // Test F2: getDeniedTrialChoice for card_already_used under cap (< 3)
  const cardDeniedUnderCap = getDeniedTrialChoice('card_already_used', 1);
  assert.strictEqual(cardDeniedUnderCap.isDenied, true);
  assert.strictEqual(cardDeniedUnderCap.canRetryCard, true, 'Must allow retry with another card under cap');
  assert.strictEqual(cardDeniedUnderCap.isCapped, false);
  assert.strictEqual(cardDeniedUnderCap.useAnotherCardButtonText, 'Use another card');
  assert.strictEqual(cardDeniedUnderCap.subscribeButtonText, 'Subscribe at A$4.99/month');
  console.log('  ✓ Test F2: Card denial under cap offers "Use another card" and "Subscribe at A$4.99/month".');

  // Test F3: getDeniedTrialChoice for card_already_used at or above cap (>= 3)
  const cardDeniedCapped = getDeniedTrialChoice('card_already_used', 3);
  assert.strictEqual(cardDeniedCapped.isDenied, true);
  assert.strictEqual(cardDeniedCapped.canRetryCard, false, 'Must NOT show "Use another card" when capped');
  assert.strictEqual(cardDeniedCapped.isCapped, true);
  assert.strictEqual(cardDeniedCapped.description, 'The free trial is no longer available for this account.');
  assert.strictEqual(cardDeniedCapped.subscribeButtonText, 'Subscribe at A$4.99/month');
  console.log('  ✓ Test F3: Card denial at cap shows only Subscribe with plain text no longer available.');

  // Test F4: getDeniedTrialChoice for already_claimed (email already used)
  const emailDenied = getDeniedTrialChoice('already_claimed', 0);
  assert.strictEqual(emailDenied.isDenied, true);
  assert.strictEqual(emailDenied.canRetryCard, false, 'Must NOT show "Use another card" for email denial');
  assert.strictEqual(emailDenied.subscribeButtonText, 'Subscribe at A$4.99/month');
  console.log('  ✓ Test F4: Email denial shows ONLY the Subscribe button without card retry.');

  // Test F5: getSignUpSuccessState pure helper
  const signupUnconfirmed = getSignUpSuccessState({ email: 'newcustomer@example.com', hasSession: false });
  assert.strictEqual(signupUnconfirmed.isSignUp, false, 'Must switch to Sign in tab');
  assert.strictEqual(signupUnconfirmed.prefilledEmail, 'newcustomer@example.com', 'Must pre-fill email address');
  assert.strictEqual(signupUnconfirmed.clearedPassword, '', 'Password must NEVER be pre-filled');
  assert.strictEqual(signupUnconfirmed.notice, SIGNUP_CONFIRMATION_NOTICE);
  assert.strictEqual(signupUnconfirmed.notice, 'Account created. Check your email to confirm your account, then sign in.');
  assert.strictEqual(signupUnconfirmed.shouldNavigate, false, 'Must not navigate or sign in automatically');

  const signupWithSession = getSignUpSuccessState({ email: 'auto@example.com', hasSession: true });
  assert.strictEqual(signupWithSession.shouldNavigate, true);
  console.log('  ✓ Test F5: Sign-up state transition correctly switches to Sign in, pre-fills email, clears password, and sets notice.\n');

  // ─────────────────────────────────────────────────────────────
  // (G) Release v1.15.1 - Non-Trial Subscribe Path & Skip-Trial Tests
  // ─────────────────────────────────────────────────────────────
  console.log('--- Suite G: Non-Trial Subscribe Path & Skip-Trial Tests ---');

  // Test G1: Subscribe path (skipTrial: true) -> no trial params, paid checkout today
  const subscribeDecision = determineTrialEligibility({
    productSlug: 'rccp',
    isEligibleFromRpc: true,
    rpcTrialDays: 30,
    cardDenialCount: 1,
    skipTrial: true,
  });
  assert.strictEqual(subscribeDecision.isEligibleTrial, false, 'Subscribe path must revoke trial eligibility');
  assert.strictEqual(subscribeDecision.trialDays, 0);
  assert.strictEqual(subscribeDecision.reason, 'skip_trial');

  const subscribeParams = buildCheckoutSessionParams({
    user: { id: 'usr_sub_1', email: 'subscriber@example.com' },
    productSlug: 'rccp',
    effectiveQuantity: 1,
    productId: 'prod_rccp_live',
    basePriceId: 'price_rccp_launch',
    finalUnitAmount: 499,
    priceSource: 'admin_price',
    origin: 'https://automationalchemists.com',
    isEligibleTrial: subscribeDecision.isEligibleTrial,
    trialDays: subscribeDecision.trialDays,
    gstTaxRateId: 'txr_123456789',
  });

  assert.strictEqual(subscribeParams.subscription_data.trial_period_days, undefined, 'Subscribe path must NOT set trial_period_days');
  assert.strictEqual(subscribeParams.subscription_data.trial_settings, undefined, 'Subscribe path must NOT set trial_settings');
  assert.strictEqual(subscribeParams.payment_method_collection, undefined, 'Subscribe path must NOT require trial payment_method_collection always');
  assert.strictEqual(subscribeParams.metadata.trial, undefined, 'Session metadata.trial must be undefined');
  assert.strictEqual(subscribeParams.subscription_data.metadata.trial, undefined, 'Subscription metadata.trial must be undefined');
  assert.strictEqual(subscribeParams.custom_text?.submit, undefined, 'Submit message must not have free trial copy');
  assert.strictEqual(subscribeParams.line_items[0].price_data.unit_amount, 499, 'Must charge A$4.99 unit amount today');
  assert.deepStrictEqual(subscribeParams.subscription_data.default_tax_rates, ['txr_123456789'], 'Must apply GST tax rate');
  console.log('  ✓ Test G1: Subscribe path (skipTrial: true) builds non-trial paid checkout with immediate payment today.');

  // Test G2: Use-another-card path (skipTrial: false) -> trial params present
  const retryCardDecision = determineTrialEligibility({
    productSlug: 'rccp',
    isEligibleFromRpc: true,
    rpcTrialDays: 30,
    cardDenialCount: 1,
    skipTrial: false,
  });
  assert.strictEqual(retryCardDecision.isEligibleTrial, true, 'Use-another-card under cap must be eligible for trial');
  assert.strictEqual(retryCardDecision.trialDays, 30);
  assert.strictEqual(retryCardDecision.reason, null);

  const retryCardParams = buildCheckoutSessionParams({
    user: { id: 'usr_trial_retry', email: 'retry@example.com' },
    productSlug: 'rccp',
    effectiveQuantity: 1,
    productId: 'prod_rccp_live',
    basePriceId: 'price_rccp_launch',
    finalUnitAmount: 499,
    priceSource: 'admin_price',
    origin: 'https://automationalchemists.com',
    isEligibleTrial: retryCardDecision.isEligibleTrial,
    trialDays: retryCardDecision.trialDays,
    gstTaxRateId: 'txr_123456789',
  });

  assert.strictEqual(retryCardParams.subscription_data.trial_period_days, 30, 'Trial checkout must set 30 days');
  assert.deepStrictEqual(retryCardParams.subscription_data.trial_settings, { end_behavior: { missing_payment_method: 'cancel' } });
  assert.strictEqual(retryCardParams.payment_method_collection, 'always');
  assert.strictEqual(retryCardParams.metadata.trial, 'true');
  assert.strictEqual(retryCardParams.subscription_data.metadata.trial, 'true');
  assert.strictEqual(retryCardParams.custom_text?.submit?.message, '30 days free, then A$4.99/month (incl. GST), charged automatically until you cancel.');
  console.log('  ✓ Test G2: Use-another-card path (skipTrial: false) preserves 30-day trial parameters.');

  // Test G3: Capped user (cardDenialCount >= 3) -> no trial params
  const cappedDecision = determineTrialEligibility({
    productSlug: 'rccp',
    isEligibleFromRpc: true,
    rpcTrialDays: 30,
    cardDenialCount: 3,
    skipTrial: false,
  });
  assert.strictEqual(cappedDecision.isEligibleTrial, false, 'Capped user must not be eligible for trial');
  assert.strictEqual(cappedDecision.reason, 'card_denials_capped');

  const cappedParams = buildCheckoutSessionParams({
    user: { id: 'usr_capped', email: 'capped@example.com' },
    productSlug: 'rccp',
    effectiveQuantity: 1,
    productId: 'prod_rccp_live',
    basePriceId: 'price_rccp_launch',
    finalUnitAmount: 499,
    priceSource: 'admin_price',
    origin: 'https://automationalchemists.com',
    isEligibleTrial: cappedDecision.isEligibleTrial,
    trialDays: cappedDecision.trialDays,
    gstTaxRateId: 'txr_123456789',
  });

  assert.strictEqual(cappedParams.subscription_data.trial_period_days, undefined, 'Capped user must NOT get trial_period_days');
  assert.strictEqual(cappedParams.subscription_data.trial_settings, undefined, 'Capped user must NOT get trial_settings');
  assert.strictEqual(cappedParams.metadata.trial, undefined);
  console.log('  ✓ Test G3: Capped user (>= 3 card denials) falls back to non-trial parameters.');

  // Test G4: Client-supplied flag security — skipTrial: false cannot grant trial if server denies or for other tools
  const maliciousAttempt = determineTrialEligibility({
    productSlug: 'rccp',
    isEligibleFromRpc: false,
    rpcReason: 'already_claimed',
    skipTrial: false,
  });
  assert.strictEqual(maliciousAttempt.isEligibleTrial, false, 'Client cannot force trial if RPC says ineligible');
  assert.strictEqual(maliciousAttempt.reason, 'already_claimed');

  const nonTrialTool = determineTrialEligibility({
    productSlug: 'orderbot',
    isEligibleFromRpc: true,
    skipTrial: false,
  });
  assert.strictEqual(nonTrialTool.isEligibleTrial, false, 'Non-rccp tools cannot receive trial');
  console.log('  ✓ Test G4: Security rule verified: skip-trial flag can only remove trial, never grant one.\n');


  // ─────────────────────────────────────────────────────────────
  // (C) Central Pricing Config Tests
  // ─────────────────────────────────────────────────────────────
  console.log('--- Suite C: Central Pricing Config Tests ---');

  assert.strictEqual(PRICING_CONFIG.standardPrice, 9.99);
  assert.strictEqual(PRICING_CONFIG.launchPrice, 4.99);
  assert.strictEqual(PRICING_CONFIG.currency, 'AUD');
  assert.strictEqual(PRICING_CONFIG.gstInclusive, true);
  assert.strictEqual(PRICING_CONFIG.launchEndsOn, null);

  const formattedStandard = formatPrice(PRICING_CONFIG.standardPrice);
  const formattedLaunch = formatPrice(PRICING_CONFIG.launchPrice);
  assert.strictEqual(formattedStandard, 'A$9.99');
  assert.strictEqual(formattedLaunch, 'A$4.99');
  assert.ok(!formattedStandard.includes('NaN') && !formattedStandard.includes('undefined'));
  assert.ok(!formattedLaunch.includes('NaN') && !formattedLaunch.includes('undefined'));

  const trialCopy = getTrialLineText(30);
  const expectedCopy =
    'Free for 30 days, then A$4.99/month (launch price, normally A$9.99), incl. GST, charged automatically until you cancel. By starting your trial you agree to the Terms of Service and Privacy Policy.';
  assert.strictEqual(trialCopy, expectedCopy, 'Trial text must match required exact copy');
  console.log('  ✓ Test C1: Pricing config has 9.99/4.99, formats properly without NaN/undefined, and matches trial copy.\n');

  // ─────────────────────────────────────────────────────────────
  // (D) Source Code Hard-coded Price Grep Audit
  // ─────────────────────────────────────────────────────────────
  console.log('--- Suite D: Source Code Hard-coded Price Grep Audit ---');

  const srcDir = path.resolve(__dirname, '../src');

  function scanDirectory(dir, forbiddenRegex, allowedMatcher) {
    const files = fs.readdirSync(dir);
    const violations = [];

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        violations.push(...scanDirectory(fullPath, forbiddenRegex, allowedMatcher));
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (forbiddenRegex.test(line)) {
            if (!allowedMatcher || !allowedMatcher(fullPath, line, i + 1)) {
              violations.push({ file: fullPath, line: i + 1, content: line.trim() });
            }
          }
        }
      }
    }
    return violations;
  }

  // Look for hardcoded phrases like "A$9", "$9/month", "AUD $9" in user-facing UI code
  const forbiddenPricing = /(A\$9(?!\.99)|\$9\/month|AUD \$9\/mo|AUD \$9(?!\.99))/;
  const violations = scanDirectory(srcDir, forbiddenPricing, (filePath, lineContent) => {
    // Whitelist AdminPricing dummy placeholder "e.g., Custom, $99/mo" if matched
    if (lineContent.includes('$99/mo')) return true;
    return false;
  });

  if (violations.length > 0) {
    console.error('Violations found in src/:');
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line} -> ${v.content}`);
    }
    assert.fail(`Found ${violations.length} hardcoded old pricing strings in src/`);
  }

  console.log('  ✓ Test D1: Zero leftover hard-coded "A$9", "AUD $9", "$9/month" strings found in src/.\n');

  // Test D2: Identifier sweep & Cart render guard
  console.log('--- Running Suite D2: Identifier Sweep & Cart Render Guard ---');
  execSync('node scripts/test-identifier-sweep.mjs', {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
  });
  console.log('  ✓ Test D2: Identifier sweep and Cart render guard passed with zero errors.\n');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SUCCESS: ALL LAUNCH READINESS TESTS PASSED (0 ERRORS)         ');
  console.log('═══════════════════════════════════════════════════════════════');
} finally {
  // Clean up temporary bundles
  if (fs.existsSync(tempParamsBundle)) fs.unlinkSync(tempParamsBundle);
  if (fs.existsSync(tempBillingBundle)) fs.unlinkSync(tempBillingBundle);
  if (fs.existsSync(tempPricingBundle)) fs.unlinkSync(tempPricingBundle);
  if (fs.existsSync(tempTrialBundle)) fs.unlinkSync(tempTrialBundle);
  if (fs.existsSync(tempAuthFlowBundle)) fs.unlinkSync(tempAuthFlowBundle);
}
