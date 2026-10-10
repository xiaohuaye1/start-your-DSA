/* All twelve workshops in a real source/packaged window, isolated user data. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { _electron } = require(process.env.DSA_PLAYWRIGHT || path.join(os.homedir(),
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const lessons = ['intro.struct_review', 'linear.arrays', 'linear.linked_list', 'linear.circular_list',
  'linear.doubly_list', 'linear.stack', 'linear.queue', 'linear.circular_queue', 'trees.binary_tree',
  'graphs.basics', 'graphs.traversal', 'comprehensive.training'];
const root = path.resolve(__dirname, '..');

async function main() {
  const data = await fs.mkdtemp(path.join(os.tmpdir(), 'dsa-workshop-window-'));
  let app;
  try {
    const packaged = !!process.env.DSA_PACKAGED_EXE;
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
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const wait = (fn, arg) => page.waitForFunction(fn, arg, { polling: 50, timeout: 30000 });
    await wait(() => document.getElementById('connection-label')?.textContent === '本地判题已连接');
    for (const lesson of lessons) {
      await page.locator(`.lesson-link[data-lesson="${lesson}"]`).click();
      await wait(lesson => document.querySelector(`.lesson-link[data-lesson="${lesson}"]`)?.classList.contains('active'), lesson);
      await page.locator('[data-stage="practice"]').click();
      await wait(() => document.getElementById('statement')?.textContent.includes('新题独立保存进度和草稿'));
      const loaded = await page.evaluate(lesson => window.dsa.loadStage({ lesson, stage: 'practice', language: 'C' }), lesson);
      assert.equal(loaded.problem.id, lesson + '.practice.workshop_v2');
      assert.equal(loaded.problem.caseCount, 3); assert.equal(loaded.draft, '');
      assert.ok(loaded.problem.statement.includes('分步提示'));
      assert.equal(await page.evaluate(() => window.ace.edit('code-editor').getValue()), '');
      for (const language of ['C', 'C++']) {
        const result = await page.evaluate(async ({ lesson, language, code }) => {
          const params = { lesson, stage: 'practice', language };
          const events = [];
          let unsubscribe;
          const finished = new Promise(resolve => {
            unsubscribe = window.dsa.onEvent(event => {
              events.push(event);
              if (event.event === 'finished') resolve(event.payload);
            });
          });
          try {
            await window.dsa.judge({ ...params, code, mode: 'submit' });
            return { result: await finished, events };
          } finally { unsubscribe(); }
        }, { lesson, language, code: loaded.reference });
        assert.equal(result.result.verdict, 'AC', JSON.stringify(result));
        assert.equal(result.result.cases.length, 3);
      }
      console.log(`${packaged ? 'ZIP package' : 'Source'} ${lesson}: blank editor, full statement, C/C++ and 3 cases AC.`);
    }
    const boot = await page.evaluate(() => window.dsa.bootstrap());
    assert.equal(boot.lessons.length, 28);
    assert.equal(boot.completed.filter(([, stage]) => stage === 'practice').length, 12);
    assert.deepEqual(errors, []);
    console.log('All upgraded workshops work in the real window; no personal data touched.');
  } finally {
    if (app) await app.close();
    if (path.dirname(data) !== os.tmpdir() || !path.basename(data).startsWith('dsa-workshop-window-'))
      throw new Error('Unexpected test data directory');
    await fs.rm(data, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
