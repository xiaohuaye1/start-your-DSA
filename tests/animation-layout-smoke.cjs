/* Real source / portable application; no personal learning data is used. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { seekStep, finishAnimation } = require('./animation-actions.cjs');
const { _electron } = require(process.env.DSA_PLAYWRIGHT || path.join(os.homedir(),
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root = path.resolve(__dirname, '..');

async function capture(app, filename) {
  const data = await app.evaluate(async ({ BrowserWindow }) => {
    const web = BrowserWindow.getAllWindows()[0].webContents;
    await web.capturePage({}, { stayHidden: false, stayAwake: true });
    await new Promise(resolve => setTimeout(resolve, 100));
    return (await web.capturePage({}, { stayHidden: false, stayAwake: true })).toDataURL();
  });
  await fs.mkdir(path.join(root, 'test-results'), { recursive: true });
  await fs.writeFile(path.join(root, 'test-results', filename), Buffer.from(data.split(',')[1], 'base64'));
}

async function main() {
  const data = await fs.mkdtemp(path.join(os.tmpdir(), 'dsa-animation-layout-'));
  let app;
  try {
    const packaged = Boolean(process.env.DSA_PACKAGED_EXE);
    const env = { ...process.env, DSA_TEST: '1', DSA_DATA_DIR: data };
    delete env.ELECTRON_RUN_AS_NODE;
    if (packaged) {
      env.PATH = path.join(process.env.SystemRoot, 'System32');
      env.DSA_PYTHON = 'missing-python.exe';
      delete env.PYTHONHOME; delete env.PYTHONPATH; delete env.DSA_TOOLCHAIN;
    }
    app = await _electron.launch({ executablePath: process.env.DSA_PACKAGED_EXE ||
      path.join(root, 'node_modules/electron/dist/electron.exe'),
      args: packaged ? [] : [root], cwd: root, env, timeout: 60000 });
    const page = await app.firstWindow();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.waitForFunction(() => document.getElementById('course-tree').getAttribute('aria-busy') === 'false' &&
      document.getElementById('connection-label').textContent === '本地判题已连接');
    assert.equal(await page.locator('#animation-tools, #round-select, #array-input, #target-input, #generate, #reset-view, #timeline, #speed, #reset, .playback').count(), 0);
    assert.equal(await page.locator('.playback-control').count(), 3);
    const appearance = await page.locator('.playback-control').evaluateAll(buttons => buttons.map(button => {
      const style = getComputedStyle(button);
      return [button.textContent.trim(), style.backgroundColor, style.borderTopWidth, style.borderRadius, style.boxShadow];
    }));
    assert.deepEqual(appearance, Array(3).fill(['', 'rgba(0, 0, 0, 0)', '0px', '0px', 'none']));
    const boot = await page.evaluate(() => window.dsa.bootstrap());
    console.log('Connected; checking all animation pages.');
    for (const lesson of boot.lessons) {
      console.log('Checking ' + lesson.id);
      const loaded = await page.evaluate(lesson => window.dsa.loadStage({ lesson, stage: 'animation', language: 'C' }), lesson.id);
      await page.locator(`.lesson-link[data-lesson="${lesson.id}"]`).evaluate(element => element.click());
      await page.waitForFunction(({ id, source }) => document.querySelector('.lesson-link.active')?.dataset.lesson === id &&
        document.getElementById('course-tree').getAttribute('aria-busy') === 'false' &&
        document.getElementById('array-canvas').dataset.demo === source, { id: lesson.id, source: loaded.stage.source });
      const original = await page.locator('#variables').textContent();
      assert.equal(await page.locator('#previous').isDisabled(), true);
      await page.locator('#next').evaluate(element => element.click());
      assert.equal(await page.locator('#array-canvas').getAttribute('data-step'), '1');
      await page.locator('#previous').evaluate(element => element.click());
      assert.equal(await page.locator('#variables').textContent(), original);
      const expanded = await page.locator('#array-canvas').boundingBox();
      await page.locator('#inspector-toggle').evaluate(element => element.click());
      assert.equal(await page.locator('#animation-inspector').isVisible(), false);
      assert.equal(await page.locator('#inspector-toggle').getAttribute('aria-expanded'), 'false');
      const collapsed = await page.locator('#array-canvas').boundingBox();
      assert.ok(collapsed.width >= expanded.width + 175);
      const toggle = await page.locator('#inspector-toggle').boundingBox();
      assert.ok(Math.abs(toggle.x + toggle.width - (collapsed.x + collapsed.width)) < 2);
      await page.locator('#next').evaluate(element => element.click());
      assert.equal(await page.locator('#array-canvas').getAttribute('data-step'), '1');
      await page.locator('#inspector-toggle').evaluate(element => element.click());
      assert.equal(await page.locator('#animation-inspector').isVisible(), true);
      assert.equal(await page.locator('#inspector-toggle').getAttribute('aria-expanded'), 'true');
      assert.equal(await page.locator('#array-canvas').getAttribute('data-step'), '1');
      await finishAnimation(page);
      await page.waitForFunction(() => document.getElementById('play').getAttribute('aria-pressed') === 'false');
      await page.locator('#play').evaluate(element => element.click());
      assert.equal(await page.locator('#array-canvas').getAttribute('data-step'), '0');
      assert.equal(await page.locator('#play').getAttribute('aria-label'), '暂停');
      await page.locator('#play').evaluate(element => element.click());
      assert.equal(await page.locator('#play').getAttribute('aria-label'), '播放');
      console.log('Passed ' + lesson.id);
    }
    assert.equal(boot.lessons.length, 28);
    await page.locator('.lesson-link[data-lesson="intro.struct_review"]').click();
    await page.waitForFunction(() => document.getElementById('array-canvas').dataset.demo === 'student_records' &&
      document.getElementById('course-tree').getAttribute('aria-busy') === 'false');
    await page.locator('#play').click();
    await page.locator('#inspector-toggle').click();
    await page.waitForFunction(() => Number(document.getElementById('array-canvas').dataset.step) > 0);
    assert.equal(await page.locator('#play').getAttribute('aria-pressed'), 'true');
    await page.locator('#play').click();
    const paused = await page.locator('#array-canvas').getAttribute('data-step');
    await page.waitForTimeout(1100);
    assert.equal(await page.locator('#array-canvas').getAttribute('data-step'), paused);
    await page.locator('#inspector-toggle').click();
    await seekStep(page, 0);
    for (const [width, height] of [[1480, 960], [1060, 740]]) {
      await app.evaluate(({ BrowserWindow }, size) => BrowserWindow.getAllWindows()[0].setSize(...size), [width, height]);
      for (const collapsed of [false, true]) {
        if ((await page.locator('#inspector-toggle').getAttribute('aria-expanded') === 'false') !== collapsed)
          await page.locator('#inspector-toggle').click();
        await page.waitForTimeout(100);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        const canvas = await page.locator('#array-canvas').boundingBox();
        const controls = await page.locator('.playback-buttons').boundingBox();
        const legend = await page.locator('.canvas-legend').boundingBox();
        assert.ok(Math.abs(controls.x + controls.width / 2 - (canvas.x + canvas.width / 2)) < 2);
        assert.ok(controls.y + controls.height <= legend.y);
        assert.ok(legend.y + legend.height <= canvas.y + canvas.height);
        assert.ok(await page.locator('#concept-scene').evaluate(element => element.clientHeight) >= 50);
        await capture(app, `compact-animation-${width}-${collapsed ? 'collapsed' : 'expanded'}.png`);
      }
    }
    await page.locator('[data-stage="practice"]').click();
    await page.waitForFunction(() => document.getElementById('course-tree').getAttribute('aria-busy') === 'false' &&
      !document.getElementById('practice-page').hidden);
    assert.equal(await page.locator('#inspector-toggle').isVisible(), false);
    assert.equal(await page.evaluate(() => window.ace.edit('code-editor').getValue()), '');
    assert.deepEqual(errors, []);
    if (packaged) assert.equal(await app.evaluate(({ app }) => app.getVersion()), '0.2.2');
    console.log('28 lessons: three bare icons, playback/pause/replay, step navigation, inspector collapse/reopen, expanded/collapsed small-window layouts and blank practice editor passed.');
  } finally {
    if (app) await app.close();
    if (path.dirname(data) !== os.tmpdir() || !path.basename(data).startsWith('dsa-animation-layout-')) throw new Error('Unexpected test data path');
    await fs.rm(data, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
