import esbuild from 'esbuild';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const paramsEntry = path.resolve(__dirname, '../supabase/functions/create-checkout-session/params.ts');
const billingEntry = path.resolve(__dirname, '../src/lib/billingView.ts');
const pricingEntry = path.resolve(__dirname, '../src/config/pricing.tsx');

const tempParamsBundle = path.resolve(__dirname, 'temp-params.mjs');
const tempBillingBundle = path.resolve(__dirname, 'temp-billing.mjs');
const tempPricingBundle = path.resolve(__dirname, 'temp-pricing.mjs');

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

  const { buildCheckoutSessionParams, TERMS_URL, PRIVACY_URL } = await import(`file://${tempParamsBundle.replace(/\\/g, '/')}`);
  const { getBillingView, formatBillingDate } = await import(`file://${tempBillingBundle.replace(/\\/g, '/')}`);
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
  console.log('  ✓ Test A4: custom_text.submit message verified for standard trial, non-trial, and 300c override.\n');

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
  console.log('  ✓ Test B7: past_due displays paused banner and "Update payment method" with NO subscribe action.\n');

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

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  SUCCESS: ALL LAUNCH READINESS TESTS PASSED (0 ERRORS)         ');
  console.log('═══════════════════════════════════════════════════════════════');
} finally {
  // Clean up temporary bundles
  if (fs.existsSync(tempParamsBundle)) fs.unlinkSync(tempParamsBundle);
  if (fs.existsSync(tempBillingBundle)) fs.unlinkSync(tempBillingBundle);
  if (fs.existsSync(tempPricingBundle)) fs.unlinkSync(tempPricingBundle);
}
