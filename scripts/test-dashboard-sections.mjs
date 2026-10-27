import esbuild from 'esbuild';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const entryFile = path.resolve(__dirname, '../src/lib/dashboardSections.ts');
const tempBundle = path.resolve(__dirname, 'temp-dashboardSections.mjs');

console.log('--- Testing Dashboard Sections & Manual Grant Helpers (Pure Offline Assertions) ---');
console.log(`Bundling ${entryFile} with esbuild...`);

try {
  esbuild.buildSync({
    entryPoints: [entryFile],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
    outfile: tempBundle,
  });

  const {
    categorizeDashboardTools,
    canManageSubscription,
    getSubscriptionDateText,
  } = await import(`file://${tempBundle.replace(/\\/g, '/')}`);

  const mockDbTools = [
    { slug: 'rccp', name: 'Return Converter x CopyPaste Bot', status: 'available', price_monthly: 9, is_free: false },
    { slug: 'listflow', name: 'ListFlow', status: 'coming_soon', price_monthly: 59, is_free: false },
    { slug: 'orderbot', name: 'Order Bot', status: 'available', price_monthly: 7, is_free: false },
    { slug: 'invoicegen', name: 'Invoice Generator', status: 'coming_soon', price_monthly: 0, is_free: true },
  ];

  const nowMs = new Date('2026-10-27T12:00:00Z').getTime();

  // Test 1: Owner with manual rccp grant and active listflow row
  // -> both only under Your tools, Coming soon empty, no manage buttons
  {
    const ownerSubs = [
      {
        product_slug: 'cpbot',
        status: 'active',
        current_period_end: '2030-12-12T00:00:00Z',
        manually_granted: true,
        stripe_customer_id: null,
        stripe_subscription_id: null,
      },
      {
        product_slug: 'listflow',
        status: 'active',
        current_period_end: '2030-12-12T00:00:00Z',
        manually_granted: true,
        stripe_customer_id: null,
        stripe_subscription_id: null,
      },
    ];

    const { activeTools, availableTools, comingSoonTools } = categorizeDashboardTools(
      mockDbTools,
      ownerSubs,
      null,
      nowMs
    );

    const activeSlugs = activeTools.map(t => t.slug);
    assert.deepStrictEqual(activeSlugs, ['rccp', 'listflow'], 'Active tools must contain rccp and listflow');
    assert.strictEqual(comingSoonTools.length, 0, 'Coming soon must be empty because owner owns listflow');
    assert.strictEqual(availableTools.length, 0, 'Available tools must be empty');

    // Manage buttons: neither manual grant gets a manage button
    const rccpSub = ownerSubs.find(s => s.product_slug === 'cpbot');
    const lfSub = ownerSubs.find(s => s.product_slug === 'listflow');
    assert.strictEqual(canManageSubscription(rccpSub), false, 'Manual rccp grant must NOT show manage button');
    assert.strictEqual(canManageSubscription(lfSub), false, 'Manual listflow grant must NOT show manage button');

    // Date texts: show access until {date} rather than renews {date}
    const rccpDateText = getSubscriptionDateText(rccpSub, 'CP Bot');
    assert.strictEqual(rccpDateText, 'CP Bot access until 12 Dec 2030', 'Manual rccp grant must show access until date');
    const lfDateText = getSubscriptionDateText(lfSub);
    assert.strictEqual(lfDateText, 'Access until 12 Dec 2030', 'Manual listflow grant must show access until date');

    console.log('✓ Test 1: Owner with manual rccp grant and active listflow row passed.');
  }

  // Test 2: Paid Stripe user for rccp
  // -> Your tools with manage button
  {
    const paidSubs = [
      {
        product_slug: 'cpbot',
        status: 'active',
        current_period_end: '2026-11-26T00:00:00Z',
        manually_granted: false,
        stripe_customer_id: 'cus_123',
        stripe_subscription_id: 'sub_123',
      },
    ];

    const { activeTools, availableTools, comingSoonTools } = categorizeDashboardTools(
      mockDbTools,
      paidSubs,
      null,
      nowMs
    );

    assert.deepStrictEqual(activeTools.map(t => t.slug), ['rccp'], 'Active tools must contain rccp');
    assert.deepStrictEqual(comingSoonTools.map(t => t.slug), ['listflow'], 'Coming soon must contain listflow');
    assert.strictEqual(availableTools.length, 0, 'Available tools must be empty');

    const cpSub = paidSubs.find(s => s.product_slug === 'cpbot');
    assert.strictEqual(canManageSubscription(cpSub), true, 'Paid Stripe user must show manage button');
    assert.strictEqual(getSubscriptionDateText(cpSub, 'CP Bot'), 'CP Bot renews 26 Nov 2026', 'Paid user must show renews date');

    console.log('✓ Test 2: Paid Stripe user for rccp passed.');
  }

  // Test 3: New user with no rows
  // -> rccp under Available or locked card, listflow only under Coming soon
  {
    const newSubs = [];
    const { activeTools, availableTools, comingSoonTools } = categorizeDashboardTools(
      mockDbTools,
      newSubs,
      null,
      nowMs
    );

    // RCCP is in activeTools because Return Converter is free, displaying locked CP Bot card
    assert.deepStrictEqual(activeTools.map(t => t.slug), ['rccp'], 'Active tools contains rccp with free Return Converter & locked CP Bot');
    assert.deepStrictEqual(comingSoonTools.map(t => t.slug), ['listflow'], 'Coming soon must contain listflow');
    assert.strictEqual(availableTools.length, 0, 'Available tools must be empty');

    assert.strictEqual(canManageSubscription(null), false, 'No subscription has no manage button');

    console.log('✓ Test 3: New user with no rows passed.');
  }

  // Test 4: Active trial row
  // -> Your tools with trial text
  {
    const trialSubs = [
      {
        product_slug: 'cpbot',
        status: 'trialing',
        is_trial: true,
        current_period_end: '2026-11-26T00:00:00Z',
        manually_granted: false,
        stripe_customer_id: 'cus_trial_456',
        stripe_subscription_id: 'sub_trial_456',
      },
    ];

    const { activeTools, availableTools, comingSoonTools } = categorizeDashboardTools(
      mockDbTools,
      trialSubs,
      null,
      nowMs
    );

    assert.deepStrictEqual(activeTools.map(t => t.slug), ['rccp'], 'Active tools contains rccp for trial user');
    assert.deepStrictEqual(comingSoonTools.map(t => t.slug), ['listflow'], 'Coming soon must contain listflow');

    const trialSub = trialSubs[0];
    assert.strictEqual(canManageSubscription(trialSub), true, 'Card trial with Stripe link shows manage button');
    assert.strictEqual(getSubscriptionDateText(trialSub), 'Free trial ends 26 Nov 2026', 'Trial row shows trial end text');

    console.log('✓ Test 4: Active trial row passed.');
  }

  // Test 5: Expired row
  // -> not under Your tools
  {
    const expiredSubs = [
      {
        product_slug: 'listflow',
        status: 'active',
        current_period_end: '2025-01-01T00:00:00Z', // In the past relative to nowMs
        manually_granted: true,
      },
    ];

    const { activeTools, availableTools, comingSoonTools } = categorizeDashboardTools(
      mockDbTools,
      expiredSubs,
      null,
      nowMs
    );

    assert.deepStrictEqual(activeTools.map(t => t.slug), ['rccp'], 'Expired listflow must NOT be in active tools');
    assert.deepStrictEqual(comingSoonTools.map(t => t.slug), ['listflow'], 'Expired listflow must be in coming soon');

    console.log('✓ Test 5: Expired row passed.');
  }

  // Test 6: Order Bot exception and Invoice Generator hidden
  {
    // 6a: User with no Order Bot sub and no stores -> Order Bot and Invoicegen both hidden
    const resA = categorizeDashboardTools(mockDbTools, [], null, nowMs);
    assert.ok(!resA.activeTools.some(t => t.slug === 'orderbot' || t.slug === 'invoicegen'), 'Neither in active');
    assert.ok(!resA.availableTools.some(t => t.slug === 'orderbot' || t.slug === 'invoicegen'), 'Neither in available');
    assert.ok(!resA.comingSoonTools.some(t => t.slug === 'orderbot' || t.slug === 'invoicegen'), 'Neither in coming soon');

    // 6b: User with active Order Bot sub but NO stores -> Order Bot in Available only
    const obSubOnly = [
      { product_slug: 'orderbot', status: 'active', current_period_end: '2026-12-01T00:00:00Z' },
    ];
    const resB = categorizeDashboardTools(mockDbTools, obSubOnly, { active_store_count: 0 }, nowMs);
    assert.deepStrictEqual(resB.availableTools.map(t => t.slug), ['orderbot'], 'Orderbot in Available when sub active but 0 stores');
    assert.ok(!resB.activeTools.some(t => t.slug === 'orderbot'), 'Orderbot not in Active when 0 stores');

    // 6c: User with Order Bot sub AND active stores -> Order Bot in Your tools only
    const resC = categorizeDashboardTools(mockDbTools, obSubOnly, { active_store_count: 2 }, nowMs);
    assert.ok(resC.activeTools.some(t => t.slug === 'orderbot'), 'Orderbot in Active when stores present');
    assert.ok(!resC.availableTools.some(t => t.slug === 'orderbot'), 'Orderbot not in Available when stores present');

    console.log('✓ Test 6: Order Bot exception and Invoice Generator hidden passed.');
  }

  console.log('\nSUCCESS: All 6 dashboard section tests passed with zero errors.');
} finally {
  if (fs.existsSync(tempBundle)) {
    fs.unlinkSync(tempBundle);
  }
}
