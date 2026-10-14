const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
function pageRoutes(root, prefix = '') {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? pageRoutes(path.join(root, entry.name), prefix + '/' + entry.name)
    : entry.name === 'page.tsx' ? [prefix] : []);
}
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const user = { id: 'route-fixture', name: 'Route tester', email: 'tester@example.test', available_credits: 100, tier: 'free', created_at: '2026-10-14T00:00:00Z' };
    let authenticated = true;
    let videoTitle = 'Fixture video';
    const quota = { generations_used: 0, max_daily_generations: 100, max_chars_per_request: 2500, chars_used_today: 0, max_daily_chars: 100000, reset_at: '2026-10-15T00:00:00Z' };
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url());
      let body = { authenticated: true, items: [], templates: [], pages: [], posts: [], models: [], voices: [], presets: [], transactions: [], total: 0, totalPages: 1 };
      if (url.pathname === '/api/auth/session' || url.pathname === '/api/settings') body = { ...body, authenticated, user: authenticated ? user : null, quota, owner_scope: authenticated ? 'route-fixture' : 'guest:fixture', total_templates: 0 };
      if (url.pathname === '/api/templates' && url.searchParams.get('id')) {
        const facebook = url.searchParams.get('id') === 'fixture-facebook';
        body.template = { id: url.searchParams.get('id'), name: 'Route fixture', audio_urls: [],
          json_data: facebook ? { platform: 'facebook', content_plan: [{ theme: 'Fixture', posts: [{ id: 'post_0_0', caption: 'Fixture caption', tags: [] }] }] }
            : { platform: 'youtube', content_strategy: { long_video: { id: 'long_1', title: videoTitle, script: 'Fixture script', tags: [], keywords: [] }, shorts: [] } } };
      }
      await route.fulfill({ json: body });
    });
    const routes = pageRoutes(path.join(process.cwd(), 'app/(workspace)')).sort();
    const checked = [];
    for (const route of routes) {
      let query = '';
      if (route.endsWith('/detail')) query = route.startsWith('/facebook') ? '?templateId=fixture-facebook&itemId=post_0_0' : '?templateId=fixture-youtube&itemId=long_1';
      if (route.endsWith('/content')) query = '?id=' + (route.startsWith('/facebook') ? 'fixture-facebook' : 'fixture-youtube');
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('http://localhost:3011' + route + query, { waitUntil: 'domcontentloaded' });
      const sidebar = page.locator('#workspace-sidebar'); await sidebar.waitFor();
      assert.equal(await sidebar.count(), 1, route + ': duplicate/missing sidebar');
      const wallet = page.getByLabel('Wallet balance', { exact: true });
      await wallet.getByText('🪙 100', { exact: true }).waitFor();
      assert.equal(await wallet.count(), 1, route + ': one shared wallet');
      const pageTitle = page.locator('[data-workspace-page-header] h1').first();
      if (['/admin', '/audio-library', '/facebook/integration', '/facebook/templates', '/json-generator', '/settings', '/templates', '/youtube/templates'].includes(route)) {
        await pageTitle.waitFor({ timeout: 10000 }).catch(error => { throw new Error(route + ': ' + error.message); });
        assert.equal(await pageTitle.evaluate(el => getComputedStyle(el).fontSize), '24px', route + ': consistent title size');
        const expectedTitle = (await pageTitle.locator(':scope > span').last().innerText()).trim();
        await page.waitForFunction(expected => document.querySelector('[data-workspace-title]')?.textContent === expected, expectedTitle);
      }
      if (route.startsWith('/youtube/content')) {
        await page.waitForFunction(() => document.querySelector('[data-workspace-title]')?.textContent === 'Fixture video');
      }
      if (route === '/billing') await page.waitForFunction(() => document.querySelector('[data-workspace-title]')?.textContent === 'Pricing & Wallet Management');
      if (route === '/templates') assert.equal(await page.getByRole('button', { name: 'Refresh', exact: true }).count(), 1, 'saved-template refresh action preserved');
      assert.equal(await wallet.isVisible(), true, route + ': desktop balance visible');
      const menu = page.getByRole('button', { name: 'Open sidebar', exact: true, includeHidden: true });
      assert.equal(await menu.count(), 1, route + ': duplicate/missing header');
      assert.equal(await menu.isVisible(), false, route + ': desktop header visibility');
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForFunction(() => document.getElementById('workspace-sidebar').getBoundingClientRect().right <= 1);
      assert.equal(await menu.isVisible(), true, route + ': mobile header visibility');
      assert.equal(await wallet.isVisible(), true, route + ': mobile balance visible');
      const bounds = await wallet.boundingBox(); assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 391, route + ': wallet fits mobile');
      await menu.click();
      await page.waitForFunction(() => document.getElementById('workspace-sidebar').getBoundingClientRect().left >= -1);
      await page.getByRole('button', { name: 'Close sidebar', exact: true }).click();
      await page.waitForFunction(() => document.getElementById('workspace-sidebar').getBoundingClientRect().right <= 1);
      checked.push(route);
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByRole('link', { name: 'All Templates', exact: true }).click();
    await page.waitForURL('**/templates');
    await page.waitForFunction(() => document.querySelector('[data-workspace-title]')?.textContent === 'Saved Templates');
    await page.getByRole('link', { name: 'Audio Library', exact: true }).click();
    await page.waitForURL('**/audio-library');
    await page.waitForFunction(() => document.querySelector('[data-workspace-title]')?.textContent === 'GenZee Audio Library');
    await page.setViewportSize({ width: 390, height: 844 });
    videoTitle = 'A very long dynamic video title '.repeat(12).trim();
    await page.goto('http://localhost:3011/youtube/content/detail?templateId=fixture-youtube&itemId=long_1', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(title => document.querySelector('[data-workspace-title]')?.textContent === title, videoTitle);
    assert.equal(await page.locator('[data-workspace-title]').getAttribute('title'), videoTitle);
    await page.getByLabel('Wallet balance', { exact: true }).getByText('🪙 100', { exact: true }).waitFor();
    await page.screenshot({ path: 'output/playwright/workspace-dynamic-title-mobile.png', fullPage: false });
    videoTitle = 'Fixture video';
    await page.goto('http://localhost:3011/facebook-integration', { waitUntil: 'domcontentloaded' });
    await page.waitForURL('**/facebook/integration'); await page.locator('#workspace-sidebar').waitFor();
    const wallet = page.getByLabel('Wallet balance', { exact: true });
    user.available_credits = 22;
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('credits-updated', { detail: { credits: 22 } })));
    await wallet.getByText('🪙 22', { exact: true }).waitFor();
    user.available_credits = 0;
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await wallet.getByText('🪙 0', { exact: true }).waitFor();
    await wallet.getByRole('button', { name: /Top Up/ }).click();
    await page.getByText('Top-Up Wallet', { exact: false }).first().waitFor();
    await page.screenshot({ path: 'output/playwright/workspace-wallet-mobile.png', fullPage: false });
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3011/audio-library', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-workspace-page-header]').waitFor();
    await wallet.getByText('🪙 0', { exact: true }).waitFor();
    assert.equal(await page.getByText('2,717', { exact: false }).count(), 0);
    await page.screenshot({ path: 'output/playwright/workspace-wallet-desktop.png', fullPage: false });
    user.available_credits = null;
    await page.goto('http://localhost:3011/admin', { waitUntil: 'domcontentloaded' });
    await wallet.getByText('🪙 —', { exact: true }).waitFor();
    await page.waitForFunction(() => document.querySelector('[aria-label="Wallet balance"] button')?.disabled === true);
    authenticated = false;
    await page.goto('http://localhost:3011/audio-library', { waitUntil: 'domcontentloaded' });
    await wallet.getByText('🪙 —', { exact: true }).waitFor();
    assert.equal(await wallet.getByRole('button', { name: /Top Up/ }).isDisabled(), true, 'guest has no invented wallet or paid actions');
    await page.goto('http://localhost:3011', { waitUntil: 'domcontentloaded' });
    assert.equal(await wallet.count(), 0, 'marketing page keeps its navbar');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ workspacePages: checked.length, routes: checked, oneShellPerPage: true,
      balanceOnEveryPage: true, dynamicTitles: true, clientNavigationTitles: true, longMobileTitle: true, creditEventAndFocusRefresh: true, zeroBalance: true, desktopSidebar: true, mobileHeaderAndToggle: true, legacyFacebookRedirect: true, pageErrors: errors.length }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
