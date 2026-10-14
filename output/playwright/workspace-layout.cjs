const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/**', route => route.fulfill({ json: new URL(route.request().url()).pathname === '/api/auth/session'
      ? { authenticated: true, owner_scope: 'layout-fixture', user: { name: 'Workspace tester', email: 'tester@example.test', available_credits: 100 } }
      : { authenticated: true, items: [], models: [], voices: [], presets: [], total: 0, totalPages: 1 } }));
    await page.goto('http://localhost:3011/audio-library', { waitUntil: 'domcontentloaded' });
    const sidebar = page.locator('#workspace-sidebar');
    await sidebar.waitFor();
    assert.equal(await page.getByRole('button', { name: 'Open sidebar', exact: true }).isVisible(), false);
    assert.match(await sidebar.getByRole('link', { name: 'Audio Library', exact: true }).getAttribute('class'), /border-l-2/);
    assert.equal(await sidebar.getByRole('link', { name: 'Settings', exact: true }).count(), 1);
    await page.screenshot({ path: 'output/playwright/workspace-components-desktop.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    const closed = () => page.waitForFunction(() => document.getElementById('workspace-sidebar').getBoundingClientRect().right <= 1);
    const opened = () => page.waitForFunction(() => document.getElementById('workspace-sidebar').getBoundingClientRect().left >= -1);
    await closed();
    const menu = page.getByRole('button', { name: 'Open sidebar', exact: true });
    await menu.click(); await opened();
    assert.equal(await menu.getAttribute('aria-expanded'), 'true');
    await page.screenshot({ path: 'output/playwright/workspace-components-mobile.png' });
    await page.getByRole('button', { name: 'Close sidebar', exact: true }).click(); await closed();
    assert.equal(await menu.getAttribute('aria-expanded'), 'false');
    await menu.click(); await opened();
    await page.locator('.fixed.inset-0.z-40').click({ position: { x: 380, y: 300 } }); await closed();
    await menu.click(); await opened();
    await sidebar.getByRole('link', { name: 'Voice Generator', exact: true }).click();
    await page.waitForURL('**/admin'); await closed();
    assert.match(await sidebar.getByRole('link', { name: 'Voice Generator', exact: true }).getAttribute('class'), /border-l-2/);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    assert.equal(await page.locator('main').isVisible(), true);
    await page.setViewportSize({ width: 1280, height: 900 }); await opened();
    assert.equal(await menu.isVisible(), false);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ desktopSidebar: true, mobileHeader: true, openCloseProps: true, overlayClose: true,
      navigationClose: true, activeLinks: true, identityBoundaryPreserved: true, pageErrors: errors.length }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
