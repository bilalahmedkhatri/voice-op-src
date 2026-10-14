const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let items = Array.from({ length: 11 }, (_, index) => ({ id: 'voice-' + (index + 1), prompt_text: 'Voice ' + (index + 1),
      voice_name: 'Kore', model_name: 'Gemini Voice', model_id: 'gemini-test', created_at: new Date().toISOString(),
      duration_sec: 125, size_bytes: 2097152 }));
    const batches = [];
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      let body = {};
      if (url.pathname === '/api/auth/session') body = { authenticated: true, owner_scope: 'checkbox-owner', user: { available_credits: 100 } };
      else if (url.pathname === '/api/history') body = { authenticated: true, items: [] };
      else if (url.pathname === '/api/audio-library') {
        if (route.request().method() === 'DELETE') {
          const ids = (url.searchParams.get('ids') || url.searchParams.get('id')).split(',');
          assert.equal(route.request().headers()['x-owner-scope'], 'checkbox-owner');
          batches.push(ids);
          await new Promise(resolve => setTimeout(resolve, 300));
          items = items.filter(item => !ids.includes(item.id));
          body = { success: true, deletedIds: ids };
        } else {
          const rows = items.filter(item => item.prompt_text.toLowerCase().includes((url.searchParams.get('search') || '').toLowerCase()));
          const offset = (Number(url.searchParams.get('page') || 1) - 1) * 10;
          body = { authenticated: true, items: rows.slice(offset, offset + 10), total: rows.length, totalPages: Math.ceil(rows.length / 10) };
        }
      }
      await route.fulfill({ json: body });
    });
    const select = index => page.getByRole('checkbox', { name: 'Select audio: Voice ' + index, exact: true });
    const all = page.getByRole('checkbox', { name: 'Select all audio on this page', exact: true });
    await page.goto('http://localhost:3011/audio-library', { waitUntil: 'domcontentloaded' });
    await select(1).waitFor();
    await page.getByRole('columnheader', { name: 'DURATION', exact: true }).waitFor();
    await page.getByRole('columnheader', { name: 'SIZE', exact: true }).waitFor();
    assert.equal(await page.getByText('02:05s', { exact: true }).count(), 10);
    assert.equal(await page.getByText('2.0 MB', { exact: true }).count(), 10);
    await page.screenshot({ path: 'output/playwright/audio-library-metadata-desktop.png' });
    await select(1).check(); await select(2).check();
    assert.equal(await all.evaluate(element => element.indeterminate), true);
    await page.getByRole('button', { name: 'Delete selected (2)', exact: true }).waitFor();
    await all.check();
    await page.getByRole('button', { name: 'Delete selected (10)', exact: true }).waitFor();
    await page.locator('button[title="Next Page"]').click();
    await select(11).waitFor(); assert.equal(await all.isChecked(), false);
    await all.check(); await page.getByRole('button', { name: 'Delete selected (11)', exact: true }).waitFor();
    await all.uncheck(); await page.getByRole('button', { name: 'Delete selected (10)', exact: true }).waitFor();
    await page.locator('button[title="Previous Page"]').click();
    await select(1).waitFor(); assert.equal(await all.isChecked(), true);
    await all.uncheck(); assert.equal(await page.locator('input[type="checkbox"]:checked').count(), 0);
    await select(1).check(); await select(2).check();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector('aside').getBoundingClientRect().right <= 1);
    await page.screenshot({ path: 'output/playwright/audio-checkboxes-mobile.png' });
    await page.getByRole('button', { name: 'Delete selected (2)', exact: true }).click();
    await page.getByRole('heading', { name: 'Delete 2 Audio Tracks', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click(); assert.equal(batches.length, 0);
    assert.equal(await select(1).isChecked(), true);
    await page.getByRole('button', { name: 'Delete selected (2)', exact: true }).click();
    await page.locator('.fixed.inset-0').getByRole('button', { name: 'Delete', exact: true }).click();
    await select(11).waitFor();
    assert.deepEqual(batches, [['voice-1', 'voice-2']]);
    assert.equal(await select(1).count(), 0); assert.equal(await select(2).count(), 0);
    assert.equal(await page.locator('input[type="checkbox"]:checked').count(), 0);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await select(3).waitFor(); assert.equal(await select(1).count(), 0);
    await select(3).check();
    await page.getByPlaceholder('Search audio files...').fill('Voice 9');
    await select(9).waitFor();
    assert.equal(await page.getByRole('button', { name: /Delete selected/ }).count(), 0);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ rowCheckboxes: true, indeterminateHeader: true, pageSelection: true, crossPageSelection: true,
      cancel: true, oneBatchRequest: true, reloadPersistence: true, filterClearsSelection: true, pageErrors: errors.length, mockedDeletion: true }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
