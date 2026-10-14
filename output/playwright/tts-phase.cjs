process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = '1';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  let generated = 0, retried = 0, polled = 0;
  let detailRetried = 0;
  let serverHistory = false;
  let completedOnce = false;
  const streamCursors = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.previewParts = [];
    document.addEventListener('play', event => {
      if (event.target instanceof HTMLAudioElement && event.target.src.startsWith('blob:')) {
        fetch(event.target.src).then(r => r.arrayBuffer()).then(bytes => window.previewParts.push(new DataView(bytes).getInt16(44, true)));
      }
    }, true);
  });
  const audio = Buffer.alloc(524);
  audio.write('RIFF', 0); audio.writeUInt32LE(516, 4); audio.write('WAVEfmt ', 8);
  audio.writeUInt32LE(16, 16); audio.writeUInt16LE(1, 20); audio.writeUInt16LE(1, 22);
  audio.writeUInt32LE(24000, 24); audio.writeUInt32LE(48000, 28);
  audio.writeUInt16LE(2, 32); audio.writeUInt16LE(16, 34); audio.write('data', 36); audio.writeUInt32LE(480, 40);
  await page.route('**/api/**', async route => {
    const req = route.request(); const path = new URL(req.url()).pathname;
    let body = {};
    if (path === '/api/history' && serverHistory) {
      await route.fulfill({ json: { authenticated: true, items: [{ id: 'browser-job', prompt_text: 'Original script',
        model_id: 'gemini-test', voice_id: 'Kore', parameters: { server_owned_job: true, speed: 1.2 }, audio_url: null }] } }); return;
    }
    if (path === '/api/templates') {
      await route.fulfill({ json: { template: { id: 'fixture-template', name: 'Recovery test',
        json_data: { content_strategy: { long_video: { id: 'long_1', title: 'Recovery example', script: 'Original script', tags: [] } } },
        audio_urls: [{ audio_id: 'long_1', job_id: 'detail-job', voice_name: 'Kore', audio_url: null }] } } });
      return;
    }
    if (path === '/api/templates/audio-job/retry' && req.postDataJSON().jobId === 'detail-job') {
      detailRetried++;
      await route.fulfill({ json: { job_id: 'detail-job', status: 'processing' } }); return;
    }
    if (path === '/api/templates/audio-job/status' && new URL(req.url()).searchParams.get('jobId') === 'detail-job') {
      await route.fulfill({ json: detailRetried
        ? { job_id: 'detail-job', status: 'completed', audio_url: 'data:audio/wav;base64,' + audio.toString('base64'), chunks: { completed: 1, total: 1 } }
        : { job_id: 'detail-job', status: 'failed', error: 'Try again', retry_available: true, chunks: { completed: 0, total: 1 } } }); return;
    }
    if (path === '/api/auth/session') body = { authenticated: true, owner_scope: 'user:browser-test', user: { available_credits: 100, tier: 'free' }, quota: { generations_used: 0, max_daily_generations: 100 } };
    else if (path === '/api/voiceover/models') body = { models: [{ name: 'gemini-test', provider: 'gemini', is_local: false }] };
    else if (path === '/api/voiceover/voices') body = { voices: [{ name: 'Kore', gender: 'Female' }], total_count: 1 };
    else if (path === '/api/voiceover') { generated++; body = { status: 'processing', job_id: 'browser-job', job_token: 'test-guest-proof' }; }
    else if (path === '/api/templates/audio-job/stream') {
      const after = Number(new URL(req.url()).searchParams.get('after'));
      streamCursors.push(after);
      const indexes = retried ? [0, 1, 2].filter(index => index >= after) : (after === 0 ? [0] : []);
      const events = indexes.map(index => {
        const partAudio = Buffer.from(audio); partAudio.writeInt16LE(index + 1, 44);
        return { event: 'chunk', index, total: 3, audio: partAudio.toString('base64') };
      });
      if (streamCursors.length !== 3) events.push({ event: retried ? 'completed' : 'failed', next_index: retried ? 3 : 1 });
      await route.fulfill({ contentType: 'application/x-ndjson', body: events.map(e => JSON.stringify(e)).join('\n') + '\n' });
      return;
    }
    else if (path === '/api/templates/audio-job/retry') {
      retried++; assert.deepEqual(req.postDataJSON(), { jobId: 'browser-job' });
      assert.equal(req.headers()['x-voice-job-token'], 'test-guest-proof');
      body = { status: 'processing', job_id: 'browser-job' };
    } else if (path === '/api/templates/audio-job/status') {
      polled++;
      if (!retried && polled === 1) await new Promise(resolve => setTimeout(resolve, 1200));
      if (retried && !completedOnce) { await page.waitForFunction(() => window.previewParts.length === 3); completedOnce = true; }
      body = retried ? { job_id: 'browser-job', status: 'completed', audio_url: 'data:audio/wav;base64,' + audio.toString('base64'), chunks: { completed: 3, total: 3 }, retry_available: false }
        : { job_id: 'browser-job', status: 'failed', error: 'One audio part needs another attempt.', chunks: { completed: 2, total: 3 }, retry_available: true };
    }
    await route.fulfill({ json: body });
  });
  await page.goto('http://localhost:3011', { waitUntil: 'domcontentloaded' });
  let studio = page.locator('#live-studio');
  await studio.getByRole('button', { name: 'Generate Voiceover', exact: true }).click();
  await page.getByRole('button', { name: /Generate Short/i }).click();
  await studio.getByText('Generating your audio...', { exact: true }).waitFor();
  await studio.getByLabel('Audio generation status', { exact: true }).screenshot({ path: 'output/playwright/tts-processing-layout.png' });
  await studio.getByRole('button', { name: 'Retry unfinished audio' }).waitFor();
  await studio.getByRole('button', { name: 'Listen live', exact: true }).click();
  await studio.getByText('Live preview: part 1', { exact: true }).waitFor();
  assert.equal(await studio.getByRole('progressbar').getAttribute('aria-valuenow'), '2');
  await studio.screenshot({ path: 'output/playwright/tts-retry-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await studio.getByRole('button', { name: 'Retry unfinished audio' }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'output/playwright/tts-retry-mobile.png' });
  await page.goto('http://localhost:3011/audio-library', { waitUntil: 'domcontentloaded' });
  await page.getByRole('link', { name: 'Resume in Studio', exact: true }).click();
  await page.getByRole('button', { name: 'Retry unfinished audio', exact: true }).waitFor();
  await page.reload({ waitUntil: 'domcontentloaded' });
  studio = page;
  await studio.getByRole('button', { name: 'Retry unfinished audio', exact: true }).waitFor();
  await studio.getByRole('button', { name: 'Listen live', exact: true }).click();
  await studio.getByText('Live preview: part 1', { exact: true }).waitFor();
  if (streamCursors.length < 4) await page.waitForResponse(response => new URL(response.url()).pathname === '/api/templates/audio-job/stream'
    && new URL(response.url()).searchParams.get('after') === '1');
  await studio.locator('textarea').fill('Edited script should not replace the pending job.');
  await studio.getByRole('button', { name: 'Retry unfinished audio' }).click();
  await studio.getByRole('button', { name: 'Play voiceover', exact: true }).waitFor();
  await studio.getByRole('button', { name: 'Retry unfinished audio' }).waitFor({ state: 'detached' });
  assert.equal(await studio.getByRole('button', { name: /Listen live|Pause live preview/ }).count(), 0);
  assert.equal(await studio.getByRole('progressbar', { name: 'Voiceover progress' }).count(), 0);
  assert.equal(await studio.getByLabel('Audio generation status', { exact: true }).count(), 0);
  assert.equal(await studio.getByText('Your request is processing. Please wait...', { exact: true }).count(), 0);
  await page.screenshot({ path: 'output/playwright/tts-completed-layout-mobile.png' });
  await page.waitForFunction(() => window.previewParts.length === 3);
  assert.deepEqual(await page.evaluate(() => window.previewParts), [1, 2, 3]);
  assert.deepEqual(streamCursors, [0, 0, 0, 1, 1]);
  assert.equal(generated, 1); assert.equal(retried, 1); assert.ok(polled >= 4);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('genzee:user:browser-test:pending_audio_jobs')).length), 0);
  await page.goto('http://localhost:3011/youtube/content/detail?templateId=fixture-template&itemId=long_1', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Retry unfinished audio', exact: true }).click();
  await page.getByRole('button', { name: 'Play voiceover', exact: true }).waitFor();
  assert.equal(detailRetried, 1); assert.equal(generated, 1);
  await page.screenshot({ path: 'output/playwright/tts-detail-recovery-mobile.png' });
  serverHistory = true;
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:3011/admin?resumeJob=browser-job', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Play voiceover', exact: true }).waitFor();
  assert.equal(await page.locator('textarea').inputValue(), 'Original script');
  assert.equal(generated, 1); assert.equal(retried, 1);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ generated, retried, polled, streamCursors, detailRetried, serverHistoryRecovery: true, orderedPlayback: true, completedProgressRemoved: true, liveControlsGrouped: true, pageErrors: errors.length, desktopAndMobile: true }));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
