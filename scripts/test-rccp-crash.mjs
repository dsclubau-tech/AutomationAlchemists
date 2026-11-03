import esbuild from 'esbuild';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToString } from 'react-dom/server';

// Polyfill global window & localStorage for offline tests
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    location: { origin: 'https://automationalchemists.com', href: 'https://automationalchemists.com' },
  };
}
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const trialEntry = path.resolve(__dirname, '../src/lib/trial.ts');
const tempBundle = path.resolve(__dirname, 'temp-rccp-trial.mjs');

console.log('═══════════════════════════════════════════════════════════════');
console.log('   RCCP TOOL PAGE CRASH REPRODUCTION & VERIFICATION SUITE      ');
console.log('═══════════════════════════════════════════════════════════════\n');

try {
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
    outfile: tempBundle,
  });

  const { formatTrialTimeLeft } = await import(`file://${tempBundle.replace(/\\/g, '/')}`);

  // Helper simulating React 18 child validation
  function validateReactChild(child) {
    if (child === null || child === undefined || typeof child === 'boolean' || typeof child === 'string' || typeof child === 'number') {
      return true;
    }
    if (Array.isArray(child)) {
      child.forEach(validateReactChild);
      return true;
    }
    if (typeof child === 'object') {
      if (child.$$typeof) {
        return true; // Valid React element
      }
      throw new Error(
        `Objects are not valid as a React child (found: object with keys {${Object.keys(child).join(', ')}}). If you meant to render a collection of children, use an array instead.`
      );
    }
    return true;
  }

  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const states = [
    { name: '1. Logged out', user: null, statusTrial: null, publicTrial: { enabled: true, slots_left: 100 } },
    { name: '2. Logged in with no trial', user: { id: 'u1' }, statusTrial: { enabled: true, eligible: true, already_claimed: false, has_access: false, claim: null, slots_left: 100 }, publicTrial: { enabled: true, slots_left: 100 } },
    { name: '3. Active trial', user: { id: 'u1' }, statusTrial: { enabled: true, eligible: false, already_claimed: true, has_access: true, claim: { ends_at: futureDate, converted: false, revoked: false }, slots_left: 99 }, publicTrial: { enabled: true, slots_left: 99 } },
    { name: '4. Active paid subscription', user: { id: 'u1' }, statusTrial: { enabled: true, eligible: false, already_claimed: true, has_access: true, claim: { ends_at: futureDate, converted: true, revoked: false }, slots_left: 99 }, publicTrial: { enabled: true, slots_left: 99 } },
    { name: '5. Trial cancelled at period end', user: { id: 'u1' }, statusTrial: { enabled: true, eligible: false, already_claimed: true, has_access: true, claim: { ends_at: futureDate, converted: false, revoked: false }, slots_left: 99 }, publicTrial: { enabled: true, slots_left: 99 } },
    { name: '6. Trial denied', user: { id: 'u1' }, statusTrial: { enabled: true, eligible: false, already_claimed: false, has_access: false, denied_reason: 'card_already_used', claim: null, slots_left: 100 }, publicTrial: { enabled: true, slots_left: 100 } },
    { name: '7. Sold out', user: null, statusTrial: null, publicTrial: { enabled: true, slots_left: 0 } },
    { name: '8. Offer disabled', user: null, statusTrial: null, publicTrial: { enabled: false, slots_left: 0 } },
    { name: '9. Fetch error', user: null, statusTrial: null, publicTrial: null },
  ];

  console.log('[REPRODUCTION PHASE] Testing original code: ({timeLeftFormatted}) where timeLeftFormatted is formatTrialTimeLeft(ends_at):');
  let reproducedCrashes = 0;
  for (const s of states) {
    const hasActiveTrial = Boolean(s.user && s.statusTrial?.has_access && s.statusTrial?.claim && !s.statusTrial.claim.revoked);
    const buggyTimeLeft = s.statusTrial?.claim?.ends_at ? formatTrialTimeLeft(s.statusTrial.claim.ends_at) : '';

    try {
      if (hasActiveTrial && buggyTimeLeft) {
        validateReactChild(buggyTimeLeft);
        // Also try rendering in React element
        renderToString(React.createElement('span', null, '(', buggyTimeLeft, ')'));
      }
      console.log(`  PASS: ${s.name} - Did not throw`);
    } catch (err) {
      reproducedCrashes++;
      console.log(`  CRASH REPRODUCED: ${s.name} -> ${err.message}`);
    }
  }

  assert.strictEqual(reproducedCrashes >= 1, true, 'Original code must reproduce crash for active trial');
  console.log(`\n=> Confirmed crash reproduced in ${reproducedCrashes} states where hasActiveTrial is true.\n`);

  console.log('[FIX VERIFICATION PHASE] Testing fixed code: formatTrialTimeLeft(ends_at).text:');
  for (const s of states) {
    const hasActiveTrial = Boolean(s.user && s.statusTrial?.has_access && s.statusTrial?.claim && !s.statusTrial.claim.revoked);
    const fixedTimeLeft = s.statusTrial?.claim?.ends_at ? formatTrialTimeLeft(s.statusTrial.claim.ends_at).text : '';

    if (hasActiveTrial && fixedTimeLeft) {
      validateReactChild(fixedTimeLeft);
      const rendered = renderToString(React.createElement('span', { className: 'text-teal-900/70 font-medium' }, `(${fixedTimeLeft})`));
      console.log(`  PASS: ${s.name} -> Rendered clean HTML: ${rendered}`);
    } else {
      console.log(`  PASS: ${s.name} -> hasActiveTrial=${hasActiveTrial}, fixedTimeLeft="${fixedTimeLeft}"`);
    }
  }

  console.log('\n[REGRESSION TESTS] Null, undefined, empty, and edge case fields:');
  const edgeCases = [
    { name: 'Null claim', claim: null, expected: '' },
    { name: 'Empty object claim', claim: {}, expected: '' },
    { name: 'Undefined ends_at', claim: { ends_at: undefined }, expected: '' },
    { name: 'Null ends_at', claim: { ends_at: null }, expected: '' },
    { name: 'Empty string ends_at', claim: { ends_at: '' }, expected: '' },
    { name: 'Invalid date string ends_at', claim: { ends_at: 'invalid-date' }, expected: '0 hours left' },
    { name: 'Past date ends_at', claim: { ends_at: new Date(Date.now() - 10000).toISOString() }, expected: '0 hours left' },
    { name: 'Future date ends_at (30 days)', claim: { ends_at: futureDate }, expected: '30 days left' },
  ];

  for (const c of edgeCases) {
    const statusTrial = { has_access: true, claim: c.claim };
    const fixedTimeLeft = statusTrial?.claim?.ends_at ? formatTrialTimeLeft(statusTrial.claim.ends_at).text : '';
    validateReactChild(fixedTimeLeft);
    if (c.expected !== undefined) {
      assert.strictEqual(fixedTimeLeft, c.expected, `Mismatch for ${c.name}`);
    }
    const element = React.createElement('span', null, `(${fixedTimeLeft})`);
    const rendered = renderToString(element);
    console.log(`  PASS: ${c.name} -> "${fixedTimeLeft}" -> HTML: ${rendered}`);
  }

  console.log('\nAll 9 states and edge case regression tests passed successfully!');
} finally {
  if (fs.existsSync(tempBundle)) {
    fs.unlinkSync(tempBundle);
  }
}
