const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.pauseCalls = 0;
      HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
      HTMLMediaElement.prototype.pause = function () { window.pauseCalls++; };
    });
    const item = index => ({ id: 'voice-' + index, prompt_text: 'Voice ' + index, voice_name: 'Kore', model_name: 'Gemini Voice',
      model_id: 'gemini-test', created_at: new Date().toISOString() });
    let items = Array.from({ length: 11 }, (_, index) => item(index + 1));
    const wav = Buffer.alloc(524);
    wav.write('RIFF'); wav.writeUInt32LE(516, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(24000, 24); wav.writeUInt32LE(48000, 28);
    wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(480, 40);
    let deletes = 0, fail = true;
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      let body = {};
      if (url.pathname === '/api/auth/session') body = { authenticated: true, owner_scope: 'delete-owner', user: { available_credits: 100 } };
      else if (url.pathname === '/api/history') body = { authenticated: true, items: [] };
      else if (url.pathname === '/api/audio-library') {
        if (route.request().method() === 'DELETE') {
          deletes++;
          assert.equal(route.request().headers()['x-owner-scope'], 'delete-owner');
          if (fail) { await route.fulfill({ status: 503, json: { error: 'Temporary deletion error. Please retry.' } }); return; }
          await new Promise(resolve => setTimeout(resolve, 600));
          items = items.filter(row => row.id !== url.searchParams.get('id'));
          body = { success: true };
        } else if (url.searchParams.has('id')) body = { audio_url: 'data:audio/wav;base64,' + wav.toString('base64') };
        else {
          const offset = (Number(url.searchParams.get('page') || 1) - 1) * 10;
          body = { authenticated: true, items: items.slice(offset, offset + 10), total: items.length, totalPages: Math.ceil(items.length / 10) };
        }
      }
      await route.fulfill({ json: body });
    });
    const row = index => page.getByText('Voice ' + index, { exact: true }).locator('xpath=ancestor::tr');
    await page.goto('http://localhost:3011/audio-library', { waitUntil: 'domcontentloaded' });
    await row(1).waitFor();
    await page.evaluate(async () => {
      const db = await new Promise((resolve, reject) => {
        const req = indexedDB.open('VoiceGeneratorDB:delete-owner', 2);
        req.onupgradeneeded = () => { for (const store of ['history', 'presets']) if (!req.result.objectStoreNames.contains(store)) req.result.createObjectStore(store, { keyPath: 'id' }); };
        req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
      });
      await new Promise(resolve => {
        const tx = db.transaction('history', 'readwrite');
        tx.objectStore('history').put({ id: 'voice-1', audioBlob: new Blob(['fixture']) }); tx.oncomplete = resolve;
      }); db.close();
    });
    await row(1).getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal(deletes, 0);
    await row(1).getByRole('button', { name: 'Play', exact: true }).click();
    await row(1).getByRole('button', { name: 'Pause', exact: true }).waitFor();
    await row(1).getByRole('button', { name: 'Delete', exact: true }).click();
    await page.locator('.fixed.inset-0').getByRole('button', { name: 'Delete', exact: true }).click();
    const deleteError = page.locator('.fixed.inset-0').getByRole('alert');
    await deleteError.waitFor();
    assert.match(await deleteError.textContent(), /Temporary deletion error/);
    assert.equal(await row(1).isVisible(), true);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'output/playwright/audio-delete-error-mobile.png' });
    fail = false;
    await page.locator('.fixed.inset-0').getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('button', { name: 'Processing...', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Cancel', exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole('button', { name: 'Processing...', exact: true }).isDisabled(), true);
    await page.getByRole('heading', { name: 'Delete Audio Track', exact: true }).waitFor({ state: 'detached' });
    await row(11).waitFor();
    assert.equal(await row(1).count(), 0);
    assert.equal(deletes, 2);
    assert.ok(await page.evaluate(() => window.pauseCalls >= 1));
    assert.equal(await page.evaluate(async () => {
      const db = await new Promise(resolve => { const req = indexedDB.open('VoiceGeneratorDB:delete-owner', 2); req.onsuccess = () => resolve(req.result); });
      const result = await new Promise(resolve => { const req = db.transaction('history').objectStore('history').get('voice-1'); req.onsuccess = () => resolve(req.result); });
      db.close(); return result === undefined;
    }), true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await row(2).waitFor(); assert.equal(await row(1).count(), 0);
    items.push(item(12));
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.locator('button[title="Next Page"]').click();
    await row(12).waitFor();
    await row(12).getByRole('button', { name: 'Delete', exact: true }).click();
    await page.locator('.fixed.inset-0').getByRole('button', { name: 'Delete', exact: true }).click();
    await row(2).waitFor();
    assert.equal(await row(12).count(), 0); assert.equal(deletes, 3);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ cancel: true, errorRetainsRow: true, loadingPreventsRepeat: true, deletePersistsAfterReload: true,
      offlineCopyRemoved: true, playbackStopped: true, backfillAndLastPage: true, pageErrors: errors.length, mockedDeletion: true }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
