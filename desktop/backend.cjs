const { spawn, spawnSync } = require('node:child_process');
const { createInterface } = require('node:readline');
const { EventEmitter } = require('node:events');
const path = require('node:path');
const fs = require('node:fs');

function findPython(root) {
  const candidates = [process.env.DSA_PYTHON, path.join(root, '.venv', 'Scripts', 'python.exe'),
    path.join(root, '.venv', 'bin', 'python'), 'python', 'python3'];
  for (const candidate of candidates.filter(Boolean)) {
    if (path.isAbsolute(candidate) && !fs.existsSync(candidate)) continue;
    const result = spawnSync(candidate, ['-c', 'import PySide6.QtCore'], { windowsHide: true, timeout: 5000 });
    if (!result.error && result.status === 0) return candidate;
  }
  throw new Error('开发环境缺少安装了 PySide6 的 Python，请查看 packaging/README.md。普通用户请下载 EXE 版本。');
}

class Backend extends EventEmitter {
  constructor(root, options = {}) {
    super();
    this.pending = new Map();
    this.serial = 0;
    const packaged = options.packaged === true;
    const executable = packaged ? path.join(options.resourcesPath, 'backend', 'DSABackend.exe')
      : options.python || findPython(root);
    if (packaged && !fs.existsSync(executable)) throw new Error('软件内置服务缺失，请重新解压或下载完整软件包。');
    const args = packaged ? [] : ['-u', '-m', 'app.bridge'];
    if (options.dataDir) args.push('--data-dir', options.dataDir);
    const env = { ...process.env, PYTHONIOENCODING: 'utf-8' };
    if (packaged) {
      env.DSA_TOOLCHAIN = path.join(options.resourcesPath, 'toolchain');
      delete env.PYTHONHOME; delete env.PYTHONPATH; delete env.DSA_PYTHON;
    }
    this.process = spawn(executable, args, { cwd: packaged ? path.dirname(executable) : root, windowsHide: true,
      env, stdio: ['pipe', 'pipe', 'pipe'] });
    this.stderr = '';
    this.closed = false;
    this.process.stderr.on('data', chunk => { this.stderr = (this.stderr + chunk.toString()).slice(-12000); });
    createInterface({ input: this.process.stdout }).on('line', line => {
      let message;
      try { message = JSON.parse(line); } catch { return; }
      if (message.event) this.emit('event', message);
      else if (this.pending.has(message.id)) {
        const promise = this.pending.get(message.id);
        clearTimeout(promise.timer);
        this.pending.delete(message.id);
        message.error ? promise.reject(new Error(message.error)) : promise.resolve(message.result);
      }
    });
    this.process.on('error', error => this.fail(error));
    this.process.stdin.on('error', error => this.fail(error));
    this.process.on('exit', (code, signal) => {
      this.closed = true;
      this.fail(new Error(`Python 服务已退出（${code ?? signal}）\n${this.stderr}`));
      this.emit('exit', code);
    });
  }

  fail(error) {
    for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(error); }
    this.pending.clear();
  }

  request(method, params = {}) {
    if (this.closed) return Promise.reject(new Error('Python 服务未运行'));
    const id = ++this.serial;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('本地服务响应超时')); }, 15000);
      this.pending.set(id, { resolve, reject, timer });
      this.process.stdin.write(JSON.stringify({ id, method, params }) + '\n');
    });
  }

  async stop() {
    if (this.closed) return;
    await this.request('shutdown').catch(() => {});
    this.process.stdin.end();
    if (this.closed) return;
    await new Promise(resolve => {
      const timer = setTimeout(() => { this.process.kill(); resolve(); }, 5000);
      this.process.once('exit', () => { clearTimeout(timer); resolve(); });
    });
  }
}

module.exports = { Backend, findPython };
