const { app, BrowserWindow, BrowserView, ipcMain, session, Menu, dialog } = require('electron');
const path = require('path');
const os   = require('os');
const fs   = require('fs');

// ─── Config ────────────────────────────────────────────────────────────────
const CLIENT_ID    = 'ea74bb57-e149-43fb-8ed2-712e60652724';
// URI native Microsoft — enregistrées dans Azure Portal → Authentication → Mobile and desktop apps
// On utilise la nativeclient par défaut ; les URIs localhost sont interceptées dynamiquement
const REDIRECT_URI = 'https://login.microsoftonline.com/common/oauth2/nativeclient';
const REDIRECT_LOCALHOST_PATTERNS = [
  { prefix: 'http://localhost:3000/callback',    uri: 'http://localhost:3000/callback' },
  { prefix: 'http://localhost:3000',             uri: 'http://localhost:3000' },
  { prefix: 'http://127.0.0.1:3000/callback',   uri: 'http://127.0.0.1:3000/callback' },
  { prefix: 'http://127.0.0.1:3000',            uri: 'http://127.0.0.1:3000' },
];
const SCOPE        = 'XboxLive.signin offline_access openid profile';
const SERVER_HOST   = 'vocalist-submission.gl.joinmc.link';
const GAME_DIR      = path.join(os.homedir(), 'AppData', 'Roaming', '.shangrimc');

// Forge version — doit correspondre au jar dans le dossier du launcher
const FORGE_VERSION   = '47.4.18';
const FORGE_JAR_NAME  = `forge-1.20.1-${FORGE_VERSION}-installer.jar`;
const FORGE_JAR_PATH  = path.join(__dirname, FORGE_JAR_NAME);
const FORGE_CUSTOM_ID = `1.20.1-forge-${FORGE_VERSION}`;

let Store;
let store;
let mainWindow;

// ─── Store init (lazy, evite les problèmes ESM) ────────────────────────────
async function getStore() {
  if (!store) {
    Store = (await import('electron-store')).default;
    store = new Store({ name: 'shangrimc-auth' });
  }
  return store;
}

// ─── Window factory ────────────────────────────────────────────────────────
function createWindow(file, opts = {}) {
  const win = new BrowserWindow({
    width:           opts.width  || 1100,
    height:          opts.height || 680,
    minWidth:        opts.minWidth  || 900,
    minHeight:       opts.minHeight || 600,
    frame:           false,
    transparent:     false,
    backgroundColor: '#080810',
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

// ─── Auto-update (electron-updater via GitHub Releases) ───────────────────
function setupAutoUpdater() {
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.autoDownload    = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.logger = null; // silence les logs en prod

    autoUpdater.on('update-available', (info) => {
      mainWindow?.webContents.send('update-available', info.version);
    });

    autoUpdater.on('update-downloaded', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        dialog.showMessageBox(mainWindow, {
          type:    'info',
          title:   'Mise à jour disponible',
          message: 'Une nouvelle version de ShangriMc Launcher a été téléchargée.\nElle sera installée au prochain redémarrage.',
          buttons: ['Redémarrer maintenant', 'Plus tard'],
        }).then(({ response }) => {
          if (response === 0) autoUpdater.quitAndInstall();
        });
      }
    });

    autoUpdater.on('error', () => {}); // ignore les erreurs (pas internet, etc.)

    // Vérifie les mises à jour au démarrage (seulement en prod, pas en dev)
    if (app.isPackaged) {
      setTimeout(() => autoUpdater.checkForUpdates(), 3000);
    }
  } catch (_) { /* electron-updater pas encore installé */ }
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

// ─── Auth: Microsoft OAuth — webview tag (fiable, page MS réelle) ──────────
ipcMain.handle('microsoft-login', async () => {
  return new Promise((resolve, reject) => {
    let authWin = null;
    let settled = false;

    function cleanup() {
      try { ipcMain.removeAllListeners('auth-minimize'); } catch (_) {}
      try { ipcMain.removeAllListeners('auth-close'); } catch (_) {}
      try { ipcMain.removeAllListeners('auth-code-received'); } catch (_) {}
    }

    function done(err, profile) {
      if (settled) return;
      settled = true;
      cleanup();
      if (authWin && !authWin.isDestroyed()) authWin.destroy();
      if (err) reject(err);
      else     resolve(profile);
    }

    // Détermine la meilleure redirect_uri à utiliser (préfère nativeclient, fonctionne sans serveur)
    const activeRedirectUri = REDIRECT_URI; // nativeclient par défaut

    const authURL = [
      'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize',
      `?client_id=${CLIENT_ID}`,
      `&response_type=code`,
      `&redirect_uri=${encodeURIComponent(activeRedirectUri)}`,
      `&scope=${encodeURIComponent(SCOPE)}`,
      `&prompt=select_account`,
      `&response_mode=query`,
    ].join('');

    // Fenêtre avec webview tag activé
    authWin = new BrowserWindow({
      width:     500,
      height:    680,
      frame:     false,
      resizable: false,
      parent:    mainWindow,
      modal:     true,
      show:      false,
      backgroundColor: '#07070f',
      webPreferences: {
        nodeIntegration:  true,
        contextIsolation: false,
        webviewTag:       true,   // ← active le tag <webview>
      },
    });
    authWin.setMenu(null);
    authWin.loadFile(path.join(__dirname, 'src', 'auth-popup.html'));

    // Boutons barre custom
    ipcMain.on('auth-minimize', () => authWin?.minimize());
    ipcMain.on('auth-close',   () => done(new Error('Connexion annulée.')));

    // Reçoit l'URL de redirect interceptée par le webview
    ipcMain.on('auth-code-received', async (_, url) => {
      try {
        const urlObj = new URL(url);
        const code   = urlObj.searchParams.get('code');
        const error  = urlObj.searchParams.get('error_description') || urlObj.searchParams.get('error');
        if (error)  return done(new Error(error));
        if (!code)  return done(new Error("Code d'autorisation manquant."));

        // Détermine quelle redirect_uri a été utilisée pour faire correspondre l'échange de token
        let usedRedirectUri = activeRedirectUri;
        for (const { prefix, uri } of REDIRECT_LOCALHOST_PATTERNS) {
          if (url.startsWith(prefix)) { usedRedirectUri = uri; break; }
        }

        const profile = await fullAuthChain(code, usedRedirectUri);
        const s = await getStore();
        s.set('auth', profile);
        done(null, profile);
      } catch (e) { done(e); }
    });

    // Envoie l'URL au renderer une fois la page chargée
    authWin.webContents.once('did-finish-load', () => {
      authWin.webContents.send('load-auth-url', authURL);
      authWin.show();
    });

    authWin.on('closed', () => {
      if (!settled) done(new Error('Connexion annulée.'));
    });
  });
});

// ─── Full Microsoft → Xbox → XSTS → Minecraft chain ──────────────────────
async function fullAuthChain(code, redirectUri = REDIRECT_URI) {
  const nodeFetch = await import('node-fetch');
  const fetch = nodeFetch.default;

  // 1. MS token
  const msTokenRes = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      client_id:    CLIENT_ID,
      code,
      grant_type:   'authorization_code',
      redirect_uri: redirectUri,
      scope:        SCOPE,
    }).toString(),
  });
  const msToken = await msTokenRes.json();
  if (!msToken.access_token) throw new Error('Échec token Microsoft: ' + JSON.stringify(msToken));

  // 2. Xbox Live
  const xblRes = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body:    JSON.stringify({
      Properties:   { AuthMethod: 'RPS', SiteName: 'user.auth.xboxlive.com', RpsTicket: `d=${msToken.access_token}` },
      RelyingParty: 'http://auth.xboxlive.com',
      TokenType:    'JWT',
    }),
  });
  const xbl = await xblRes.json();
  if (!xbl.Token) throw new Error('Échec Xbox Live: ' + JSON.stringify(xbl));
  const uhs = xbl.DisplayClaims.xui[0].uhs;

  // 3. XSTS
  const xstsRes = await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body:    JSON.stringify({
      Properties:   { SandboxId: 'RETAIL', UserTokens: [xbl.Token] },
      RelyingParty: 'rp://api.minecraftservices.com/',
      TokenType:    'JWT',
    }),
  });
  const xsts = await xstsRes.json();
  if (!xsts.Token) {
    const xErr = xsts.XErr;
    let msg = 'Compte Xbox requis.';
    if (xErr === 2148916233) msg = "Ce compte Microsoft n'a pas de compte Xbox. Créez-en un sur xbox.com";
    if (xErr === 2148916238) msg = 'Compte enfant : supervision parentale requise.';
    throw new Error(msg);
  }

  // 4. Minecraft token
  const mcTokenRes = await fetch('https://api.minecraftservices.com/authentication/login_with_xbox', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ identityToken: `XBL3.0 x=${uhs};${xsts.Token}` }),
  });
  const mcToken = await mcTokenRes.json();
  if (!mcToken.access_token) throw new Error('Échec token Minecraft: ' + JSON.stringify(mcToken));

  // 5. Minecraft profile
  const profileRes = await fetch('https://api.minecraftservices.com/minecraft/profile', {
    headers: { Authorization: `Bearer ${mcToken.access_token}` },
  });
  const profile = await profileRes.json();
  if (!profile.id) throw new Error('Profil Minecraft introuvable. Minecraft acheté ?');

  return {
    access_token:  mcToken.access_token,
    refresh_token: msToken.refresh_token,
    uuid:          profile.id,
    name:          profile.name,
    skin:          profile.skins?.[0]?.url || null,
    logged_at:     Date.now(),
  };
}

// ─── Logout ────────────────────────────────────────────────────────────────
ipcMain.handle('logout', async () => {
  const s = await getStore();
  s.delete('auth');
  await session.defaultSession.clearStorageData({ storages: ['cookies', 'localstorage'] });
  mainWindow?.close();
  mainWindow = createWindow('login.html', { width: 860, height: 560, minWidth: 700, minHeight: 500 });
});

// ─── Navigate home after login ─────────────────────────────────────────────
ipcMain.handle('go-home', async () => {
  mainWindow?.close();
  mainWindow = createWindow('home.html');
});

// ─── Discord Rich Presence ─────────────────────────────────────────────────
// (nécessite discord-rpc : npm install discord-rpc)
let rpc = null;
ipcMain.handle('start-discord-rpc', async () => {
  try {
    const DiscordRPC = require('discord-rpc');
    const DISCORD_CLIENT_ID = '1234567890123456789'; // Remplace avec ton vrai App ID Discord
    DiscordRPC.register(DISCORD_CLIENT_ID);
    rpc = new DiscordRPC.Client({ transport: 'ipc' });
    rpc.on('ready', () => {
      rpc.setActivity({
        details: 'ShangriMc — Forge 1.20.1',
        state: 'Connecté au serveur',
        largeImageKey: 'shangrimc_logo',
        largeImageText: 'ShangriMc Launcher',
        startTimestamp: Date.now(),
        buttons: [{ label: 'Rejoindre le Discord', url: 'https://discord.gg/EMhW5VTqsW' }],
      });
    });
    await rpc.login({ clientId: DISCORD_CLIENT_ID });
  } catch (_) { /* Discord pas ouvert, on ignore */ }
});

// ─── Launch Minecraft ──────────────────────────────────────────────────────
ipcMain.handle('launch-game', async (event, authData) => {
  const { Client } = require('minecraft-launcher-core');
  const client = new Client();

  ensureGameDirStructure();

  const ramMax = authData.ram || '4G';
  const ramMin = ramMax === '2G' ? '1G' : '2G';

  const opts = {
    authorization: {
      access_token:    authData.access_token,
      client_token:    authData.uuid,
      uuid:            authData.uuid,
      name:            authData.name,
      user_properties: '{}',
      meta: {
        type: 'msa',
        xuid: authData.uuid,
        demo: false,
      },
    },
    root: GAME_DIR,
    version: {
      number: '1.20.1',
      type:   'release',
      custom: FORGE_CUSTOM_ID,
    },
    forge:  FORGE_JAR_PATH,
    memory: { max: ramMax, min: ramMin },
    server: { host: SERVER_HOST, port: 25565 },
    javaPath: 'java',
    customArgs: [
      '-XX:+UseG1GC',
      '-XX:+ParallelRefProcEnabled',
      '-XX:MaxGCPauseMillis=200',
      '-XX:+UnlockExperimentalVMOptions',
      '-XX:+DisableExplicitGC',
      '-XX:G1NewSizePercent=30',
      '-XX:G1MaxNewSizePercent=40',
      '-XX:G1HeapRegionSize=8M',
    ],
  };

  client.on('debug',    (e) => event.sender.send('launch-log',      `[DEBUG] ${e}`));
  client.on('data',     (e) => event.sender.send('launch-log',      `[DATA] ${e}`));
  client.on('progress', (e) => event.sender.send('launch-progress', e));
  client.on('close',   (code) => event.sender.send('launch-closed', code));

  try {
    await client.launch(opts);
    event.sender.send('launch-started');
  } catch (err) {
    event.sender.send('launch-error', err.message);
  }
});

// ─── Check Forge installer ─────────────────────────────────────────────────
ipcMain.handle('check-forge', async () => {
  return {
    forgePath: FORGE_JAR_PATH,
    forgeVersion: FORGE_VERSION,
    exists:    fs.existsSync(FORGE_JAR_PATH),
    gameDir:   GAME_DIR,
  };
});

// ─── Open URL in default browser ───────────────────────────────────────────
ipcMain.handle('open-external', async (_, url) => {
  const { shell } = require('electron');
  await shell.openExternal(url);
});

// ─── Téléchargement mods depuis GitHub releases ────────────────────────────
// Place un fichier mods-manifest.json dans ton repo GitHub avec la liste des mods
// Format: { "version": "1.0.0", "mods": [{ "name": "mod.jar", "url": "...", "size": 12345 }] }
const MODS_MANIFEST_URL = 'https://raw.githubusercontent.com/kogareyli/shangrimclauncher/main/mods-manifest.json';

ipcMain.handle('check-mods-update', async (event) => {
  try {
    const nodeFetch = await import('node-fetch');
    const fetch = nodeFetch.default;

    // Récupère le manifest distant
    const res = await fetch(MODS_MANIFEST_URL, { timeout: 5000 });
    if (!res.ok) return { upToDate: true, message: 'Manifest non trouvable, passage en local.' };

    const manifest = await res.json();
    const gameModsDir = path.join(GAME_DIR, 'mods');
    ensureGameDirStructure();

    const localMods  = fs.existsSync(gameModsDir)
      ? fs.readdirSync(gameModsDir).filter(f => f.endsWith('.jar'))
      : [];

    const missing = manifest.mods.filter(m => !localMods.includes(m.name));
    if (missing.length === 0) return { upToDate: true, total: manifest.mods.length };

    // Télécharge les mods manquants
    let downloaded = 0;
    for (const mod of missing) {
      event.sender.send('mod-download-progress', {
        name: mod.name,
        current: downloaded,
        total: missing.length,
      });
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

// ─── Game directory structure setup ────────────────────────────────────────
function ensureGameDirStructure() {
  const dirs = ['mods', 'config', 'resourcepacks', 'shaderpacks', 'screenshots', 'saves'];
  for (const d of dirs) {
    const dirPath = path.join(GAME_DIR, d);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ─── Mod sync: copies mods from launcher/mods/ → .shangrimc/mods/ ──────────
ipcMain.handle('sync-mods', async () => {
  const launcherModsDir = path.join(__dirname, 'mods');
  const gameModsDir     = path.join(GAME_DIR, 'mods');

  if (!fs.existsSync(launcherModsDir)) {
    fs.mkdirSync(launcherModsDir, { recursive: true });
    return { added: [], removed: [], total: 0, message: 'Dossier mods/ créé. Ajoutes tes mods dedans !' };
  }

  ensureGameDirStructure();

  const launcherMods = fs.readdirSync(launcherModsDir).filter(f => f.endsWith('.jar'));
  const gameMods     = fs.readdirSync(gameModsDir).filter(f => f.endsWith('.jar'));

  const added   = [];
  const removed = [];

  // Add/update mods from launcher to game dir
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

  // Remove mods in game dir that are NOT in launcher mods dir
  for (const mod of gameMods) {
    if (!launcherMods.includes(mod)) {
      fs.unlinkSync(path.join(gameModsDir, mod));
      removed.push(mod);
    }
  }

  return { added, removed, total: launcherMods.length, message: 'Synchronisation terminée.' };
});

// ─── Open launcher mods directory ──────────────────────────────────────────
ipcMain.handle('open-mods-dir', async () => {
  const { shell } = require('electron');
  const launcherModsDir = path.join(__dirname, 'mods');
  if (!fs.existsSync(launcherModsDir)) fs.mkdirSync(launcherModsDir, { recursive: true });
  shell.openPath(launcherModsDir);
});

// ─── Settings: RAM persistent ──────────────────────────────────────────────
ipcMain.handle('get-setting', async (_, key) => {
  const s = await getStore();
  return s.get(`setting.${key}`) || null;
});
ipcMain.handle('set-setting', async (_, key, value) => {
  const s = await getStore();
  s.set(`setting.${key}`, value);
});

// ─── Open game directory in file explorer ──────────────────────────────────
ipcMain.handle('open-game-dir', async () => {
  const { shell } = require('electron');
  if (!fs.existsSync(GAME_DIR)) fs.mkdirSync(GAME_DIR, { recursive: true });
  shell.openPath(GAME_DIR);
});
