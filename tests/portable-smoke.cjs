/* Launch the actual single-file portable EXE, not the unpacked build. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { fileURLToPath } = require('node:url');
const { chromium } = require(process.env.DSA_PLAYWRIGHT || path.join(os.homedir(),
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const root = path.resolve(__dirname, '..');
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function main() {
  const data = await fs.mkdtemp(path.join(os.tmpdir(), 'dsa-portable-test-'));
  let browser, launcher;
  try {
    const server = net.createServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    await new Promise(resolve => server.close(resolve));
    const env = { ...process.env, DSA_DATA_DIR: data, DSA_TEST: '1',
      PATH: path.join(process.env.SystemRoot, 'System32'), DSA_PYTHON: 'missing-python.exe' };
    delete env.ELECTRON_RUN_AS_NODE; delete env.PYTHONHOME; delete env.PYTHONPATH; delete env.DSA_TOOLCHAIN;
    const executable = process.env.DSA_PORTABLE_EXE || path.join(root, 'release', 'Start-Your-DSA-0.2.0-portable.exe');
    launcher = spawn(executable, [`--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1'],
      { cwd: os.tmpdir(), env, windowsHide: true, stdio: 'ignore' });
    let launchError;
    launcher.on('error', error => { launchError = error; });
    const endpoint = `http://127.0.0.1:${port}`;
    const deadline = Date.now() + 180000;
    while (Date.now() < deadline) {
      if (launchError) throw launchError;
      try { const result = await fetch(endpoint + '/json/version', { signal: AbortSignal.timeout(1000) });
        if (result.ok) break;
      } catch { /* The launcher is still extracting. */ }
      if (launcher.exitCode !== null) throw new Error('Portable launcher exited before opening the app: ' + launcher.exitCode);
      await delay(200);
    }
    browser = await chromium.connectOverCDP(endpoint, { timeout: 10000 });
    const page = browser.contexts()[0].pages()[0];
    const wait = (fn, arg) => page.waitForFunction(fn, arg, { polling: 100, timeout: 15000 });
    await wait(() => document.getElementById('connection-label')?.textContent === '本地判题已连接');
    const boot = await page.evaluate(() => window.dsa.bootstrap());
    assert.equal(boot.lessons.length, 28); assert.equal(boot.dataDirectory, data);
    const resources = path.dirname(path.dirname(path.dirname(fileURLToPath(page.url()))));
    assert.ok(page.url().includes('app.asar/desktop/index.html'));
    // One C and one C++ submission after real self-extraction; only bundled GCC is available.
    for (const language of ['C', 'C++']) {
      const result = await page.evaluate(async language => {
        const params = { lesson: 'sorting.bubble_sort', stage: 'practice', language };
        const stage = await window.dsa.loadStage(params);
        const events = [];
        let unsubscribe;
        const finished = new Promise(resolve => {
          unsubscribe = window.dsa.onEvent(message => {
            events.push(message);
            if (message.event === 'finished') resolve(message.payload);
          });
        });
        try {
          await window.dsa.judge({ ...params, code: (language === 'C++' ? '#include <iostream>\n' : '') + stage.reference, mode: 'submit' });
          return { result: await finished, commands: events.filter(event => event.event === 'terminal' &&
            event.payload.kind === 'command').map(event => event.payload.text) };
        } finally { unsubscribe(); }
      }, language);
      assert.equal(result.result.verdict, 'AC', JSON.stringify(result));
      assert.equal(result.result.cases.length, 3);
      assert.ok(result.commands.some(command => command.includes(path.join(resources, 'toolchain', 'bin', language === 'C' ? 'gcc.exe' : 'g++.exe'))));
      console.log('Actual portable EXE:', language, 'AC; bundled compiler in temporary extraction directory.');
    }
    const closed = page.waitForEvent('close');
    await page.evaluate(() => document.querySelector('[data-window="close"]').click());
    await closed;
    // Thousands of compiler headers can make NSIS cleanup slow with antivirus.
    for (let i = 0; i < 1200 && launcher.exitCode === null; i++) await delay(100);
    assert.equal(launcher.exitCode, 0, 'Portable launcher closes successfully after its child app');
    console.log('Single EXE self-extraction, independent launch, C/C++ and clean shutdown passed.');
  } finally {
    if (browser) await browser.close();
    if (launcher?.exitCode === null) launcher.kill();
    if (path.dirname(data) !== os.tmpdir() || !path.basename(data).startsWith('dsa-portable-test-')) throw new Error('Unexpected test data path');
    await fs.rm(data, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
