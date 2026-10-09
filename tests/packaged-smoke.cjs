/* Actual packaged application, with no Python, Node or GCC in PATH. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { _electron } = require(process.env.DSA_PLAYWRIGHT || path.join(os.homedir(),
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root = path.resolve(__dirname, '..');

async function main() {
  const data = await fs.mkdtemp(path.join(os.tmpdir(), 'dsa-packaged-test-'));
  let application;
  try {
    const env = { ...process.env, DSA_TEST: '1', DSA_DATA_DIR: data,
      PATH: path.join(process.env.SystemRoot, 'System32'), DSA_PYTHON: 'missing-python.exe',
      PYTHONHOME: 'Z:/missing-python-home', PYTHONPATH: 'Z:/missing-python-path' };
    delete env.ELECTRON_RUN_AS_NODE; delete env.DSA_TOOLCHAIN;
    application = await _electron.launch({ executablePath: process.env.DSA_PACKAGED_EXE ||
      path.join(root, 'release', 'win-unpacked', 'Start Your DSA.exe'), args: [], cwd: os.tmpdir(), env, timeout: 60000 });
    const page = await application.firstWindow();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const wait = (fn, arg) => page.waitForFunction(fn, arg, { polling: 100, timeout: 30000 });
    try { await wait(() => document.getElementById('connection-label').textContent === '本地判题已连接'); }
    catch (error) {
      console.error('Packaged startup diagnostics:', await page.evaluate(() => ({
        connection: document.getElementById('connection-label')?.textContent,
        toast: document.getElementById('toast')?.textContent,
        ace: typeof window.ace, marked: typeof window.marked, purify: typeof window.DOMPurify,
        scripts: [...document.scripts].map(script => script.src),
      })), errors);
      throw error;
    }
    const packaged = await application.evaluate(({ app }) => ({ packaged: app.isPackaged, resources: process.resourcesPath }));
    assert.equal(packaged.packaged, true);
    const boot = await page.evaluate(() => window.dsa.bootstrap());
    assert.equal(boot.lessons.length, 28); assert.equal(boot.dataDirectory, data);
    let count = 0;
    for (const lesson of boot.lessons) for (const stage of lesson.stages) {
      const loaded = await page.evaluate(params => window.dsa.loadStage(params), { lesson: lesson.id, stage: stage.id, language: 'C++' });
      assert.equal(loaded.lesson, lesson.id);
      if (stage.kind === 'practice') {
        assert.equal(loaded.draft, ''); assert.equal(loaded.problem.caseCount, 3); assert.ok(loaded.reference);
      } else assert.ok(loaded.markdown);
      count++;
    }
    assert.equal(count, 84);
    await page.evaluate(() => document.querySelector('.lesson-link[data-lesson="sorting.bubble_sort"]').click());
    await wait(() => document.querySelector('.lesson-link.active')?.dataset.lesson === 'sorting.bubble_sort' &&
      document.getElementById('course-tree').getAttribute('aria-busy') === 'false');
    await page.evaluate(() => document.querySelector('[data-stage="practice"]').click());
    await wait(() => document.querySelector('.lesson-stage.active')?.dataset.stage === 'practice' &&
      document.getElementById('course-tree').getAttribute('aria-busy') === 'false');
    for (const language of ['C', 'C++']) {
      await page.locator('#language').selectOption(language);
      await wait(language => document.getElementById('course-tree').getAttribute('aria-busy') === 'false' &&
        document.getElementById('filename').textContent.endsWith(language === 'C' ? '.c' : '.cpp'), language);
      await page.evaluate(language => {
        window.testTerminals = [];
        window.testEventStop?.();
        window.testEventStop = window.dsa.onEvent(message => {
          if (message.event === 'terminal') window.testTerminals.push(message.payload);
        });
        let code = document.getElementById('reference-code').textContent;
        if (language === 'C++') code = '#include <iostream>\n' + code;
        window.ace.edit('code-editor').setValue(code, -1);
        document.getElementById('submit').click();
      }, language);
      await wait(() => ['AC', 'WA', 'CE', 'ENV', 'TLE', 'RE'].includes(document.getElementById('judge-status').textContent));
      assert.equal(await page.locator('#judge-status').textContent(), 'AC', await page.locator('#output').textContent());
      const commands = await page.evaluate(() => window.testTerminals.filter(item => item.kind === 'command').map(item => item.text));
      const compile = commands.find(command => /[\\/]g(?:cc|\+\+)\.exe/.test(command));
      const executable = compile?.match(/^\$ (?:"([^"]+)"|(\S+))/);
      assert.ok(executable, commands.join('\n'));
      assert.equal(require('node:fs').realpathSync.native(executable[1] || executable[2]),
        require('node:fs').realpathSync.native(path.join(packaged.resources, 'toolchain', 'bin', language === 'C' ? 'gcc.exe' : 'g++.exe')));
      console.log(`Packaged ${language}: bundled compiler / 3 cases AC; no external development environment.`);
    }
    await page.evaluate(() => {
      document.querySelector('[data-panel="notes"]').click();
      const notes = document.getElementById('notes'); notes.value = 'portable saved note';
      notes.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const closed = page.waitForEvent('close');
    await page.evaluate(() => document.querySelector('[data-window="close"]').click());
    await closed; await application.close(); application = null;
    assert.ok((await fs.stat(path.join(data, 'learning.db'))).size > 0);
    assert.equal(JSON.parse(await fs.readFile(path.join(data, 'settings.json'), 'utf8')).last_stage, 'practice');
    assert.deepEqual(errors, []);
    application = await _electron.launch({ executablePath: process.env.DSA_PACKAGED_EXE ||
      path.join(root, 'release', 'win-unpacked', 'Start Your DSA.exe'), args: [], cwd: os.tmpdir(), env, timeout: 60000 });
    const restored = await application.firstWindow();
    await restored.waitForFunction(() => document.getElementById('course-tree').getAttribute('aria-busy') === 'false' &&
      document.querySelector('.lesson-stage.active')?.dataset.stage === 'practice', null, { polling: 100, timeout: 30000 });
    assert.equal(await restored.locator('#notes').inputValue(), 'portable saved note');
    await restored.locator('#language').selectOption('C++');
    await restored.waitForFunction(() => document.getElementById('filename').textContent.endsWith('.cpp') &&
      document.getElementById('course-tree').getAttribute('aria-busy') === 'false', null, { polling: 100, timeout: 30000 });
    assert.match(await restored.evaluate(() => window.ace.edit('code-editor').getValue()), /^#include <iostream>/);
    const restoredClose = restored.waitForEvent('close');
    await restored.evaluate(() => document.querySelector('[data-window="close"]').click());
    await restoredClose; await application.close(); application = null;
    console.log('Packaged app: all 28 lessons / 84 stages, C and C++, notes, drafts and clean close passed.');
  } finally {
    if (application) await application.close();
    if (path.dirname(data) !== os.tmpdir() || !path.basename(data).startsWith('dsa-packaged-test-')) throw new Error('Unexpected test data path');
    await fs.rm(data, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
