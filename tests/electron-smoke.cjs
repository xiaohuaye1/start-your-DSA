/* 实际启动 Electron，使用隔离的个人数据；不会打开可见窗口。 */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { seekStep, finishAnimation, seekPhase } = require('./animation-actions.cjs');

async function screenshot(application, root, filename) {
  // A first capture wakes the hidden page's compositor; the second gets its updated frame.
  const data = await application.evaluate(async ({ BrowserWindow }) => {
    const contents = BrowserWindow.getAllWindows()[0].webContents;
    await contents.capturePage({}, { stayHidden: false, stayAwake: true });
    await new Promise(resolve => setTimeout(resolve, 150));
    return (await contents.capturePage({}, { stayHidden: false, stayAwake: true })).toDataURL();
  });
  await fs.writeFile(path.join(root, 'test-results', filename), Buffer.from(data.split(',')[1], 'base64'));
}

async function main() {
  const playwrightPath = process.env.DSA_PLAYWRIGHT || path.join(os.homedir(),
    '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
  const { _electron } = require(playwrightPath);
  const root = path.resolve(__dirname, '..');
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dsa-electron-test-'));
  const errors = [];
  let application;
  try {
    const env = { ...process.env, DSA_TEST: '1', DSA_DATA_DIR: dataDir };
    delete env.ELECTRON_RUN_AS_NODE;
    application = await _electron.launch({ executablePath: path.join(root, 'node_modules/electron/dist/electron.exe'),
      args: [root], cwd: root, env, timeout: 30000 });
    const page = await application.firstWindow();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.locator('#connection-label').filter({ hasText: '本地判题已连接' }).waitFor();
    await page.waitForFunction(() => document.getElementById('array-canvas').dataset.demo === 'linear_sum');
    await page.locator('.lesson-link[data-lesson="sorting.bubble_sort"]').click();
    await page.waitForFunction(() => document.getElementById('lesson-title').textContent === '冒泡排序');
    await page.locator('.array-cell').first().waitFor();
    assert.equal(await page.locator('.array-cell').count(), 8);
    assert.equal(await page.locator('#course-tree .lesson-stage').count(), 3);
    assert.equal(await page.locator('[data-stage="extension"]').count(), 0);
    const typography = await page.evaluate(() => ({
      body: getComputedStyle(document.body).fontSize,
      heading: getComputedStyle(document.getElementById('lesson-title')).fontSize,
      background: getComputedStyle(document.querySelector('.workspace')).backgroundColor,
    }));
    assert.deepEqual(typography, { body: '13px', heading: '18px', background: 'rgb(27, 27, 27)' });
    await page.locator('#next').click();
    assert.equal(await page.locator('#compare-count').innerText(), '1');
    assert.equal(await page.locator('#swap-count').innerText(), '0');
    await fs.mkdir(path.join(root, 'test-results'), { recursive: true });
    await screenshot(application, root, 'graphite-animation.png');
    await seekStep(page, 0);
    await page.locator('#next').click(); await page.locator('#next').click();
    await page.waitForFunction(() => document.getElementById('action-title').textContent === '交换元素');
    await page.waitForTimeout(450);
    assert.deepEqual(await page.locator('.array-cell').evaluateAll(cells => cells.map(cell => Number(cell.dataset.value))), [2,5,8,1,6,3,7,4]);
    assert.equal(await page.locator('#compare-count').innerText(), '1');
    assert.equal(await page.locator('#swap-count').innerText(), '1');
    await fs.mkdir(path.join(root, 'test-results'), { recursive: true });
    await screenshot(application, root, 'javascript-animation.png');
    await page.locator('#previous').click();
    assert.deepEqual(await page.locator('.array-cell').evaluateAll(cells => cells.map(cell => Number(cell.dataset.value))), [5,2,8,1,6,3,7,4]);
    assert.equal(await page.locator('#swap-count').innerText(), '0');
    await page.locator('.operation-row[data-step="2"]').click();
    assert.equal(await page.locator('#swap-count').innerText(), '1');
    await seekPhase(page, '第 2 轮 · 比较相邻元素');
    assert.equal(await page.locator('.variable-row').first().locator('b').innerText(), '1');
    assert.ok(Number(await page.locator('#compare-count').innerText()) > 1);
    await seekStep(page, 0);
    assert.equal(await page.locator('#compare-count').innerText(), '0');
    assert.equal(await page.locator('#swap-count').innerText(), '0');
    await page.locator('#play').click();
    await page.waitForFunction(() => Number(document.getElementById('array-canvas').dataset.step) > 0);
    await page.locator('#play').click();
    assert.equal(await page.locator('#play').getAttribute('aria-label'), '播放');
    await page.locator('[data-aux="state"]').click();
    assert.equal(await page.locator('#aux-state .array-state-column').count(), 8);
    await page.locator('[data-aux="explanation"]').click();
    await page.locator('#aux-explanation').waitFor({ state: 'visible' });
    await page.locator('[data-aux="details"]').click();
    await page.locator('#course-search').fill('二分');
    assert.equal(await page.locator('.lesson-link').count(), 1);
    assert.equal(await page.locator('.lesson-link').isDisabled(), false);
    await page.locator('#course-search').fill('哈希');
    assert.equal(await page.locator('.lesson-link').count(), 1);
    assert.equal(await page.locator('.lesson-link').isDisabled(), false);
    await page.locator('#course-search').fill('');
    await seekStep(page, 0);
    assert.equal(await page.locator('.array-cell').count(), 8);
    await finishAnimation(page);
    await page.waitForFunction(() => document.getElementById('progress-count').textContent === '1 / 84');
    await page.locator('[data-panel="notes"]').click();
    await page.locator('#notes').fill('JavaScript 界面测试笔记');
    await page.locator('#note-state').filter({ hasText: '已自动保存' }).waitFor();
    await page.locator('[data-panel="courses"]').click();
    await page.locator('[data-stage="practice"]').click();
    await page.locator('#practice-page').waitFor({ state: 'visible' });
    await page.evaluate(async () => {
      const stage = await window.dsa.loadStage({ lesson: 'sorting.bubble_sort', stage: 'practice', language: 'C' });
      window.ace.edit('code-editor').setValue(stage.reference, -1);
    });
    await page.locator('#submit').click();
    await page.locator('#judge-status').filter({ hasText: /^AC$/ }).waitFor({ timeout: 20000 });
    await page.waitForFunction(() => document.getElementById('progress-count').textContent === '2 / 84');
    assert.equal(await page.locator('.case-item').count(), 3);
    await screenshot(application, root, 'javascript-practice.png');
    await page.locator('#language').selectOption('C++');
    await page.waitForFunction(() => document.getElementById('filename').textContent.endsWith('.cpp'));
    await page.evaluate(() => window.ace.edit('code-editor').setValue('// 独立 CPP 草稿', -1));
    await page.locator('#language').selectOption('C');
    await page.waitForFunction(() => document.getElementById('filename').textContent.endsWith('.c'));
    assert.match(await page.evaluate(() => window.ace.edit('code-editor').getValue()), /void bubble_sort/);
    await page.locator('#custom-open').click(); await page.locator('#custom-input').fill('3\n3 1 2\n');
    await page.locator('#custom-run').click();
    await page.locator('#judge-status').filter({ hasText: /^RUN$/ }).waitFor({ timeout: 20000 });
    assert.match(await page.locator('#output').innerText(), /1 2 3/);
    await page.locator('[data-stage="exam"]').click();
    await page.waitForFunction(() => document.getElementById('filename').textContent === 'p1177.c');
    assert.match(await page.locator('#statement').innerText(), /洛谷 P1177/);
    assert.equal(await page.locator('#problem-source').isVisible(), true);
    const reference = await page.evaluate(async () => (await window.dsa.loadStage({
      lesson: 'sorting.bubble_sort', stage: 'exam', language: 'C',
    })).reference);
    await page.evaluate(code => window.ace.edit('code-editor').setValue(code, -1), '#warning RAW_WARNING\n' + reference);
    await page.locator('#run').click();
    await page.waitForFunction(() => document.getElementById('judge-status').textContent === 'AC' &&
      document.getElementById('output').textContent.includes('1 2 3 6 6 9'));
    let terminal = await page.locator('#output').innerText();
    assert.match(terminal, /gcc[\s\S]*-std=c11/);
    assert.match(terminal, /warning:[\s\S]*RAW_WARNING/);
    assert.doesNotMatch(terminal, /[\u4e00-\u9fff]/, '终端不能添加中文编译/判题提示');
    assert.equal(await page.locator('#progress-count').innerText(), '2 / 84', '样例通过不能完成真题环节');
    await screenshot(application, root, 'luogu-exam-terminal.png');
    await page.evaluate(() => window.ace.edit('code-editor').setValue('int main( { return 0; }', -1));
    await page.locator('#run').click();
    await page.locator('#judge-status').filter({ hasText: /^CE$/ }).waitFor();
    terminal = await page.locator('#output').innerText();
    assert.match(terminal, /error:/);
    assert.doesNotMatch(terminal, /[\u4e00-\u9fff]/);
    await page.evaluate(() => window.ace.edit('code-editor').setValue(
      '#include <stdio.h>\nint main(void){puts("用户原始输出");fputs("user stderr\\n", stderr);return 1;}', -1));
    await page.locator('#custom-open').click(); await page.locator('#custom-input').fill('');
    await page.locator('#custom-run').click();
    await page.locator('#judge-status').filter({ hasText: /^RE$/ }).waitFor();
    terminal = await page.locator('#output').innerText();
    assert.match(terminal, /用户原始输出/);
    assert.match(terminal, /user stderr/);
    assert.doesNotMatch(terminal.replaceAll('用户原始输出', ''), /[\u4e00-\u9fff]/);
    await page.evaluate(code => window.ace.edit('code-editor').setValue(code, -1), reference);
    await page.locator('#submit').click();
    await page.waitForFunction(() => document.getElementById('progress-count').textContent === '3 / 84');
    assert.equal(await page.locator('#judge-status').innerText(), 'AC');
    assert.equal(await page.locator('.case-item').count(), 3);
    assert.doesNotMatch(await page.locator('#output').innerText(), /[\u4e00-\u9fff]/);
    await page.locator('#settings-open').click(); await page.locator('#settings-dialog').waitFor({ state: 'visible' });
    await page.locator('#gcc-path').fill(''); await page.locator('#settings-save').click();
    await page.locator('[data-stage="animation"]').click();
    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1060, 740));
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false, '最小窗口不能出现整体横向溢出');
    const overlapping = await page.evaluate(() => {
      const index = document.querySelector('.array-index').getBoundingClientRect();
      const message = document.getElementById('canvas-message').getBoundingClientRect();
      return message.top < index.bottom && message.bottom > index.top;
    });
    assert.equal(overlapping, false, '最小窗口中的数组下标和讲解不能重叠');
    await screenshot(application, root, 'javascript-small.png');
    const withinWindow = await page.evaluate(() => {
      const pane = document.querySelector('.inspector').getBoundingClientRect();
      const footer = document.querySelector('.statusbar').getBoundingClientRect();
      return pane.right <= window.innerWidth && footer.bottom <= window.innerHeight;
    });
    assert.equal(withinWindow, true, '运行状态与底栏不能超出最小窗口');
    assert.equal(await page.locator('#array-input, #generate').count(), 0);
    await page.locator('[data-stage="practice"]').click();
    await page.locator('#practice-page').waitFor({ state: 'visible' });
    const editorBox = await page.locator('#code-editor').boundingBox();
    assert.ok(editorBox.width >= 280 && editorBox.height > 150, '最小窗口仍应能编写代码');
    await screenshot(application, root, 'graphite-practice-small.png');
    assert.deepEqual(errors, [], '浏览器脚本或资源加载错误');
    await page.locator('[data-window="close"]').click();
    await page.waitForEvent('close');
    application = null;
    console.log('Electron 实际界面测试通过：三个环节、洛谷 P1177、原始终端输出、警告/编译错误/stdout/stderr、3 个轻量真题用例、动画、草稿和笔记。');
  } finally {
    if (application) await application.close();
    await fs.rm(dataDir, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
