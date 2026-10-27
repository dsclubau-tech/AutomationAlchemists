import esbuild from 'esbuild';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const entryFile = path.resolve(__dirname, '../supabase/functions/_shared/stripeCompat.ts');
const tempBundle = path.resolve(__dirname, 'temp-stripeCompat.mjs');

console.log('--- Testing Stripe Compatibility Module (Pure Offline Assertions) ---');
console.log(`Bundling ${entryFile} with esbuild...`);

try {
  esbuild.buildSync({
    entryPoints: [entryFile],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    outfile: tempBundle,
  });

  const { getPeriod, getInvoiceSubscriptionId } = await import(`file://${tempBundle.replace(/\\/g, '/')}`);

  // Test 1: getPeriod with old top-level period fields
  const oldSubscription = {
    id: 'sub_legacy_123',
    current_period_start: 1700000000,
    current_period_end: 1702592000,
  };
  const oldPeriod = getPeriod(oldSubscription);
  assert.ok(oldPeriod !== null, 'Legacy period must not be null');
  assert.strictEqual(oldPeriod.start, new Date(1700000000 * 1000).toISOString());
  assert.strictEqual(oldPeriod.end, new Date(1702592000 * 1000).toISOString());
  console.log('✓ Test 1: getPeriod with legacy top-level timestamps passed.');

  // Test 2: getPeriod with clover items-based period fields
  const cloverSubscription = {
    id: 'sub_clover_456',
    items: {
      data: [
        {
          id: 'si_item_1',
          current_period_start: 1710000000,
          current_period_end: 1712592000,
        },
      ],
    },
  };
  const cloverPeriod = getPeriod(cloverSubscription);
  assert.ok(cloverPeriod !== null, 'Clover period must not be null');
  assert.strictEqual(cloverPeriod.start, new Date(1710000000 * 1000).toISOString());
  assert.strictEqual(cloverPeriod.end, new Date(1712592000 * 1000).toISOString());
  console.log('✓ Test 2: getPeriod with clover items.data[0] timestamps passed.');

  // Test 3: getPeriod with missing everything / invalid timestamps
  assert.strictEqual(getPeriod({}), null, 'Empty object must return null');
  assert.strictEqual(getPeriod(null), null, 'null must return null');
  assert.strictEqual(getPeriod(undefined), null, 'undefined must return null');
  assert.strictEqual(getPeriod({ current_period_start: null, current_period_end: undefined }), null, 'Null timestamps must return null');
  assert.strictEqual(getPeriod({ items: { data: [] } }), null, 'Empty items array must return null');
  assert.strictEqual(getPeriod({ items: { data: [{ current_period_start: 'not_a_number' }] } }), null, 'Non-numeric items must return null');
  console.log('✓ Test 3: getPeriod with missing/invalid shapes returns null safely without throwing.');

  // Test 4: getInvoiceSubscriptionId with legacy invoice.subscription (string ID)
  const legacyInvoiceStr = {
    id: 'in_legacy_str',
    subscription: 'sub_legacy_str_123',
  };
  assert.strictEqual(getInvoiceSubscriptionId(legacyInvoiceStr), 'sub_legacy_str_123');
  console.log('✓ Test 4: getInvoiceSubscriptionId with legacy invoice.subscription (string) passed.');

  // Test 5: getInvoiceSubscriptionId with legacy invoice.subscription (expanded object)
  const legacyInvoiceObj = {
    id: 'in_legacy_obj',
    subscription: { id: 'sub_legacy_obj_456' },
  };
  assert.strictEqual(getInvoiceSubscriptionId(legacyInvoiceObj), 'sub_legacy_obj_456');
  console.log('✓ Test 5: getInvoiceSubscriptionId with legacy invoice.subscription (expanded object) passed.');

  // Test 6: getInvoiceSubscriptionId with clover invoice.parent.subscription_details.subscription (string ID)
  const cloverInvoiceStr = {
    id: 'in_clover_str',
    parent: {
      subscription_details: {
        subscription: 'sub_clover_str_789',
      },
    },
  };
  assert.strictEqual(getInvoiceSubscriptionId(cloverInvoiceStr), 'sub_clover_str_789');
  console.log('✓ Test 6: getInvoiceSubscriptionId with clover parent.subscription_details.subscription (string) passed.');

  // Test 7: getInvoiceSubscriptionId with clover invoice.parent.subscription_details.subscription (expanded object)
  const cloverInvoiceObj = {
    id: 'in_clover_obj',
    parent: {
      subscription_details: {
        subscription: { id: 'sub_clover_obj_999' },
      },
    },
  };
  assert.strictEqual(getInvoiceSubscriptionId(cloverInvoiceObj), 'sub_clover_obj_999');
  console.log('✓ Test 7: getInvoiceSubscriptionId with clover parent.subscription_details.subscription (expanded object) passed.');

  // Test 8: getInvoiceSubscriptionId with missing everything / one-off charge invoice
  assert.strictEqual(getInvoiceSubscriptionId({}), null, 'Empty invoice must return null');
  assert.strictEqual(getInvoiceSubscriptionId(null), null, 'null invoice must return null');
  assert.strictEqual(getInvoiceSubscriptionId(undefined), null, 'undefined invoice must return null');
  assert.strictEqual(getInvoiceSubscriptionId({ parent: {} }), null, 'Empty parent must return null');
  assert.strictEqual(getInvoiceSubscriptionId({ parent: { subscription_details: {} } }), null, 'Empty subscription_details must return null');
  console.log('✓ Test 8: getInvoiceSubscriptionId with missing/unrelated invoice returns null safely.');

  console.log('\nSUCCESS: All 8 Stripe compatibility tests passed with zero errors.');
} finally {
  if (fs.existsSync(tempBundle)) {
    try {
      fs.unlinkSync(tempBundle);
    } catch {
      // ignore cleanup error
    }
  }
}
