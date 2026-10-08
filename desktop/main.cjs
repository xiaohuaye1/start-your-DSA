const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { Backend } = require('./backend.cjs');

const root = path.join(__dirname, '..');
const pageURL = pathToFileURL(path.join(__dirname, 'index.html')).href;
let window, backend;
let allowClose = false;
const methods = ['bootstrap', 'load_stage', 'save_draft', 'save_note', 'complete', 'save_settings', 'judge', 'cancel'];

function checkSender(event) {
  if (!window || event.sender !== window.webContents || event.senderFrame?.url !== pageURL)
    throw new Error('未授权的界面请求');
}

app.whenReady().then(async () => {
  try {
    backend = new Backend(root, { dataDir: process.env.DSA_DATA_DIR });
    window = new BrowserWindow({ width: 1480, height: 960, minWidth: 1060, minHeight: 740,
      frame: false, show: false, backgroundColor: '#1b1b1b', title: 'Start Your DSA',
      webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, backgroundThrottling: false,
        nodeIntegration: false, sandbox: true, spellcheck: false } });
    Menu.setApplicationMenu(null);
    for (const method of methods) ipcMain.handle(`dsa:${method}`, (event, params) => {
      checkSender(event); return backend.request(method, params);
    });
    ipcMain.handle('dsa:pick-compiler', async event => {
      checkSender(event);
      const selected = await dialog.showOpenDialog(window, { title: '选择编译器', properties: ['openFile'],
        filters: [{ name: '编译器', extensions: process.platform === 'win32' ? ['exe'] : ['*'] }] });
      return selected.canceled ? '' : selected.filePaths[0];
    });
    ipcMain.on('dsa:window', (event, action) => {
      checkSender(event);
      if (action === 'minimize') window.minimize();
      if (action === 'maximize') window.isMaximized() ? window.unmaximize() : window.maximize();
      if (action === 'close') window.webContents.send('dsa:event', { event: 'prepare-close' });
    });
    ipcMain.handle('dsa:close-ready', async event => {
      checkSender(event);
      await backend.stop();
      allowClose = true;
      window.close();
    });
    backend.on('event', message => {
      if (window && !window.isDestroyed()) window.webContents.send('dsa:event', message);
    });
    backend.on('exit', () => {
      if (!allowClose && window && !window.isDestroyed()) window.webContents.send('dsa:event', {
        event: 'backend-error', payload: '本地服务已退出，请重新启动软件。' });
    });
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', (event, url) => { if (url !== pageURL) event.preventDefault(); });
    window.on('close', event => {
      if (!allowClose) { event.preventDefault(); window.webContents.send('dsa:event', { event: 'prepare-close' }); }
    });
    window.once('ready-to-show', () => { if (process.env.DSA_TEST !== '1') window.show(); });
    await window.loadFile(path.join(__dirname, 'index.html'));
  } catch (error) {
    dialog.showErrorBox('无法启动 Start Your DSA', error.message);
    if (backend) await backend.stop();
    app.quit();
  }
});
app.on('window-all-closed', () => app.quit());
