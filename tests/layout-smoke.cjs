/* Native Electron layout regression, always using temporary learning data. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { _electron } = require(process.env.DSA_PLAYWRIGHT || path.join(os.homedir(),
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root = path.resolve(__dirname, '..');

async function screenshot(application, filename) {
  const data = await application.evaluate(async ({ BrowserWindow }) => {
    const contents = BrowserWindow.getAllWindows()[0].webContents;
    await contents.capturePage({}, { stayHidden: false, stayAwake: true });
    await new Promise(resolve => setTimeout(resolve, 150));
    return (await contents.capturePage({}, { stayHidden: false, stayAwake: true })).toDataURL();
  });
  await fs.mkdir(path.join(root, 'test-results'), { recursive: true });
  await fs.writeFile(path.join(root, 'test-results', filename), Buffer.from(data.split(',')[1], 'base64'));
}

async function main() {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dsa-layout-test-'));
  let application;
  const errors = [];
  const settings = async () => JSON.parse(await fs.readFile(path.join(dataDir, 'settings.json'), 'utf8'));
  async function launch(materialDisabled = false) {
    const env = { ...process.env, DSA_TEST: '1', DSA_DATA_DIR: dataDir,
      DSA_DISABLE_MATERIAL: materialDisabled ? '1' : '0' };
    delete env.ELECTRON_RUN_AS_NODE;
    application = await _electron.launch({ executablePath: path.join(root, 'node_modules/electron/dist/electron.exe'),
      args: [root], cwd: root, env, timeout: 30000 });
    const page = await application.firstWindow();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.locator('#connection-label').filter({ hasText: '本地判题已连接' }).waitFor();
    await page.waitForFunction(() => document.querySelectorAll('.lesson-link').length === 28);
    console.log('Window ready; native material disabled:', materialDisabled);
    return page;
  }
  async function close(page) {
    const closed = page.waitForEvent('close');
    await page.locator('[data-window="close"]').click();
    await closed;
    await application.close();
    application = null;
  }
  try {
    let page = await launch();
    const width = () => page.locator('#sidebar').evaluate(element => element.getBoundingClientRect().width);
    const drag = async delta => {
      const box = await page.locator('#sidebar-resizer').boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + delta, box.y + box.height / 2, { steps: 8 });
      await page.mouse.up();
      await page.waitForFunction(() => !document.body.classList.contains('resizing-sidebar'));
    };
    const assertLayout = async () => {
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        mainWidth: document.querySelector('.workspace').getBoundingClientRect().width,
        inspectorRight: document.querySelector('.inspector').getBoundingClientRect().right,
        viewport: innerWidth,
      }));
      assert.equal(layout.overflow, false);
      assert.ok(layout.mainWidth >= 760);
      assert.ok(layout.inspectorRight <= layout.viewport);
    };
    assert.equal(await width(), 222);
    const theme = await page.evaluate(async () => {
      const title = getComputedStyle(document.querySelector('.titlebar'));
      const rail = getComputedStyle(document.querySelector('.activity-rail'));
      const boot = await window.dsa.bootstrap();
      return { size: getComputedStyle(document.body).fontSize, title: title.backgroundColor,
        blur: title.backdropFilter, drag: title.webkitAppRegion,
        rail: rail.backgroundColor, railImage: rail.backgroundImage, titleImage: title.backgroundImage,
        railBlur: rail.backdropFilter, railDrag: rail.webkitAppRegion,
        sidebar: getComputedStyle(document.getElementById('sidebar')).backgroundColor,
        control: getComputedStyle(document.querySelector('[data-window="close"]')).webkitAppRegion,
        material: boot.backgroundMaterial, transparent: document.documentElement.classList.contains('native-material') };
    });
    assert.equal(theme.size, '13px');
    assert.equal(theme.title, 'rgba(38, 35, 43, 0.76)');
    assert.match(theme.blur, /blur\(18px\)/);
    assert.equal(theme.drag, 'drag'); assert.equal(theme.control, 'no-drag');
    assert.equal(theme.transparent, theme.material === 'acrylic');
    assert.equal(theme.rail, theme.title);
    assert.equal(theme.railImage, theme.titleImage);
    assert.equal(theme.railBlur, theme.blur);
    assert.equal(theme.railDrag, 'no-drag');
    assert.equal(theme.sidebar, 'rgb(32, 32, 32)');
    assert.equal(await page.locator('#course-reveal, .tab-add, .document-tabs, #document-title').count(), 0);
    const chrome = await page.evaluate(() => {
      const titlebar = document.querySelector('.titlebar').getBoundingClientRect();
      const stages = document.getElementById('stage-tabs').getBoundingClientRect();
      const button = document.querySelector('[data-window="minimize"]').getBoundingClientRect();
      const icon = document.querySelector('[data-window="minimize"] svg').getBoundingClientRect();
      return { gap: stages.top - titlebar.bottom, iconWidth: icon.width, iconHeight: icon.height,
        offsetX: (icon.left + icon.right - button.left - button.right) / 2,
        offsetY: (icon.top + icon.bottom - button.top - button.bottom) / 2 };
    });
    assert.equal(chrome.gap, 0);
    assert.equal(chrome.iconWidth, 12); assert.equal(chrome.iconHeight, 12);
    assert.ok(Math.abs(chrome.offsetX) < .01 && Math.abs(chrome.offsetY) < .01, '图标在按钮内居中');
    assert.equal(await page.locator('[data-window="minimize"] path').getAttribute('d'), 'M1 6h10');
    for (const panel of ['courses', 'mindmap', 'notes', 'ai']) {
      await page.locator(`[data-panel="${panel}"]`).click();
      await page.locator(`#panel-${panel}`).waitFor({ state: 'visible' });
    }
    await page.locator('[data-panel="courses"]').click();
    await drag(140); assert.equal(await width(), 362);
    console.log('First drag width:', await width());
    await page.waitForFunction(async () => (await window.dsa.bootstrap()).settings.sidebar_width === 362);
    await page.locator('[data-panel="notes"]').click();
    assert.equal(await width(), 362);
    await page.locator('#notes').fill('拖拽后保留的笔记');
    await page.locator('[data-panel="courses"]').click();
    await drag(300); assert.equal(await width(), 420);
    await drag(-700); assert.equal(await width(), 180);
    await page.locator('#sidebar-resizer').dblclick(); assert.equal(await width(), 222);
    await page.locator('#sidebar-resizer').press('End'); assert.equal(await width(), 420);
    await page.locator('#sidebar-resizer').press('ArrowLeft'); assert.equal(await width(), 410);
    await page.locator('#sidebar-resizer').press('Shift+ArrowLeft'); assert.equal(await width(), 380);
    await page.locator('#sidebar-resizer').press('Home'); assert.equal(await width(), 180);
    await page.locator('#sidebar-resizer').press('Enter'); assert.equal(await width(), 222);
    console.log('Drag limits and keyboard controls passed');
    await page.locator('.lesson-link[data-lesson="sorting.bubble_sort"]').click();
    await page.waitForFunction(() => document.getElementById('lesson-title').textContent === '冒泡排序');
    await drag(138); assert.equal(await width(), 360);
    await assertLayout();
    await screenshot(application, 'resizable-sidebar-large.png');
    await page.locator('[data-window="minimize"]').click();
    const minimized = await application.evaluate(async ({ BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows()[0];
      for (let attempt = 0; attempt < 30 && !window.isMinimized(); attempt++)
        await new Promise(resolve => setTimeout(resolve, 50));
      return window.isMinimized();
    });
    assert.equal(minimized, true, '窗口按钮应执行原生最小化');
    console.log('Native minimize passed');
    await application.evaluate(({ BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows()[0];
      // Restoring then hiding suppresses requestAnimationFrame used by layout assertions.
      window.restore();
    });
    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1060, 740));
    await page.waitForFunction(() => innerWidth === 1060 && document.getElementById('sidebar').offsetWidth === 243);
    assert.equal(await width(), 243); await assertLayout();
    await screenshot(application, 'resizable-sidebar-small.png');
    await page.locator('[data-stage="practice"]').click();
    await page.locator('#practice-page').waitFor({ state: 'visible' });
    const editor = await page.locator('#code-editor').boundingBox();
    assert.ok(editor.width >= 280 && editor.height > 150);
    await page.evaluate(() => window.ace.edit('code-editor').setValue('// resizing preserves this draft', -1));
    await screenshot(application, 'resizable-practice-small.png');
    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1480, 960));
    await page.waitForFunction(() => document.getElementById('sidebar').offsetWidth === 360);
    await close(page);
    assert.equal((await settings()).sidebar_width, 360);
    // Restart proves disk persistence, and explicitly exercise the non-material fallback.
    page = await launch(true);
    assert.equal(await width(), 360);
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains('native-material')), false);
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(27, 27, 27)');
    await page.locator('#practice-page').waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => window.ace.edit('code-editor').getValue()), '// resizing preserves this draft');
    await page.locator('.lesson-link[data-lesson="intro.algorithm_complexity"]').click();
    await page.locator('[data-panel="notes"]').click();
    assert.equal(await page.locator('#notes').inputValue(), '拖拽后保留的笔记');
    await page.locator('#sidebar-resizer').dblclick();
    await close(page);
    assert.equal((await settings()).sidebar_width, 0);
    assert.deepEqual(errors, []);
    console.log('Layout passed: no document tab strip, centered SVG controls, native minimize/restore, glass titlebar/rail, navigation, resizing, restart persistence, draft/note preservation and opaque fallback.');
  } finally {
    if (application) await application.close();
    if (path.dirname(dataDir) !== os.tmpdir() || !path.basename(dataDir).startsWith('dsa-layout-test-'))
      throw new Error('Unexpected temporary data path');
    await fs.rm(dataDir, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
