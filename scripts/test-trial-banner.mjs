import esbuild from 'esbuild';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bannerEntry = path.resolve(__dirname, '../src/lib/trialBanner.ts');
const tempBundle = path.resolve(__dirname, 'temp-trial-banner.mjs');

console.log('═══════════════════════════════════════════════════════════════');
console.log('   TRIAL SPOTS BANNER TEST SUITE (v1.13.0 Pure Helper Tests)   ');
console.log('═══════════════════════════════════════════════════════════════\n');

try {
  // Bundle helper module with esbuild for offline Node execution
  esbuild.buildSync({
    entryPoints: [bannerEntry],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node18',
    outfile: tempBundle,
  });

  const { getTrialBannerView } = await import(`file://${tempBundle.replace(/\\/g, '/')}`);

  // Test 1: Loading state
  const loadingView = getTrialBannerView({ loading: true });
  assert.strictEqual(loadingView.state, 'loading');
  assert.strictEqual(loadingView.shouldRender, true);
  console.log('  ✓ Test 1: Loading state returns state="loading" and shouldRender=true.');

  // Test 2: Fetch error or offer disabled
  const errorView = getTrialBannerView({ fetchError: true, enabled: true, slotCap: 100, spotsLeft: 50 });
  assert.strictEqual(errorView.state, 'hidden');
  assert.strictEqual(errorView.shouldRender, false);

  const disabledView = getTrialBannerView({ enabled: false, slotCap: 100, spotsLeft: 50 });
  assert.strictEqual(disabledView.state, 'hidden');
  assert.strictEqual(disabledView.shouldRender, false);

  const nullCapView = getTrialBannerView({ enabled: true, slotCap: null, spotsLeft: 50 });
  assert.strictEqual(nullCapView.state, 'hidden');
  assert.strictEqual(nullCapView.shouldRender, false);

  const nullSpotsView = getTrialBannerView({ enabled: true, slotCap: 100, spotsLeft: null });
  assert.strictEqual(nullSpotsView.state, 'hidden');
  assert.strictEqual(nullSpotsView.shouldRender, false);
  console.log('  ✓ Test 2: Error, disabled offer, or missing data safely hides banner (shouldRender=false).');

  // Test 3: Normal available state (e.g. 37 of 100)
  const availableView = getTrialBannerView({ enabled: true, slotCap: 100, spotsLeft: 37 });
  assert.strictEqual(availableView.state, 'available');
  assert.strictEqual(availableView.shouldRender, true);
  assert.strictEqual(availableView.isUrgent, false);
  assert.strictEqual(availableView.spotsLeft, 37);
  assert.strictEqual(availableView.slotCap, 100);
  assert.strictEqual(availableView.percentageLeft, 37);
  assert.strictEqual(availableView.badgeText, 'Limited free trial');
  assert.strictEqual(availableView.headline, '37 of 100 free-trial spots left');
  assert.strictEqual(availableView.ctaMode, 'start_trial');
  console.log('  ✓ Test 3: Normal available state formats numbers, 37% progress, and non-urgent copy.');

  // Test 4: Low threshold boundary tests
  // Cap 100: 10% is 10. 11 is available, 10 is low.
  const boundary11 = getTrialBannerView({ enabled: true, slotCap: 100, spotsLeft: 11 });
  assert.strictEqual(boundary11.state, 'available');
  assert.strictEqual(boundary11.isUrgent, false);

  const boundary10 = getTrialBannerView({ enabled: true, slotCap: 100, spotsLeft: 10 });
  assert.strictEqual(boundary10.state, 'low');
  assert.strictEqual(boundary10.isUrgent, true);
  assert.strictEqual(boundary10.badgeText, 'Almost gone');
  assert.strictEqual(boundary10.headline, 'Only 10 free-trial spots left');
  assert.strictEqual(boundary10.percentageLeft, 10);
  assert.strictEqual(boundary10.ctaMode, 'start_trial');

  // Single spot left: singular "spot"
  const singleSpot = getTrialBannerView({ enabled: true, slotCap: 100, spotsLeft: 1 });
  assert.strictEqual(singleSpot.state, 'low');
  assert.strictEqual(singleSpot.isUrgent, true);
  assert.strictEqual(singleSpot.headline, 'Only 1 free-trial spot left');
  console.log('  ✓ Test 4: Low state activates at <= 10% boundary with urgency styling and singular/plural grammar.');

  // Test 5: Sold out state (0 spots left)
  const soldOutView = getTrialBannerView({ enabled: true, slotCap: 100, spotsLeft: 0 });
  assert.strictEqual(soldOutView.state, 'sold_out');
  assert.strictEqual(soldOutView.shouldRender, true);
  assert.strictEqual(soldOutView.percentageLeft, 0);
  assert.strictEqual(soldOutView.badgeText, 'Free trial full');
  assert.strictEqual(soldOutView.headline, 'All free-trial spots have been claimed');
  assert.ok(soldOutView.subtext.includes('launch price'));
  assert.strictEqual(soldOutView.ctaMode, 'get_access');
  assert.strictEqual(soldOutView.ctaText, 'Get CP Bot now');
  console.log('  ✓ Test 5: Sold-out state truthfully presents launch price availability with get_access CTA.');

  // Test 6: Dynamic arbitrary cap (e.g. owner cap changed from 5 to 100, or any other cap)
  const dynamicCapView = getTrialBannerView({ enabled: true, slotCap: 50, spotsLeft: 25 });
  assert.strictEqual(dynamicCapView.slotCap, 50);
  assert.strictEqual(dynamicCapView.spotsLeft, 25);
  assert.strictEqual(dynamicCapView.percentageLeft, 50);
  assert.strictEqual(dynamicCapView.headline, '25 of 50 free-trial spots left');
  console.log('  ✓ Test 6: Dynamic cap calculates percentage and headline without hardcoded limits.');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  SUCCESS: ALL TRIAL SPOTS BANNER TESTS PASSED (0 ERRORS)      ');
  console.log('═══════════════════════════════════════════════════════════════\n');
} catch (err) {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
} finally {
  if (fs.existsSync(tempBundle)) {
    fs.unlinkSync(tempBundle);
  }
}
