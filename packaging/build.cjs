/* Windows x64 build; runtime/toolchain remain outside ASAR so they can execute. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const python = process.env.DSA_BUILD_PYTHON || path.join(root, '.build-venv', 'Scripts', 'python.exe');
const toolchain = process.env.DSA_BUILD_TOOLCHAIN;
const builder = path.join(__dirname, 'tooling', 'node_modules', 'electron-builder', 'cli.js');
const work = path.join(root, 'build', `windows-${Date.now()}`);
function run(executable, args, env = process.env) {
  const result = spawnSync(executable, args, { cwd: root, stdio: 'inherit', windowsHide: true, env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${path.basename(executable)} exited: ${result.status}`);
}
function requireFile(filename) {
  if (!fs.statSync(filename, { throwIfNoEntry: false })?.isFile()) throw new Error('缺少文件：' + filename);
}
if (process.platform !== 'win32' || process.arch !== 'x64') throw new Error('请在 Windows x64 上打包。');
if (!toolchain) throw new Error('请设置 DSA_BUILD_TOOLCHAIN 为便携 MinGW-w64 的根目录。');
requireFile(python); requireFile(builder);
requireFile(path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe'));
for (const name of ['gcc.exe', 'g++.exe', 'as.exe', 'ld.exe']) requireFile(path.join(toolchain, 'bin', name));
fs.mkdirSync(work, { recursive: true });
// Do not let unrelated applications' DLLs on the build machine enter the bundle.
const freezeEnv = { ...process.env, PATH: path.join(process.env.SystemRoot, 'System32') + ';' + process.env.SystemRoot };
delete freezeEnv.PYTHONHOME; delete freezeEnv.PYTHONPATH;
run(python, ['-m', 'PyInstaller', '--noconfirm', '--distpath', path.join(work, 'runtime'),
  '--workpath', path.join(work, 'pyinstaller'), path.join(__dirname, 'backend.spec')], freezeEnv);
const probe = fs.mkdtempSync(path.join(os.tmpdir(), 'dsa-build-probe-'));
try {
  const result = spawnSync(path.join(work, 'runtime', 'DSABackend', 'DSABackend.exe'), ['--data-dir', probe],
    { env: freezeEnv, windowsHide: true, encoding: 'utf8', timeout: 20000,
      input: JSON.stringify({ id: 1, method: 'bootstrap' }) + '\n' });
  if (result.error || result.status !== 0 || !result.stdout.includes('"lessons"'))
    throw new Error('冻结后端自检失败：' + (result.stderr || result.error || result.status));
} finally {
  // This exact directory was just created by mkdtemp, never an installation/data root.
  fs.rmSync(probe, { recursive: true, force: true });
}
const bundled = path.join(work, 'toolchain');
fs.mkdirSync(path.join(bundled, 'bin'), { recursive: true });
for (const name of ['gcc.exe', 'g++.exe', 'as.exe', 'ld.exe', 'ld.bfd.exe',
  'libgcc_s_seh-1.dll', 'libstdc++-6.dll', 'libwinpthread-1.dll', 'libatomic-1.dll', 'libgomp-1.dll']) {
  requireFile(path.join(toolchain, 'bin', name));
  fs.copyFileSync(path.join(toolchain, 'bin', name), path.join(bundled, 'bin', name));
}
for (const name of ['include', 'lib', 'libexec', 'x86_64-w64-mingw32', 'licenses']) {
  fs.cpSync(path.join(toolchain, name), path.join(bundled, name), { recursive: true,
    filter: filename => !/(^|[\\/])(f951\.exe|finclude|libgfortran[^\\/]*|libquadmath[^\\/]*|libcaf[^\\/]*)$/.test(filename) });
}
fs.copyFileSync(path.join(toolchain, 'build-info.txt'), path.join(bundled, 'build-info.txt'));
const notices = path.join(work, 'notices');
fs.mkdirSync(notices, { recursive: true });
fs.copyFileSync(path.join(__dirname, 'THIRD-PARTY.md'), path.join(notices, 'THIRD-PARTY.md'));
fs.copyFileSync(path.join(root, 'README.md'), path.join(notices, 'README.md'));
// Preserve bundled Python / Qt / shiboken license files, not only a list of names.
const pythonBase = spawnSync(python, ['-c', 'import sys;print(sys.base_prefix)'], { encoding: 'utf8', windowsHide: true });
requireFile(path.join(pythonBase.stdout.trim(), 'LICENSE.txt'));
fs.copyFileSync(path.join(pythonBase.stdout.trim(), 'LICENSE.txt'), path.join(notices, 'PYTHON-LICENSE.txt'));
for (const item of fs.readdirSync(path.join(path.dirname(path.dirname(python)), 'Lib', 'site-packages'))) {
  if (/^(pyside6_essentials|shiboken6|pyinstaller)-.*\.dist-info$/i.test(item)) {
    const source = path.join(path.dirname(path.dirname(python)), 'Lib', 'site-packages', item);
    fs.cpSync(source, path.join(notices, item), { recursive: true });
  }
}
const config = {
  appId: 'com.startyourdsa.desktop', productName: 'Start Your DSA',
  directories: { output: path.join(root, 'release') },
  electronDist: path.join(root, 'node_modules', 'electron', 'dist'),
  npmRebuild: false, asar: true,
  files: ['desktop/**/*', 'assets/**/*', 'package.json'],
  extraFiles: [{ from: path.join(__dirname, 'USAGE.txt'), to: '使用说明.txt' }],
  extraResources: [
    { from: path.join(work, 'runtime', 'DSABackend'), to: 'backend', filter: ['**/*'] },
    { from: bundled, to: 'toolchain', filter: ['**/*'] },
    { from: notices, to: 'licenses', filter: ['**/*'] },
  ],
  win: { target: [{ target: 'zip', arch: ['x64'] }], signAndEditExecutable: false,
    artifactName: 'Start-Your-DSA-${version}-win-x64.zip' },
};
const configFile = path.join(work, 'electron-builder.json');
fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
run(process.execPath, [builder, '--win', '--x64', '--config', configFile, '--publish', 'never']);
console.log('打包完成：release/（内置后端和 C/C++ 编译器，不需要安装开发环境）');
