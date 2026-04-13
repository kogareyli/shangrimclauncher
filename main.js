const { app, BrowserWindow, ipcMain, session, Menu, dialog, shell } = require('electron');
const { Auth } = require('msmc');
const path    = require('path');
const os      = require('os');
const fs      = require('fs');

// ─── Nom de l'app (barre des tâches, Discord, etc.) ──────────────────────────
app.setName('ShangriMc');
if (process.platform === 'win32') {
  app.setAppUserModelId('ShangriMc Launcher');
}

// ─── Config ────────────────────────────────────────────────────────────────
const SERVER_HOST  = 'vocalist-submission.gl.joinmc.link';
const GAME_DIR     = path.join(os.homedir(), 'AppData', 'Roaming', '.shangrimc');
const ICON_PATH    = path.join(__dirname, 'assets', 'icon.ico');

// Forge
const FORGE_VERSION   = '47.4.18';
const FORGE_JAR_NAME  = `forge-1.20.1-${FORGE_VERSION}-installer.jar`;
const FORGE_JAR_PATH  = path.join(__dirname, FORGE_JAR_NAME);
const FORGE_CUSTOM_ID = `1.20.1-forge-${FORGE_VERSION}`;

let Store;
let store;
let mainWindow;

// ─── Store ─────────────────────────────────────────────────────────────────
async function getStore() {
  if (!store) {
    Store = (await import('electron-store')).default;
    store = new Store({ name: 'shangrimc-auth' });
  }
  return store;
}

// ─── Fenêtre factory ───────────────────────────────────────────────────────
function createWindow(file, opts = {}) {
  const win = new BrowserWindow({
    width:           opts.width  || 1100,
    height:          opts.height || 680,
    minWidth:        opts.minWidth  || 900,
    minHeight:       opts.minHeight || 600,
    frame:           false,
    transparent:     false,
    backgroundColor: '#080810',
    icon:            fs.existsSync(ICON_PATH) ? ICON_PATH : undefined,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      nodeIntegration:  false,
      contextIsolation: true,
    },
    show: false,
    ...opts.extra,
  });
  win.loadFile(path.join(__dirname, 'src', file));
  win.once('ready-to-show', () => win.show());
  return win;
}

// ─── Auto-update ───────────────────────────────────────────────────────────
function setupAutoUpdater() {
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.autoDownload         = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.logger               = null;
    autoUpdater.on('update-available', (info) => {
      mainWindow?.webContents.send('update-available', info.version);
    });
    autoUpdater.on('update-downloaded', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        dialog.showMessageBox(mainWindow, {
          type:    'info',
          title:   'Mise à jour disponible',
          message: 'Une nouvelle version a été téléchargée.\nElle sera installée au prochain redémarrage.',
          buttons: ['Redémarrer maintenant', 'Plus tard'],
        }).then(({ response }) => { if (response === 0) autoUpdater.quitAndInstall(); });
      }
    });
    autoUpdater.on('error', () => {});
    if (app.isPackaged) setTimeout(() => autoUpdater.checkForUpdates(), 3000);
  } catch (_) {}
}

// ─── App ready ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  setupAutoUpdater();
  const s    = await getStore();
  const auth = s.get('auth');
  if (auth && auth.access_token) {
    mainWindow = createWindow('home.html');
  } else {
    mainWindow = createWindow('login.html', { width: 860, height: 560, minWidth: 700, minHeight: 500 });
  }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// ─── Window controls ───────────────────────────────────────────────────────
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.close());

// ─── Auth: get saved profile ────────────────────────────────────────────────
ipcMain.handle('get-auth', async () => {
  const s = await getStore();
  return s.get('auth') || null;
});

// ─── Auth Microsoft via msmc ────────────────────────────────────────────────
ipcMain.handle('microsoft-login', async () => {
  try {
    const authManager = new Auth('select_account');

    // On remplace createLink pour utiliser login.microsoftonline.com
    // (cette page envoie bien le code par email) tout en gardant le
    // redirect login.live.com/oauth20_desktop.srf que msmc surveille.
    const redirect = authManager.token.redirect;
    authManager.createLink = () =>
      `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize` +
      `?client_id=${authManager.token.client_id}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirect)}` +
      `&scope=XboxLive.signin%20offline_access` +
      `&prompt=select_account`;

    // msmc ouvre la popup, capture le code, fait toute la chaîne Xbox + MC
    const xboxManager = await authManager.launch('electron', {
      width:           480,
      height:          660,
      parent:          mainWindow,
      modal:           true,
      backgroundColor: '#07070f',
    });

    const token = await xboxManager.getMinecraft();

    if (!token?.profile?.id) throw new Error('Profil Minecraft introuvable. Minecraft acheté ?');

    const profile = {
      access_token: token.mcToken,
      uuid:         token.profile.id,
      name:         token.profile.name,
      skin:         token.profile.skins?.[0]?.url || null,
      logged_at:    Date.now(),
      mclc:         token.mclc(),
    };

    const s = await getStore();
    s.set('auth', profile);
    return profile;

  } catch (err) {
    throw new Error(err.message || 'Erreur de connexion Microsoft.');
  }
});

// ─── Launch Minecraft ──────────────────────────────────────────────────────
ipcMain.handle('launch-game', async (event, authData) => {
  const { Client } = require('minecraft-launcher-core');
  const client = new Client();
  ensureGameDirStructure();

  const ramMax = authData.ram || '4G';
  const ramMin = ramMax === '2G' ? '1G' : '2G';

  const opts = {
    authorization: authData.mclc || {
      access_token:    authData.access_token,
      client_token:    authData.uuid,
      uuid:            authData.uuid,
      name:            authData.name,
      user_properties: '{}',
      meta: { type: 'msa', xuid: authData.uuid, demo: false },
    },
    root:    GAME_DIR,
    version: { number: '1.20.1', type: 'release', custom: FORGE_CUSTOM_ID },
    forge:   FORGE_JAR_PATH,
    memory:  { max: ramMax, min: ramMin },
    server:  { host: SERVER_HOST, port: 25565 },
    javaPath: 'java',
    customArgs: [
      '-XX:+UseG1GC', '-XX:+ParallelRefProcEnabled',
      '-XX:MaxGCPauseMillis=200', '-XX:+UnlockExperimentalVMOptions',
      '-XX:+DisableExplicitGC', '-XX:G1NewSizePercent=30',
      '-XX:G1MaxNewSizePercent=40', '-XX:G1HeapRegionSize=8M',
    ],
  };

  client.on('debug',    (e) => event.sender.send('launch-log',      `[DEBUG] ${e}`));
  client.on('data',     (e) => event.sender.send('launch-log',      `[DATA] ${e}`));
  client.on('progress', (e) => event.sender.send('launch-progress', e));
  client.on('close',   (c)  => event.sender.send('launch-closed',   c));

  try {
    await client.launch(opts);
    event.sender.send('launch-started');
  } catch (err) {
    event.sender.send('launch-error', err.message);
  }
});

// ─── Check Forge ────────────────────────────────────────────────────────────
ipcMain.handle('check-forge', async () => ({
  forgePath:    FORGE_JAR_PATH,
  forgeVersion: FORGE_VERSION,
  exists:       fs.existsSync(FORGE_JAR_PATH),
  gameDir:      GAME_DIR,
}));

// ─── Open URL in browser ────────────────────────────────────────────────────
ipcMain.handle('open-external', async (_, url) => shell.openExternal(url));

// ─── Mods manifest (GitHub) ────────────────────────────────────────────────
const MODS_MANIFEST_URL = 'https://raw.githubusercontent.com/kogareyli/shangrimclauncher/main/mods-manifest.json';

ipcMain.handle('check-mods-update', async (event) => {
  try {
    const { default: fetch } = await import('node-fetch');
    const res = await fetch(MODS_MANIFEST_URL, { timeout: 5000 });
    if (!res.ok) return { upToDate: true, message: 'Manifest non trouvable.' };

    const manifest    = await res.json();
    const gameModsDir = path.join(GAME_DIR, 'mods');
    ensureGameDirStructure();

    const localMods = fs.existsSync(gameModsDir)
      ? fs.readdirSync(gameModsDir).filter(f => f.endsWith('.jar'))
      : [];

    const missing = manifest.mods.filter(m => !localMods.includes(m.name));
    if (missing.length === 0) return { upToDate: true, total: manifest.mods.length };

    let downloaded = 0;
    for (const mod of missing) {
      event.sender.send('mod-download-progress', { name: mod.name, current: downloaded, total: missing.length });
      const modRes = await fetch(mod.url);
      if (!modRes.ok) continue;
      const buffer = await modRes.buffer();
      fs.writeFileSync(path.join(gameModsDir, mod.name), buffer);
      downloaded++;
    }
    return { upToDate: false, downloaded, total: missing.length };
  } catch (e) {
    return { upToDate: true, error: e.message };
  }
});

// ─── Game directory setup ───────────────────────────────────────────────────
function ensureGameDirStructure() {
  for (const d of ['mods', 'config', 'resourcepacks', 'shaderpacks', 'screenshots', 'saves']) {
    const p = path.join(GAME_DIR, d);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }
}

// ─── Mod sync launcher/mods/ → .shangrimc/mods/ ────────────────────────────
ipcMain.handle('sync-mods', async () => {
  const launcherModsDir = path.join(__dirname, 'mods');
  const gameModsDir     = path.join(GAME_DIR, 'mods');

  if (!fs.existsSync(launcherModsDir)) {
    fs.mkdirSync(launcherModsDir, { recursive: true });
    return { added: [], removed: [], total: 0, message: 'Dossier mods/ créé.' };
  }
  ensureGameDirStructure();

  const launcherMods = fs.readdirSync(launcherModsDir).filter(f => f.endsWith('.jar'));
  const gameMods     = fs.readdirSync(gameModsDir).filter(f => f.endsWith('.jar'));
  const added = [], removed = [];

  for (const mod of launcherMods) {
    const src = path.join(launcherModsDir, mod);
    const dst = path.join(gameModsDir, mod);
    const srcStat = fs.statSync(src);
    const dstStat = fs.existsSync(dst) ? fs.statSync(dst) : null;
    if (!dstStat || srcStat.size !== dstStat.size || srcStat.mtimeMs > dstStat.mtimeMs) {
      fs.copyFileSync(src, dst);
      added.push(mod);
    }
  }
  for (const mod of gameMods) {
    if (!launcherMods.includes(mod)) { fs.unlinkSync(path.join(gameModsDir, mod)); removed.push(mod); }
  }
  return { added, removed, total: launcherMods.length, message: 'Synchronisation terminée.' };
});

// ─── Open mods dir ─────────────────────────────────────────────────────────
ipcMain.handle('open-mods-dir', async () => {
  const d = path.join(__dirname, 'mods');
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  shell.openPath(d);
});

// ─── Settings ──────────────────────────────────────────────────────────────
ipcMain.handle('get-setting', async (_, key) => {
  const s = await getStore();
  return s.get(`setting.${key}`) || null;
});
ipcMain.handle('set-setting', async (_, key, value) => {
  const s = await getStore();
  s.set(`setting.${key}`, value);
});

// ─── Open game dir ─────────────────────────────────────────────────────────
ipcMain.handle('open-game-dir', async () => {
  if (!fs.existsSync(GAME_DIR)) fs.mkdirSync(GAME_DIR, { recursive: true });
  shell.openPath(GAME_DIR);
});

// ─── Go Home (login → home redirect) ───────────────────────────────────────
ipcMain.handle('go-home', async () => {
  const prevWin = mainWindow;
  mainWindow = createWindow('home.html');
  mainWindow.once('ready-to-show', () => {
    if (prevWin && !prevWin.isDestroyed()) prevWin.close();
  });
});

// ─── Logout ────────────────────────────────────────────────────────────────
ipcMain.handle('logout', async () => {
  const s = await getStore();
  s.delete('auth');
  const oldWin = mainWindow;
  mainWindow = createWindow('login.html', { width: 860, height: 560, minWidth: 700, minHeight: 500 });
  if (oldWin && !oldWin.isDestroyed()) oldWin.close();
});

// ─── Discord RPC (placeholder — set a real App ID at discord.com/developers) ──
ipcMain.handle('start-discord-rpc', async () => {
  try {
    const RPC = require('discord-rpc');
    const DISCORD_CLIENT_ID = '1234567890123456789'; // ← remplace par ton vrai App ID Discord
    const rpc = new RPC.Client({ transport: 'ipc' });
    rpc.on('ready', () => {
      rpc.setActivity({
        details:    'Sur le serveur ShangriMc',
        state:      'Forge 1.20.1',
        largeImageKey: 'logo',
        largeImageText: 'ShangriMc',
        startTimestamp: Date.now(),
        instance: false,
      });
    });
    await rpc.login({ clientId: DISCORD_CLIENT_ID });
  } catch (_) { /* discord-rpc non installé ou App ID invalide */ }
});
