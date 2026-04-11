const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('shangrimc', {
  // Window controls
  minimize:    () => ipcRenderer.send('window-minimize'),
  maximize:    () => ipcRenderer.send('window-maximize'),
  close:       () => ipcRenderer.send('window-close'),

  // Auth
  getAuth:       ()    => ipcRenderer.invoke('get-auth'),
  microsoftLogin: ()   => ipcRenderer.invoke('microsoft-login'),
  logout:        ()    => ipcRenderer.invoke('logout'),
  goHome:        ()    => ipcRenderer.invoke('go-home'),

  // Settings (persistantes)
  getSetting: (key)        => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),

  // Game
  launchGame:   (auth) => ipcRenderer.invoke('launch-game', auth),
  checkForge:   ()     => ipcRenderer.invoke('check-forge'),
  openGameDir:  ()     => ipcRenderer.invoke('open-game-dir'),
  openExternal: (url)  => ipcRenderer.invoke('open-external', url),

  // Mods sync
  syncMods:      ()    => ipcRenderer.invoke('sync-mods'),
  openModsDir:   ()    => ipcRenderer.invoke('open-mods-dir'),

  // Discord RPC
  startDiscordRPC: () => ipcRenderer.invoke('start-discord-rpc'),

  // Listeners
  onLaunchLog:      (cb) => ipcRenderer.on('launch-log',      (_, v) => cb(v)),
  onLaunchProgress: (cb) => ipcRenderer.on('launch-progress', (_, v) => cb(v)),
  onLaunchStarted:  (cb) => ipcRenderer.on('launch-started',  (_)    => cb()),
  onLaunchClosed:   (cb) => ipcRenderer.on('launch-closed',   (_, v) => cb(v)),
  onLaunchError:    (cb) => ipcRenderer.on('launch-error',    (_, v) => cb(v)),
});
