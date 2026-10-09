/* All 28 lessons / 84 stages use the actual renderer and backend with isolated data. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { _electron } = require(process.env.DSA_PLAYWRIGHT || path.join(os.homedir(),
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root = path.resolve(__dirname, '..');

async function main() {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dsa-navigation-test-'));
  let application, page;
  const errors = [];
  const wait = (fn, arg) => page.waitForFunction(fn, arg, { polling: 100, timeout: 15000 });
  const parent = id => page.locator(`.lesson-link[data-lesson="${id}"]`);
  const child = id => page.locator(`.lesson-stage[data-stage="${id}"]`);
  const click = locator => locator.evaluate(element => element.click());
  async function selectLesson(id) {
    if (!await parent(id).evaluate(element => element.classList.contains('active')))
      await click(parent(id));
    await wait(id => document.getElementById('course-tree').getAttribute('aria-busy') !== 'true' &&
      document.querySelector('.lesson-link.active')?.dataset.lesson === id, id);
    if (await parent(id).getAttribute('aria-expanded') !== 'true') await click(parent(id));
    await wait(id => document.querySelector('.lesson-stage')?.dataset.lesson === id, id);
  }
  async function selectStage(id) {
    await click(child(id));
    await wait(id => document.getElementById('course-tree').getAttribute('aria-busy') !== 'true' &&
      document.querySelector('.lesson-stage.active')?.dataset.stage === id, id);
  }
  async function screenshot(name) {
    const data = await application.evaluate(async ({ BrowserWindow }) => {
      const contents = BrowserWindow.getAllWindows()[0].webContents;
      await contents.capturePage({}, { stayHidden: false, stayAwake: true });
      await new Promise(resolve => setTimeout(resolve, 150));
      return (await contents.capturePage({}, { stayHidden: false, stayAwake: true })).toDataURL();
    });
    await fs.mkdir(path.join(root, 'test-results'), { recursive: true });
    await fs.writeFile(path.join(root, 'test-results', name), Buffer.from(data.split(',')[1], 'base64'));
  }
  async function launch() {
    const env = { ...process.env, DSA_TEST: '1', DSA_DATA_DIR: dataDir };
    delete env.ELECTRON_RUN_AS_NODE;
    application = await _electron.launch({ executablePath: path.join(root, 'node_modules/electron/dist/electron.exe'),
      args: [root], cwd: root, env, timeout: 30000 });
    page = await application.firstWindow();
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await wait(() => document.querySelectorAll('.lesson-stage').length === 3);
  }
  async function close() {
    const closed = page.waitForEvent('close');
    await click(page.locator('[data-window="close"]'));
    await closed; await application.close(); application = null;
  }
  try {
    await launch();
    const boot = await page.evaluate(() => window.dsa.bootstrap());
    assert.equal(boot.lessons.length, 28);
    assert.equal(await page.locator('.workspace #stage-tabs, .workspace .learning-stages').count(), 0);
    assert.equal(await page.locator('.lesson-link').count(), 28);
    assert.equal(await page.locator('[data-panel="ai"], #panel-ai, #ai-question, #copy-question').count(), 0);
    assert.equal(await page.locator('.activity-rail button').count(), 3);
    let count = 0;
    for (const lesson of boot.lessons) {
      await selectLesson(lesson.id);
      assert.equal(await page.locator('.lesson-link[aria-expanded="true"]').count(), 1);
      assert.equal(await page.locator('.lesson-stage').count(), 3);
      assert.deepEqual(await page.locator('.lesson-stage').evaluateAll(nodes => nodes.map(node => node.dataset.stage)),
        lesson.stages.map(stage => stage.id));
      for (const stage of lesson.stages) {
        await selectStage(stage.id);
        assert.equal(await page.locator('#lesson-title').innerText(), lesson.title);
        assert.equal(await child(stage.id).getAttribute('aria-current'), 'page');
        assert.equal(await child(stage.id).evaluate(element => element.closest('.lesson-node').querySelector('.lesson-link').dataset.lesson), lesson.id);
        assert.equal(await page.locator('.lesson-stage.active').count(), 1);
        assert.equal(await page.locator('#animation-page').isVisible(), stage.kind === 'animation');
        assert.equal(await page.locator('#practice-page').isVisible(), stage.kind === 'practice');
        if (stage.kind === 'practice') {
          assert.equal(await page.evaluate(() => window.ace.edit('code-editor').getValue()), '', `${lesson.id}/${stage.id} starts blank`);
          await page.locator('#language').selectOption('C++');
          await wait(() => document.getElementById('course-tree').getAttribute('aria-busy') !== 'true' &&
            document.getElementById('filename').textContent.endsWith('.cpp'));
          assert.equal(await page.evaluate(() => window.ace.edit('code-editor').getValue()), '', `${lesson.id}/${stage.id} C++ starts blank`);
          await page.locator('#language').selectOption('C');
          await wait(() => document.getElementById('course-tree').getAttribute('aria-busy') !== 'true' &&
            document.getElementById('filename').textContent.endsWith('.c'));
        }
        assert.ok((await page.locator('#breadcrumb').textContent()).includes(stage.title));
        count++;
      }
    }
    assert.equal(count, 84);
    console.log('All 28 lessons / 84 stage routes passed');
    await selectLesson('sorting.bubble_sort');
    await selectStage('animation');
    const initialValues = await page.locator('.array-cell').evaluateAll(cells => cells.map(cell => cell.dataset.value));
    await click(parent('sorting.bubble_sort'));
    assert.equal(await page.locator('.lesson-stage').count(), 0);
    assert.equal(await page.locator('#animation-page').isVisible(), true);
    assert.deepEqual(await page.locator('.array-cell').evaluateAll(cells => cells.map(cell => cell.dataset.value)), initialValues);
    await parent('sorting.bubble_sort').press('ArrowRight');
    assert.equal(await parent('sorting.bubble_sort').getAttribute('aria-expanded'), 'true');
    await parent('sorting.bubble_sort').press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.stage), 'animation');
    await child('animation').press('ArrowDown');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.stage), 'practice');
    await child('practice').press('Enter');
    await wait(() => document.querySelector('.lesson-stage.active')?.dataset.stage === 'practice');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.stage), 'practice');
    await page.evaluate(() => window.ace.edit('code-editor').setValue('// will erase this draft', -1));
    await selectStage('animation'); await selectStage('practice');
    await page.evaluate(() => window.ace.edit('code-editor').setValue('', -1));
    await selectStage('animation'); await selectStage('practice');
    assert.equal(await page.evaluate(() => window.ace.edit('code-editor').getValue()), '', 'An intentionally cleared draft stays blank');
    await page.evaluate(() => window.ace.edit('code-editor').setValue('// keep nested C draft', -1));
    await selectStage('exam');
    await page.evaluate(() => window.ace.edit('code-editor').setValue('// separate exam draft', -1));
    await selectStage('practice');
    assert.equal(await page.evaluate(() => window.ace.edit('code-editor').getValue()), '// keep nested C draft');
    await page.locator('#language').selectOption('C++');
    await wait(() => document.getElementById('filename').textContent.endsWith('.cpp'));
    await page.evaluate(() => window.ace.edit('code-editor').setValue('// independent C++ draft', -1));
    await page.locator('#language').selectOption('C');
    await wait(() => document.getElementById('filename').textContent.endsWith('.c'));
    assert.equal(await page.evaluate(() => window.ace.edit('code-editor').getValue()), '// keep nested C draft');
    await click(page.locator('[data-panel="notes"]'));
    await page.locator('#notes').fill('子环节导航测试笔记');
    await click(page.locator('[data-panel="courses"]'));
    await selectLesson('linear.arrays');
    await selectLesson('sorting.bubble_sort');
    await click(page.locator('[data-panel="notes"]'));
    assert.equal(await page.locator('#notes').inputValue(), '子环节导航测试笔记');
    await click(page.locator('[data-panel="courses"]'));
    await page.locator('#course-search').fill('哈希');
    assert.equal(await page.locator('.lesson-link').count(), 1);
    await selectLesson('advanced.hash_table');
    assert.equal(await page.locator('.lesson-stage').count(), 3);
    await page.locator('#course-search').fill('没有这个课程');
    assert.equal(await page.locator('.lesson-link').count(), 0);
    await page.locator('#course-search').fill('');
    assert.equal(await page.locator('.lesson-link').count(), 28);
    await selectLesson('sorting.bubble_sort');
    await selectStage('animation');
    await screenshot('nested-course-animation.png');
    await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1060, 740));
    await wait(() => innerWidth === 1060);
    await selectStage('practice');
    assert.ok((await page.locator('#code-editor').boundingBox()).width >= 280);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const treeLayout = await page.evaluate(() => {
      const heading = document.querySelector('.sidebar-heading').getBoundingClientRect();
      const search = document.querySelector('.search-box').getBoundingClientRect();
      const tree = document.getElementById('course-tree').getBoundingClientRect();
      const children = document.querySelector('.lesson-stages:not([hidden])').getBoundingClientRect();
      return { fixedSearch: search.top >= heading.bottom && search.bottom <= tree.top,
        visibleChildren: children.top >= tree.top - 1 && children.bottom <= tree.bottom + 1 };
    });
    assert.deepEqual(treeLayout, { fixedSearch: true, visibleChildren: true });
    await screenshot('nested-course-practice-small.png');
    const reference = await page.locator('#reference-code').textContent();
    await page.evaluate(reference => window.ace.edit('code-editor').setValue(reference, -1), reference);
    await click(page.locator('#submit'));
    await wait(() => document.getElementById('judge-status').textContent === 'AC');
    assert.equal(await child('practice').locator('.completed-mark').count(), 1);
    assert.equal(await page.locator('#progress-count').innerText(), '1 / 84');
    await selectStage('exam');
    assert.equal(await page.evaluate(() => window.ace.edit('code-editor').getValue()), '// separate exam draft');
    await close();
    await launch();
    assert.equal(await page.locator('.lesson-stage.active').getAttribute('data-lesson'), 'sorting.bubble_sort');
    assert.equal(await page.locator('.lesson-stage.active').getAttribute('data-stage'), 'exam');
    assert.equal(await parent('sorting.bubble_sort').getAttribute('aria-expanded'), 'true');
    assert.equal(await page.evaluate(() => window.ace.edit('code-editor').getValue()), '// separate exam draft');
    assert.deepEqual(errors, []);
    await close();
    console.log('Navigation passed: AI removed, all C/C++ practice/exam editors initially blank, empty/user drafts preserved, keyboard/collapse/search, notes, small-window layout, real AC marker, restart restoration.');
  } finally {
    if (application) await application.close();
    if (path.dirname(dataDir) !== os.tmpdir() || !path.basename(dataDir).startsWith('dsa-navigation-test-'))
      throw new Error('Unexpected temporary data path');
    await fs.rm(dataDir, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
