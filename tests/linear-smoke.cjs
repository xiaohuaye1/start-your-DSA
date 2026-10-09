/* Real Electron checks for the next five lessons, with isolated personal data. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const lessons = [
  ['linear.linked_list', '链表', 'singly_links', 'B3631'],
  ['linear.circular_list', '循环链表', 'circular_links', 'P1996'],
  ['linear.doubly_list', '双向链表', 'doubly_links', 'P1160'],
  ['linear.stack', '栈', 'stack_operations', 'P1739'],
  ['linear.queue', '队列', 'queue_operations', 'P1540'],
];

async function capture(app, root, name) {
  const data = await app.evaluate(async ({ BrowserWindow }) => {
    const web = BrowserWindow.getAllWindows()[0].webContents;
    await web.capturePage({}, { stayHidden: false, stayAwake: true });
    await new Promise(resolve => setTimeout(resolve, 150));
    return (await web.capturePage({}, { stayHidden: false, stayAwake: true })).toDataURL();
  });
  await fs.writeFile(path.join(root, 'test-results', name), Buffer.from(data.split(',')[1], 'base64'));
}

async function main() {
  const { _electron } = require(process.env.DSA_PLAYWRIGHT || path.join(os.homedir(),
    '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
  const root = path.resolve(__dirname, '..');
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dsa-learning-test-'));
  const errors = [];
  let app, page;
  try {
    const env = { ...process.env, DSA_TEST: '1', DSA_DATA_DIR: dataDir };
    delete env.ELECTRON_RUN_AS_NODE;
    app = await _electron.launch({ executablePath: path.join(root, 'node_modules/electron/dist/electron.exe'),
      args: [root], cwd: root, env, timeout: 30000 });
    page = await app.firstWindow();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.locator('#connection-label').filter({ hasText: '本地判题已连接' }).waitFor();
    await page.waitForFunction(() => document.getElementById('array-canvas').dataset.demo === 'linear_sum');
    assert.equal(await page.locator('.lesson-link').count(), 28);
    assert.equal(await page.locator('.lesson-link:not([disabled])').count(), 28);
    assert.equal(await page.locator('#progress-count').innerText(), '0 / 84');
    await fs.mkdir(path.join(root, 'test-results'), { recursive: true });
    for (let index = 0; index < lessons.length; ++index) {
      const [lesson, title, source, problem] = lessons[index];
      await page.locator(`.lesson-link[data-lesson="${lesson}"]`).click();
      await page.waitForFunction(source => document.getElementById('array-canvas').dataset.demo === source, source);
      assert.equal(await page.locator('#lesson-title').innerText(), title);
      assert.equal(await page.locator('#course-tree .lesson-stage').count(), 3);
      assert.ok(await page.locator('.scene-code-line').count() >= 4);
      const initial = await page.locator('#variables').innerText();
      await page.locator('#next').click();
      assert.notEqual(await page.locator('#variables').innerText(), initial);
      await page.locator('#previous').click();
      assert.equal(await page.locator('#variables').innerText(), initial);
      await page.locator('#next').click();
      await capture(app, root, `lesson-${source}.png`);
      await page.locator('#timeline').evaluate(element => { element.value = element.max; element.dispatchEvent(new Event('input')); });
      await page.waitForFunction(expected => document.getElementById('progress-count').textContent === expected, `${index * 3 + 1} / 84`);
      await page.locator('[data-panel="mindmap"]').click();
      assert.match(await page.locator('#knowledge-tree').innerText(), new RegExp(title));
      if (source !== 'linear_sum') assert.doesNotMatch(await page.locator('#knowledge-tree').innerText(), /一般 \/ 最坏 O\(n²\)/);
      await page.locator('[data-panel="notes"]').click();
      await page.locator('#notes').fill(`独立笔记：${title}`);
      await page.locator('#note-state').filter({ hasText: '已自动保存' }).waitFor();
      await page.locator('[data-panel="courses"]').click();
      for (const stage of ['practice', 'exam']) {
        await page.locator(`[data-stage="${stage}"]`).click();
        const filename = stage === 'exam' ? problem.toLowerCase() : lesson.split('.').at(-1);
        await page.waitForFunction(filename => document.getElementById('filename').textContent === filename + '.c', filename);
        const data = await page.evaluate(params => window.dsa.loadStage(params), { lesson, stage, language: 'C' });
        assert.equal(data.note, `独立笔记：${title}`);
        assert.equal(data.problem.caseCount, 3);
        if (stage === 'exam') {
          assert.equal(await page.locator('#problem-source').isVisible(), true);
          assert.equal(data.problem.source.id, problem);
        }
        await page.evaluate(code => window.ace.edit('code-editor').setValue(code, -1), data.reference);
        await page.locator('#run').click();
        await page.locator('#judge-status').filter({ hasText: /^AC$/ }).waitFor({ timeout: 20000 });
        const beforeSubmit = index * 3 + (stage === 'practice' ? 1 : 2);
        assert.equal(await page.locator('#progress-count').innerText(), `${beforeSubmit} / 84`);
        await page.locator('#submit').click();
        await page.waitForFunction(expected => document.getElementById('progress-count').textContent === expected, `${beforeSubmit + 1} / 84`);
        assert.equal(await page.locator('.case-item').count(), 3);
        if (stage === 'exam') assert.doesNotMatch(await page.locator('#output').innerText(), /[\u4e00-\u9fff]/);
      }
      console.log(`${title}: animation + practice + ${problem}, 3 lightweight cases, OK`);
    }
    // Drafts remain associated with the right lesson when switching away and back.
    await page.locator('.lesson-link[data-lesson="linear.linked_list"]').click();
    await page.waitForFunction(() => document.getElementById('array-canvas').dataset.demo === 'singly_links');
    await page.locator('[data-stage="practice"]').click();
    await page.waitForFunction(() => document.getElementById('filename').textContent === 'linked_list.c');
    assert.match(await page.evaluate(() => window.ace.edit('code-editor').getValue()), /void insert_after/);
    await page.locator('[data-stage="animation"]').click();
    await page.locator('#animation-page').waitFor({ state: 'visible' });
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1060, 740));
    await page.locator('#array-input').fill('1, 2, 3, 4, 5, 6, 7, 8');
    await page.locator('#generate').click();
    assert.equal(await page.locator('.array-cell').count(), 8);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.ok(await page.locator('#concept-scene').evaluate(element => element.clientHeight) >= 50);
    await capture(app, root, 'linear-small.png');
    await page.locator('#array-input').fill('1,2,3,4,5,6,7,8,9'); await page.locator('#generate').click();
    await page.locator('#toast').filter({ hasText: '1～8' }).waitFor();
    assert.equal(await page.locator('.array-cell').count(), 8);
    assert.deepEqual(errors, []);
    console.log('第6～10节实际界面全部通过：播放快照、回退、独立笔记与草稿、原题入口、84环节进度、小窗口、原始输出。');
  } catch (error) {
    if (page) console.error(await page.evaluate(() => ({ title: document.getElementById('lesson-title').textContent,
      filename: document.getElementById('filename').textContent, status: document.getElementById('judge-status').textContent,
      toast: document.getElementById('toast').textContent })));
    throw error;
  } finally {
    if (app) await app.close();
    const resolved = path.resolve(dataDir);
    if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('dsa-learning-test-'))
      throw new Error('Unexpected test data directory');
    await fs.rm(resolved, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
