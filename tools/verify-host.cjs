// Optional Playwright integration check. Supply a private file containing the
// isolated DSH launch URL; no URL or authentication value is printed.
// NODE_PATH=<playwright modules> node tools/verify-host.cjs <url-file> <output-dir>
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const [urlFile, out] = process.argv.slice(2);
if (!urlFile || !out) throw Error('Expected isolated DSH URL file and screenshot output directory');
const url = fs.readFileSync(urlFile, 'utf8').match(/http:\/\/[^\s]+/)?.[0];
if (!url) throw Error('No isolated DSH launch URL in file');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'zh-CN' });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(url);
    await page.waitForFunction(() => window.__dshSidebarShortcuts);
    // Fresh isolated profiles may show these non-binding onboarding dialogs.
    for (let i = 0; i < 3; i++) {
      const later = page.getByRole('button', { name: '稍后配置', exact: true });
      const next = page.getByRole('button', { name: '继续', exact: true });
      const start = page.getByRole('dialog').filter({ hasText: '开始使用' });
      if (await start.count()) { await start.getByRole('button', { name: '关闭', exact: true }).click(); continue; }
      try { await page.waitForFunction(() => [...document.querySelectorAll('[role="dialog"] button')].some(b => ['稍后配置', '继续'].includes(b.textContent.trim())), null, { timeout: 4000 }); } catch { break; }
      if (await later.isVisible()) await later.click(); else if (await next.isVisible()) await next.click(); else break;
    }
    const onboarding = page.getByRole('dialog').filter({ hasText: '开始使用' });
    if (await onboarding.count()) await onboarding.getByRole('button', { name: '关闭', exact: true }).click();
    const nav = page.locator('nav[aria-label="全局面板"]');
    assert.equal(await nav.getAttribute('data-dss-view'), 'tiles');
    const rects = () => nav.locator('button:visible').evaluateAll(rows => rows.map(b => { const r = b.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }));
    const tileRects = await rects(); assert.ok(tileRects.length >= 2, 'Use an isolated fixture with at least two native panels');
    assert.equal(tileRects[0].y, tileRects[1].y); assert.ok(tileRects[1].x > tileRects[0].x);
    await page.screenshot({ path: path.join(out, 'tiles.png') });
    async function settings() {
      const direct = page.getByRole('button', { name: '设置', exact: true });
      if (await direct.count()) await direct.click();
      else { await page.getByText('更多', { exact: true }).last().click(); await page.getByText('设置', { exact: true }).click(); }
      await page.getByRole('button', { name: '侧栏快捷入口', exact: true }).click();
      await page.locator('[data-dss-settings]').waitFor();
    }
    await settings();
    const mode = page.getByRole('combobox', { name: '显示方式', exact: true });
    await mode.selectOption('compact');
    assert.equal(await nav.getAttribute('data-dss-view'), 'compact');
    const compactRects = await rects(); assert.ok(compactRects[0].h < tileRects[0].h);
    const controls = page.locator('[data-dss-settings]');
    const memory = controls.getByRole('checkbox', { name: '记忆系统', exact: true });
    await memory.uncheck(); assert.equal(await nav.locator('button[aria-label="记忆系统"]').isVisible(), false);
    await page.screenshot({ path: path.join(out, 'settings-compact.png') });
    await mode.selectOption('native');
    assert.equal(await nav.getAttribute('data-dss-view'), null);
    assert.ok(await nav.locator('button[aria-label="记忆系统"]').isVisible());
    assert.ok(await nav.locator('button[aria-label="更多"]').isVisible());
    await page.screenshot({ path: path.join(out, 'native.png') });
    await mode.selectOption('tiles'); await memory.check();
    await controls.getByRole('checkbox', { name: '隐藏「更多」按钮', exact: true }).uncheck();
    assert.ok(await nav.locator('button[aria-label="更多"]').isVisible());
    await controls.getByRole('checkbox', { name: '隐藏「更多」按钮', exact: true }).check();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: '记忆系统', exact: true }).click();
    await page.locator('[data-test-panel="fixture-memory"]').waitFor();
    assert.equal(await nav.locator('button[aria-label="记忆系统"]').getAttribute('aria-current'), 'page');
    await page.getByRole('button', { name: '收起侧边栏', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('[data-dss-view]'));
    await page.getByRole('button', { name: '打开侧边栏', exact: true }).first().click();
    await page.waitForFunction(() => document.querySelector('[data-dss-view="tiles"]'));
    await page.reload(); await page.waitForFunction(() => window.__dshSidebarShortcuts && document.querySelector('[data-dss-view="tiles"]'));
    assert.equal(await nav.getAttribute('data-dss-view'), 'tiles');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.screenshot({ path: path.join(out, 'dark.png') });
    await page.evaluate(() => window.__dshSidebarShortcuts.dispose());
    assert.equal(await page.locator('[data-dss-view], [data-dss-button], [data-dss-hidden], [data-dss-settings]').count(), 0);
    assert.ok(await nav.locator('button[aria-label="更多"]').isVisible());
    assert.deepEqual(errors, []);
    console.log('PASS: real DSH loader/settings, both layouts, hiding/More, native restoration, original actions/selection, collapse/reopen, reload persistence, disposal; no page errors');
  } finally { await browser.close(); }
})().catch(e => { console.error(String(e.stack || e).replace(/http:\/\/\S+/g, '[local URL]')); process.exitCode = 1; });
