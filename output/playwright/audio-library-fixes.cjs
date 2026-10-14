const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let owner = 'user:a', finished = false, synced = false, delaySession = false, generations = 0;
    const audio = Buffer.alloc(524);
    audio.write('RIFF'); audio.writeUInt32LE(516, 4); audio.write('WAVEfmt ', 8);
    audio.writeUInt32LE(16, 16); audio.writeUInt16LE(1, 20); audio.writeUInt16LE(1, 22);
    audio.writeUInt32LE(24000, 24); audio.writeUInt32LE(48000, 28);
    audio.writeUInt16LE(2, 32); audio.writeUInt16LE(16, 34); audio.write('data', 36); audio.writeUInt32LE(480, 40);
    const audioUrl = 'data:audio/wav;base64,' + audio.toString('base64');
    const row = (id, prompt) => ({ id, prompt_text: prompt, model_id: 'gemini-test', model_name: 'Gemini Voice',
      voice_id: 'Kore', voice_name: 'Kore', created_at: '2026-10-14T10:00:00Z', parameters: { server_owned_job: true }, audio_url: null });
    await page.addInitScript(() => {
      if (!localStorage.getItem('fixture-seeded')) {
        localStorage.setItem('fixture-seeded', '1');
        localStorage.setItem('genzee:user:a:pending_audio_jobs', JSON.stringify(['stale', 'working'].map(jobId => ({
          jobId, ownerScope: 'user:a', voice: 'Kore', model: 'gemini-test', format: 'long', params: { text: jobId + ' script', voice: 'Kore', rate: 1, pitch: 1, volume: 1 },
        }))));
      }
    });
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      let body = {};
      if (url.pathname === '/api/auth/session') {
        if (delaySession) await new Promise(resolve => setTimeout(resolve, 800));
        body = { authenticated: true, owner_scope: owner, user: { id: owner, available_credits: 100 } };
      } else if (url.pathname === '/api/history') {
        body = { authenticated: true, items: owner === 'user:a' && !synced ? [row('working', 'working script')] : [] };
      } else if (url.pathname === '/api/templates/audio-job/status') {
        const id = url.searchParams.get('jobId');
        const complete = id === 'stale' || finished;
        if (id === 'working' && complete) synced = true;
        body = { job_id: id, status: complete ? 'completed' : 'processing', audio_url: complete ? audioUrl : null };
      } else if (url.pathname === '/api/audio-library') {
        if (url.searchParams.has('id')) body = { audio_url: audioUrl };
        else {
          const items = owner === 'user:a' ? [row('stale', 'Completed Studio audio'), ...(synced ? [row('working', 'Newly completed audio')] : [])] : [row('b-job', 'Account B audio')];
          body = { authenticated: true, items, total: items.length, totalPages: 1, page: 1 };
        }
      } else if (url.pathname === '/api/voiceover') generations++;
      await route.fulfill({ json: body });
    });
    await page.goto('http://localhost:3011/audio-library', { waitUntil: 'domcontentloaded' });
    await page.getByText('Completed Studio audio', { exact: true }).waitFor();
    await page.getByRole('link', { name: 'Resume in Studio', exact: true }).waitFor();
    assert.equal(await page.getByRole('link', { name: 'Resume in Studio' }).count(), 1);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('genzee:user:a:pending_audio_jobs')).some(job => job.jobId === 'stale')), false);
    delaySession = true;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    assert.equal(await page.getByRole('heading', { name: 'GenZee Audio Library' }).isVisible(), true);
    assert.equal(await page.getByText('Completed Studio audio', { exact: true }).isVisible(), true);
    await page.waitForResponse(response => new URL(response.url()).pathname === '/api/auth/session');
    delaySession = false;
    finished = true;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.getByText('Unfinished voiceovers', { exact: true }).waitFor({ state: 'detached' });
    await page.getByText('Newly completed audio', { exact: true }).waitFor();
    await page.locator('button[title="Play"]').first().click();
    await page.screenshot({ path: 'output/playwright/audio-library-fixed-desktop.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('heading', { name: 'GenZee Audio Library' }).waitFor();
    await page.waitForFunction(() => document.querySelector('aside').getBoundingClientRect().right <= 1);
    await page.screenshot({ path: 'output/playwright/audio-library-fixed-mobile.png' });
    owner = 'user:b';
    await page.evaluate(() => window.dispatchEvent(new Event('identity-changed')));
    await page.getByText('Account B audio', { exact: true }).waitFor();
    assert.equal(await page.getByText('Completed Studio audio', { exact: true }).count(), 0);
    owner = 'user:a';
    await page.goto('http://localhost:3012/audio-library', { waitUntil: 'domcontentloaded' });
    // The seeded completed pending jobs should also recover into offline history.
    await page.getByText('stale script', { exact: true }).waitFor();
    await page.getByText('Unfinished voiceovers', { exact: true }).waitFor({ state: 'detached' });
    await page.evaluate(async bytes => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('VoiceGeneratorDB:user:a', 2);
        request.onupgradeneeded = () => {
          for (const name of ['history', 'presets']) if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name, { keyPath: 'id' });
        };
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      });
      await new Promise((resolve, reject) => {
        const tx = db.transaction('history', 'readwrite');
        tx.objectStore('history').put({ id: 'offline-a', prompt_text: 'Offline account A audio', model_id: 'gemini-test', model_name: 'Gemini Voice',
          voice_id: 'Kore', voice_name: 'Kore', created_at: new Date().toISOString(), audioBlob: new Blob([new Uint8Array(bytes)], { type: 'audio/wav' }) });
        tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
      });
      db.close(); window.dispatchEvent(new Event('focus'));
    }, [...audio]);
    await page.getByText('Offline account A audio', { exact: true }).waitFor();
    owner = 'user:b';
    await page.evaluate(() => window.dispatchEvent(new Event('identity-changed')));
    await page.getByText('No Audio Files Found', { exact: true }).waitFor();
    assert.equal(await page.getByText('Offline account A audio', { exact: true }).count(), 0);
    assert.equal(generations, 0); assert.deepEqual(errors, []);
    console.log(JSON.stringify({ completedLibrary: true, stalePendingRemoved: true, completionRefresh: true, focusStaysVisible: true,
      offlineHistory: true, accountIsolation: true, generations, pageErrors: errors.length, desktopAndMobile: true }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
