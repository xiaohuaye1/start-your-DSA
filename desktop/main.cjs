const { app, BrowserWindow, ipcMain, dialog, Menu, shell, nativeTheme } = require('electron');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { Backend } = require('./backend.cjs');

const root = path.join(__dirname, '..');
const pageURL = pathToFileURL(path.join(__dirname, 'index.html')).href;
let window, backend;
let allowClose = false;
let backgroundMaterial = 'none';
const methods = ['bootstrap', 'load_stage', 'save_draft', 'save_note', 'complete', 'save_settings', 'judge', 'cancel'];

function checkSender(event) {
  if (!window || event.sender !== window.webContents || event.senderFrame?.url !== pageURL)
    throw new Error('未授权的界面请求');
}

app.whenReady().then(async () => {
  try {
    backend = new Backend(root, { dataDir: process.env.DSA_DATA_DIR,
      packaged: app.isPackaged, resourcesPath: process.resourcesPath });
    nativeTheme.themeSource = 'dark';
    window = new BrowserWindow({ width: 1480, height: 960, minWidth: 1060, minHeight: 740,
      frame: false, show: false, backgroundColor: '#1b1b1b', title: 'Start Your DSA',
      webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, backgroundThrottling: false,
        nodeIntegration: false, sandbox: true, spellcheck: false } });
    // Native backdrop needs Windows 11 22H2+. Keep opaque content below the titlebar.
    if (process.env.DSA_DISABLE_MATERIAL !== '1' && process.platform === 'win32' && Number(os.release().split('.')[2]) >= 22621) {
      try {
        window.setBackgroundMaterial('acrylic');
        window.setBackgroundColor('#00000000');
        backgroundMaterial = 'acrylic';
      } catch {
        window.setBackgroundColor('#1b1b1b');
      }
    }
    Menu.setApplicationMenu(null);
    for (const method of methods) ipcMain.handle(`dsa:${method}`, async (event, params) => {
      checkSender(event);
      const result = await backend.request(method, params);
      return method === 'bootstrap' ? { ...result, backgroundMaterial } : result;
    });
    ipcMain.handle('dsa:pick-compiler', async event => {
      checkSender(event);
      const selected = await dialog.showOpenDialog(window, { title: '选择编译器', properties: ['openFile'],
        filters: [{ name: '编译器', extensions: process.platform === 'win32' ? ['exe'] : ['*'] }] });
      return selected.canceled ? '' : selected.filePaths[0];
    });
    ipcMain.handle('dsa:open-source', async (event, params) => {
      checkSender(event);
      if (typeof params?.url !== 'string' || !/^https:\/\/www\.luogu\.com\.cn\/problem\/[PB][1-9]\d*$/.test(params.url))
        throw new Error('仅支持打开洛谷原题链接');
      await shell.openExternal(params.url);
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
