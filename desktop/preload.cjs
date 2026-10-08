const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('dsa', {
  bootstrap: () => ipcRenderer.invoke('dsa:bootstrap'),
  loadStage: params => ipcRenderer.invoke('dsa:load_stage', params),
  saveDraft: params => ipcRenderer.invoke('dsa:save_draft', params),
  saveNote: params => ipcRenderer.invoke('dsa:save_note', params),
  complete: params => ipcRenderer.invoke('dsa:complete', params),
  saveSettings: params => ipcRenderer.invoke('dsa:save_settings', params),
  judge: params => ipcRenderer.invoke('dsa:judge', params),
  cancel: () => ipcRenderer.invoke('dsa:cancel'),
  pickCompiler: () => ipcRenderer.invoke('dsa:pick-compiler'),
  window: action => ipcRenderer.send('dsa:window', action),
  closeReady: () => ipcRenderer.invoke('dsa:close-ready'),
  onEvent: callback => {
    const listener = (_event, message) => callback(message);
    ipcRenderer.on('dsa:event', listener);
    return () => ipcRenderer.removeListener('dsa:event', listener);
  }
});
