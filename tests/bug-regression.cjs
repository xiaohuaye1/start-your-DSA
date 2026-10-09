/* Regression for rapid navigation, bridge validation and judge preparation failure.
 * Faults and artificial latency are test-only; all learning data is temporary. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { _electron } = require(process.env.DSA_PLAYWRIGHT || path.join(os.homedir(),
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root = path.resolve(__dirname, '..');
const audit = process.argv.includes('--audit');

async function main() {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'dsa-bugs-test-'));
  let app;
  const findings = [];
  const check = (name, passed, details) => {
    findings.push({ name, passed, details });
    console.log(JSON.stringify(findings.at(-1)));
  };
  try {
    const env = { ...process.env, DSA_TEST: '1', DSA_DATA_DIR: directory };
    delete env.ELECTRON_RUN_AS_NODE;
    app = await _electron.launch({ executablePath: path.join(root, 'node_modules/electron/dist/electron.exe'),
      args: [root], cwd: root, env, timeout: 30000 });
    const page = await app.firstWindow();
    page.setDefaultTimeout(15000);
    const wait = (fn, arg) => page.waitForFunction(fn, arg, { polling: 50, timeout: 15000 });
    await wait(() => document.querySelector('.lesson-stage.active'));
    // Wrap the real backend's public request method, only in this test process.
    await app.evaluate(({ }, root) => {
      const { Backend } = process.mainModule.require(root + '/desktop/backend.cjs');
      const request = Backend.prototype.request;
      globalThis.dsaFaults = { delay: 0, saveDelay: 0, failSave: false, failLoad: false, failJudge: false, requests: [] };
      Backend.prototype.request = async function(method, params) {
        globalThis.dsaFaults.requests.push({ method, params });
        if (method === 'load_stage' && globalThis.dsaFaults.delay)
          await new Promise(resolve => setTimeout(resolve, globalThis.dsaFaults.delay));
        if (method === 'save_draft' && globalThis.dsaFaults.saveDelay)
          await new Promise(resolve => setTimeout(resolve, globalThis.dsaFaults.saveDelay));
        const fault = method === 'save_draft' ? 'failSave' : method === 'load_stage' ? 'failLoad' : method === 'judge' ? 'failJudge' : null;
        if (fault && globalThis.dsaFaults[fault]) {
          globalThis.dsaFaults[fault] = false;
          throw new Error('test: ' + fault);
        }
        return request.call(this, method, params);
      };
    }, root);
    const invalid = await page.evaluate(async () => {
      const failures = [];
      for (const params of [{ lesson: 'nope', stage: 'animation' },
        { lesson: 'sorting.bubble_sort', stage: 'nope' }, {}]) {
        try { await window.dsa.loadStage(params); failures.push('accepted'); }
        catch (error) { failures.push(error.message); }
      }
      const speed = [];
      for (const value of [null, 'abc', true, 24, 201, 100.5]) {
        try { const settings = await window.dsa.saveSettings({ speed: value }); speed.push(settings.speed); }
        catch (error) { speed.push(error.message); }
      }
      await window.dsa.saveSettings({ speed: 100 });
      return { failures, speed };
    });
    check('2: unknown lesson/stage errors', invalid.failures.every(value => /课程不存在|课程环节不存在/.test(value)), invalid.failures);
    check('3: speed validation', invalid.speed.every(value => typeof value === 'string' && value.includes('播放速度')), invalid.speed);
    await page.evaluate(() => document.querySelector('.lesson-link[data-lesson="sorting.bubble_sort"]').click());
    await wait(() => document.querySelector('.lesson-link.active')?.dataset.lesson === 'sorting.bubble_sort' &&
      document.getElementById('course-tree').getAttribute('aria-busy') === 'false');
    await page.evaluate(() => document.querySelector('[data-stage="practice"]').click());
    await wait(() => !document.getElementById('practice-page').hidden &&
      document.getElementById('course-tree').getAttribute('aria-busy') === 'false');
    await app.evaluate(() => { globalThis.dsaFaults.delay = 250; });
    await page.evaluate(() => {
      const select = document.getElementById('language'); select.value = 'C++';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await wait(() => document.getElementById('course-tree').getAttribute('aria-busy') === 'true');
    await page.evaluate(() => {
      const parent = document.querySelector('.lesson-link[data-lesson="linear.arrays"]');
      if (!parent.classList.contains('active') || parent.getAttribute('aria-expanded') !== 'true') parent.click();
    });
    await wait(() => document.getElementById('course-tree').getAttribute('aria-busy') === 'false');
    const rapid = await page.evaluate(() => ({ lesson: document.querySelector('.lesson-link.active').dataset.lesson,
      language: document.getElementById('language').value, filename: document.getElementById('filename').textContent }));
    check('1a: switch language then immediately change lesson', rapid.lesson === 'linear.arrays' && rapid.language === 'C++', rapid);
    // Finish at C++ practice and check a rapid second language change, including isolated drafts.
    await page.evaluate(() => {
      const parent = document.querySelector('.lesson-link[data-lesson="linear.arrays"]');
      if (!parent.classList.contains('active') || parent.getAttribute('aria-expanded') !== 'true') parent.click();
    });
    await wait(() => document.querySelector('.lesson-link.active')?.dataset.lesson === 'linear.arrays' &&
      document.getElementById('course-tree').getAttribute('aria-busy') === 'false');
    await page.evaluate(() => document.querySelector('[data-stage="practice"]').click());
    await wait(() => document.querySelector('.lesson-stage.active')?.dataset.stage === 'practice' &&
      document.getElementById('course-tree').getAttribute('aria-busy') === 'false');
    await page.evaluate(() => {
      const select = document.getElementById('language'); select.value = 'C';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await wait(() => document.getElementById('course-tree').getAttribute('aria-busy') === 'true');
    await page.evaluate(() => {
      const select = document.getElementById('language'); select.value = 'C++';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await wait(() => document.getElementById('course-tree').getAttribute('aria-busy') === 'false');
    const second = await page.evaluate(() => ({ language: document.getElementById('language').value,
      filename: document.getElementById('filename').textContent }));
    check('1b: rapid C then C++ selection', second.language === 'C++' && second.filename.endsWith('.cpp'), second);
    await app.evaluate(() => { globalThis.dsaFaults.delay = 0; });
    await page.evaluate(() => {
      const tree = document.getElementById('course-tree');
      const original = tree.replaceChildren;
      tree.replaceChildren = function(...args) {
        tree.replaceChildren = original;
        throw new Error('test: judge preparation failed');
      };
      document.getElementById('run').click();
    });
    await wait(() => document.getElementById('toast').textContent.includes('test: judge preparation failed'));
    const preparation = await page.evaluate(() => ({ runDisabled: document.getElementById('run').disabled,
      languageDisabled: document.getElementById('language').disabled, readOnly: window.ace.edit('code-editor').getReadOnly() }));
    check('4: UI unlocked after preparation error', !preparation.runDisabled && !preparation.languageDisabled && !preparation.readOnly, preparation);
    if (!audit) {
      for (const finding of findings) assert.equal(finding.passed, true, finding.name + ': ' + JSON.stringify(finding.details));
      // Failed loads restore the committed language, extension and existing draft.
      await page.evaluate(() => window.ace.edit('code-editor').setValue('// personal C++ draft', -1));
      await app.evaluate(() => { globalThis.dsaFaults.failLoad = true; });
      await page.evaluate(() => {
        const select = document.getElementById('language'); select.value = 'C';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await wait(() => document.getElementById('course-tree').getAttribute('aria-busy') === 'false' &&
        document.getElementById('toast').textContent.includes('test: failLoad'));
      assert.equal(await page.locator('#language').inputValue(), 'C++');
      assert.match(await page.locator('#filename').textContent(), /\.cpp$/);
      assert.equal(await page.evaluate(() => window.ace.edit('code-editor').getValue()), '// personal C++ draft');
      // Preparation failures after an await also release the lock, and can be retried.
      for (const fault of ['failSave', 'failJudge']) {
        await app.evaluate(({}, fault) => { globalThis.dsaFaults[fault] = true; }, fault);
        await page.evaluate(fault => {
          window.ace.edit('code-editor').setValue('// test ' + fault, -1);
          document.getElementById('run').click();
        }, fault);
        await wait(fault => document.getElementById('toast').textContent.includes('test: ' + fault), fault);
        assert.equal(await page.locator('#run').isDisabled(), false);
        assert.equal(await page.locator('#language').isDisabled(), false);
        assert.equal(await page.evaluate(() => window.ace.edit('code-editor').getReadOnly()), false);
      }
      console.log('Failed load, draft save and judge request recover without changing personal drafts.');
      // Verify the actual compiler receives C++ and can compile C++-only syntax after the race.
      await app.evaluate(() => { globalThis.dsaFaults.saveDelay = 250; });
      await page.evaluate(() => {
        window.ace.edit('code-editor').setValue('#include <iostream>\nint main(){int n,k,v;std::cin>>n>>k>>v;for(int i=0,x;i<n;++i){std::cin>>x;std::cout<<(i==k?v:x)<<" ";}}', -1);
        document.getElementById('submit').click();
      });
      await wait(() => document.getElementById('run').disabled && document.getElementById('language').disabled);
      await page.evaluate(() => {
        const select = document.getElementById('language'); select.value = 'C';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        document.querySelector('.lesson-link[data-lesson="sorting.bubble_sort"]').click();
        document.getElementById('submit').click();
      });
      await wait(() => document.getElementById('judge-status').textContent === 'AC');
      const job = await app.evaluate(() => globalThis.dsaFaults.requests.filter(item => item.method === 'judge').at(-1));
      assert.equal(job.params.language, 'C++'); assert.equal(job.params.lesson, 'linear.arrays');
      const source = await page.evaluate(() => ({ language: document.getElementById('language').value,
        filename: document.getElementById('filename').textContent }));
      assert.equal(source.language, 'C++'); assert.ok(source.filename.endsWith('.cpp'));
      assert.equal(await app.evaluate(() => globalThis.dsaFaults.requests.filter(item => item.method === 'judge').length), 2,
        'Only the injected failed request and one successful submission should be sent');
      console.log('C++ compiler, latest lesson and actual AC verified.');
    }
  } finally {
    if (app) await app.close();
    if (path.dirname(directory) !== os.tmpdir() || !path.basename(directory).startsWith('dsa-bugs-test-'))
      throw new Error('Unexpected test directory');
    await fs.rm(directory, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
