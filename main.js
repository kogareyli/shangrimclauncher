const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const { Auth } = require('msmc');
const path    = require('path');
const os      = require('os');
const fs      = require('fs');

// ─── Nom de l'app ─────────────────────────────────────────────────────────────
app.setName('ShangriMc');
if (process.platform === 'win32') app.setAppUserModelId('ShangriMc Launcher');

// ─── Config ───────────────────────────────────────────────────────────────────
const SERVER_HOST = 'vocalist-submission.gl.joinmc.link';
const GAME_DIR    = path.join(os.homedir(), 'AppData', 'Roaming', '.shangrimc');

// En mode packagé les ressources sont dans process.resourcesPath
const RES_PATH  = app.isPackaged ? process.resourcesPath : __dirname;
const ICON_PATH = path.join(RES_PATH, 'assets', 'icon.ico');

// Forge
const FORGE_VERSION   = '47.4.18';
const FORGE_JAR_NAME  = `forge-1.20.1-${FORGE_VERSION}-installer.jar`;
const FORGE_JAR_PATH  = path.join(RES_PATH, FORGE_JAR_NAME);
const FORGE_CUSTOM_ID = `1.20.1-forge-${FORGE_VERSION}`;

// ─── Versioning mods + configs ────────────────────────────────────────────────
// ⚠️  Pour mettre à jour les mods    : change MODS_VERSION
//     Pour mettre à jour les configs : change CONFIG_VERSION
//     Tous les joueurs re-téléchargeront automatiquement
const MODS_VERSION   = '1.4';
const CONFIG_VERSION = '1.0';
const MODS_ZIP_URL   = 'https://github.com/kogareyli/shangrimclauncher/releases/download/mods-latest/shangrimc-mods.zip';

// Shaders + Texture packs
const EXTRA_PACKS = [
  { url: 'https://github.com/kogareyli/shangrimclauncher/releases/download/mods-latest/DetailedAnimationsReworked%20-%20V1.15.zip', dir: 'resourcepacks' },
  { url: 'https://github.com/kogareyli/shangrimclauncher/releases/download/mods-latest/Enhanced%20Audio%20r6.zip',                  dir: 'resourcepacks' },
  { url: 'https://github.com/kogareyli/shangrimclauncher/releases/download/mods-latest/Fresh%20Skeleton%20Physics.zip',             dir: 'resourcepacks' },
  { url: 'https://github.com/kogareyli/shangrimclauncher/releases/download/mods-latest/Nature%20X%20-%2012.2%20%5B1.20.1%5D.zip',  dir: 'resourcepacks' },
  { url: 'https://github.com/kogareyli/shangrimclauncher/releases/download/mods-latest/Nautilus3D_V1.9_%5BMC-1.13%2B%5D.zip',      dir: 'resourcepacks' },
  { url: 'https://github.com/kogareyli/shangrimclauncher/releases/download/mods-latest/BSL_v8.4.zip',                               dir: 'shaderpacks'   },
  { url: 'https://github.com/kogareyli/shangrimclauncher/releases/download/mods-latest/ComplementaryReimagined_r5.7.1.zip',         dir: 'shaderpacks'   },
];

let Store, store, mainWindow;

// ─── Store ────────────────────────────────────────────────────────────────────
async function getStore() {
  if (!store) {
    Store = (await import('electron-store')).default;
    store = new Store({ name: 'shangrimc-auth' });
  }
  return store;
}

// ─── Fenêtre factory ──────────────────────────────────────────────────────────
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

// ─── Auto-update ──────────────────────────────────────────────────────────────
function setupAutoUpdater() {
  // ── electron-updater (téléchargement + install auto) ──────────────────────
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.autoDownload         = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.logger               = null;
    autoUpdater.on('update-available',  (info) => {
      mainWindow?.webContents.send('update-available', info.version);
    });
    autoUpdater.on('update-downloaded', () => {
      mainWindow?.webContents.send('update-downloaded');
    });
    autoUpdater.on('error', () => {
      // Fallback: check GitHub API manuellement
      checkUpdateFallback();
    });
    setTimeout(() => autoUpdater.checkForUpdates(), 3000);
  } catch (_) {
    setTimeout(checkUpdateFallback, 3000);
  }
}

// ─── Fallback: vérifie GitHub API si electron-updater plante ─────────────────
async function checkUpdateFallback() {
  try {
    const { default: fetch } = await import('node-fetch');
    const res  = await fetch(
      'https://api.github.com/repos/kogareyli/shangrimclauncher/releases/latest',
      { headers: { 'User-Agent': 'ShangriMc-Launcher' }, timeout: 8000 }
    );
    if (!res.ok) return;
    const data     = await res.json();
    const tagName  = data.tag_name || '';
    const latest   = tagName.replace(/^v/, '');
    // Ignore les tags non-version (ex: mods-latest, vmods-latest)
    if (!/^\d+\.\d+/.test(latest)) return;
    const installed = app.getVersion();
    if (latest !== installed) {
      mainWindow?.webContents.send('update-available', latest);
    }
  } catch (_) {}
}

// ─── App ready ────────────────────────────────────────────────────────────────
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

// ─── Window controls ──────────────────────────────────────────────────────────
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('window-close', () => mainWindow?.close());

// ─── Auth: get saved profile ──────────────────────────────────────────────────
ipcMain.handle('get-auth', async () => {
  const s = await getStore();
  return s.get('auth') || null;
});

// ─── Auth Microsoft via msmc ──────────────────────────────────────────────────
ipcMain.handle('microsoft-login', async () => {
  try {
    const authManager = new Auth('select_account');
    const redirect = authManager.token.redirect;
    authManager.createLink = () =>
      `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize` +
      `?client_id=${authManager.token.client_id}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirect)}` +
      `&scope=XboxLive.signin%20offline_access` +
      `&prompt=select_account`;

    const xboxManager = await authManager.launch('electron', {
      width: 480, height: 660, parent: mainWindow, modal: true,
      backgroundColor: '#07070f',
      title: 'Connexion — ShangriMc',
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

// ─── Détection automatique de Java ───────────────────────────────────────────
function findJava() {
  // 1. Variable d'environnement JAVA_HOME
  if (process.env.JAVA_HOME) {
    const p = path.join(process.env.JAVA_HOME, 'bin', 'java.exe');
    if (fs.existsSync(p)) return p;
  }
  // 2. Emplacements courants sur Windows
  const bases = [
    'C:\\Program Files\\Java',
    'C:\\Program Files\\Eclipse Adoptium',
    'C:\\Program Files\\Microsoft',
    'C:\\Program Files\\Zulu',
    'C:\\Program Files\\Amazon Corretto',
  ];
  for (const base of bases) {
    if (!fs.existsSync(base)) continue;
    const dirs = fs.readdirSync(base).filter(d => /jdk|jre/i.test(d)).sort().reverse();
    for (const dir of dirs) {
      const p = path.join(base, dir, 'bin', 'java.exe');
      if (fs.existsSync(p)) return p;
    }
  }
  // 3. Fallback PATH
  return 'java';
}

// ─── Launch Minecraft ─────────────────────────────────────────────────────────
ipcMain.handle('launch-game', async (event, authData) => {
  const { Client } = require('minecraft-launcher-core');
  const client = new Client();
  ensureGameDirStructure();

  const ramMax   = authData.ram || '4G';
  const ramMin   = ramMax === '2G' ? '1G' : '2G';
  const javaPath = findJava();

  event.sender.send('launch-log', `[INFO] Java: ${javaPath}`);
  event.sender.send('launch-log', `[INFO] Forge JAR: ${FORGE_JAR_PATH}`);
  event.sender.send('launch-log', `[INFO] Game dir: ${GAME_DIR}`);

  const opts = {
    authorization: authData.mclc || {
      access_token: authData.access_token,
      client_token: authData.uuid,
      uuid:         authData.uuid,
      name:         authData.name,
      user_properties: '{}',
      meta: { type: 'msa', xuid: authData.uuid, demo: false },
    },
    root:    GAME_DIR,
    version: { number: '1.20.1', type: 'release', custom: FORGE_CUSTOM_ID },
    forge:   FORGE_JAR_PATH,
    memory:  { max: ramMax, min: ramMin },
    server:  { host: SERVER_HOST, port: 25565 },
    javaPath,
    customArgs: [
      '-XX:+UseG1GC', '-XX:+ParallelRefProcEnabled',
      '-XX:MaxGCPauseMillis=200', '-XX:+UnlockExperimentalVMOptions',
      '-XX:+DisableExplicitGC', '-XX:G1NewSizePercent=30',
      '-XX:G1MaxNewSizePercent=40', '-XX:G1HeapRegionSize=8M',
    ],
    window: { title: 'ShangriMc' },
  };

  client.on('debug',    (e) => event.sender.send('launch-log',      `[DEBUG] ${e}`));
  client.on('data',     (e) => event.sender.send('launch-log',      `[DATA] ${e}`));
  client.on('progress', (e) => event.sender.send('launch-progress', e));
  client.on('close',   (c)  => event.sender.send('launch-closed',   c));

  try {
    await client.launch(opts);
    event.sender.send('launch-started');

    // Renomme la fenetre Minecraft en "ShangriMc" via PowerShell
    const { spawn } = require('child_process');
    const psScript = `
$timeout = 120
$start = Get-Date
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class WinAPI {
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern bool SetWindowText(IntPtr hWnd, string text);
}
"@
while (((Get-Date) - $start).TotalSeconds -lt $timeout) {
    $procs = Get-Process -Name java -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -ne "" }
    foreach ($p in $procs) {
        [WinAPI]::SetWindowText($p.MainWindowHandle, "ShangriMc")
    }
    Start-Sleep -Milliseconds 1000
}
`;
    spawn('powershell', ['-Command', psScript], {
      detached: true, stdio: 'ignore', windowsHide: true
    }).unref();

  } catch (err) {
    event.sender.send('launch-error', err.message);
  }
});

// ─── Check Forge ──────────────────────────────────────────────────────────────
ipcMain.handle('check-forge', async () => ({
  forgePath:    FORGE_JAR_PATH,
  forgeVersion: FORGE_VERSION,
  exists:       fs.existsSync(FORGE_JAR_PATH),
  gameDir:      GAME_DIR,
}));

// ─── Open URL in browser ──────────────────────────────────────────────────────
ipcMain.handle('open-external', async (_, url) => shell.openExternal(url));

// ─── Check install state ──────────────────────────────────────────────────────
// Retourne { state: 'ready' | 'update' | 'install' }
ipcMain.handle('check-installed', async () => {
  const s        = await getStore();
  const savedVer = s.get('mods_version') || null;

  // Vérifie mods
  const gameModsDir = path.join(GAME_DIR, 'mods');
  const hasMods     = fs.existsSync(gameModsDir) &&
    fs.readdirSync(gameModsDir).filter(f => f.endsWith('.jar')).length > 0;

  // Les configs FancyMenu sont gérées séparément (pas via zip download)
  ensureFancyMenuConfig();

  if (!hasMods)                  return { state: 'install' };
  if (savedVer !== MODS_VERSION) return { state: 'update'  };
  return                                { state: 'ready'   };
});

// ─── Install tout (mods + shaders + textures) ─────────────────────────────────
ipcMain.handle('install-all', async (event) => {
  const AdmZip             = require('adm-zip');
  const { default: fetch } = await import('node-fetch');
  ensureGameDirStructure();

  const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Referer':    'https://pixeldrain.com/',
    'Origin':     'https://pixeldrain.com',
  };

  const results = { mods: false, packs: 0, totalPacks: EXTRA_PACKS.length, errors: [] };
  const s       = await getStore();

  // ── 1. Mods ──────────────────────────────────────────────────────────────
  const gameModsDir = path.join(GAME_DIR, 'mods');
  const savedVer    = s.get('mods_version') || null;
  const needsUpdate = savedVer !== MODS_VERSION;
  const localMods   = fs.existsSync(gameModsDir)
    ? fs.readdirSync(gameModsDir).filter(f => f.endsWith('.jar'))
    : [];

  if (localMods.length === 0 || needsUpdate) {
    try {
      event.sender.send('install-progress', { pct: 2, message: 'Telechargement des mods…' });
      const res = await fetch(MODS_ZIP_URL, { timeout: 180000, headers: BROWSER_HEADERS });
      if (!res.ok) throw new Error(`Pixeldrain HTTP ${res.status} - URL invalide ou fichier supprime`);

      const total  = parseInt(res.headers.get('content-length') || '0', 10);
      const chunks = []; let received = 0;
      for await (const chunk of res.body) {
        chunks.push(chunk); received += chunk.length;
        const pct = 2 + (total > 0 ? Math.round((received / total) * 28) : 0);
        event.sender.send('install-progress', {
          pct, message: `Mods… ${(received / 1024 / 1024).toFixed(1)} Mo / ${(total / 1024 / 1024).toFixed(1)} Mo`,
        });
      }

      // Telechargement OK → maintenant on supprime les anciens mods
      if (needsUpdate && localMods.length > 0) {
        event.sender.send('install-progress', { pct: 30, message: 'Suppression des anciens mods…' });
        for (const f of localMods) {
          try { fs.unlinkSync(path.join(gameModsDir, f)); } catch (_) {}
        }
      }

      const buf     = Buffer.concat(chunks);
      const zip     = new AdmZip(buf);
      const entries = zip.getEntries().filter(e => !e.isDirectory && e.entryName.endsWith('.jar'));
      if (entries.length === 0) throw new Error(`Le zip ne contient aucun .jar (${(buf.length/1024/1024).toFixed(1)} Mo telechargé)`);
      entries.forEach(e => zip.extractEntryTo(e, gameModsDir, false, true));

      // Extraire config/ (FancyMenu layouts, etc.) si present dans le zip
      const configEntries = zip.getEntries().filter(e => !e.isDirectory && e.entryName.startsWith('config/'));
      for (const e of configEntries) {
        const destPath = path.join(GAME_DIR, e.entryName);
        const destDir  = path.dirname(destPath);
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
        fs.writeFileSync(destPath, e.getData());
      }
      if (configEntries.length > 0) {
        event.sender.send('install-progress', { pct: 32, message: `Configs installes (${configEntries.length} fichiers)` });
      }

      event.sender.send('install-progress', { pct: 32, message: `${entries.length} mods extraits !` });
      results.mods = true;
    } catch (e) { results.errors.push(`Mods: ${e.message}`); }
  } else {
    results.mods = true;
  }

  // ── 2. Texture packs + Shaders (installe une seule fois, pas reverifie) ──
  let packIdx = 0;
  for (const pack of EXTRA_PACKS) {
    packIdx++;
    const destDir = path.join(GAME_DIR, pack.dir);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    try {
      const head = await fetch(pack.url, { method: 'HEAD', timeout: 10000, headers: BROWSER_HEADERS });
      const cd   = head.headers.get('content-disposition') || '';
      const nameMatch = cd.match(/filename="?([^";]+)"?/);
      const filename  = nameMatch ? nameMatch[1] : `pack_${packIdx}.zip`;

      if (fs.existsSync(path.join(destDir, filename))) { results.packs++; continue; }

      const pctBase = 30 + Math.round((packIdx / EXTRA_PACKS.length) * 65);
      event.sender.send('install-progress', {
        pct: pctBase,
        message: `${pack.dir === 'shaderpacks' ? 'Shader' : 'Texture'} ${packIdx}/${EXTRA_PACKS.length}…`,
      });

      const res = await fetch(pack.url, { timeout: 120000, headers: BROWSER_HEADERS });
      if (!res.ok) throw new Error(`Pack ${packIdx}: ${res.status}`);
      const buf = Buffer.concat(
        await (async () => { const c = []; for await (const ch of res.body) c.push(ch); return c; })()
      );
      fs.writeFileSync(path.join(destDir, filename), buf);
      results.packs++;
    } catch (e) { results.errors.push(e.message); }
  }

  // ── 3. Sauvegarde version mods + serveur ─────────────────────────────────
  if (results.mods) s.set('mods_version', MODS_VERSION);
  try { writeServersDat(); } catch (_) {}

  event.sender.send('install-progress', { pct: 100, message: '✅ Installation terminée !' });
  return results;
});

// ─── Écrit servers.dat (serveur ShangriMc pré-enregistré) ────────────────────
function writeServersDat() {
  const serversDat = path.join(GAME_DIR, 'servers.dat');

  function nbtStr(name, value) {
    const nb = Buffer.from(name,  'utf8');
    const vb = Buffer.from(value, 'utf8');
    const buf = Buffer.alloc(1 + 2 + nb.length + 2 + vb.length);
    let i = 0;
    buf[i++] = 0x08;
    buf.writeUInt16BE(nb.length, i); i += 2;
    nb.copy(buf, i); i += nb.length;
    buf.writeUInt16BE(vb.length, i); i += 2;
    vb.copy(buf, i);
    return buf;
  }

  function nbtByte(name, value) {
    const nb = Buffer.from(name, 'utf8');
    const buf = Buffer.alloc(1 + 2 + nb.length + 1);
    let i = 0;
    buf[i++] = 0x01;
    buf.writeUInt16BE(nb.length, i); i += 2;
    nb.copy(buf, i); i += nb.length;
    buf[i] = value & 0xff;
    return buf;
  }

  const entry = Buffer.concat([
    nbtStr('ip',   SERVER_HOST),
    nbtStr('name', 'ShangriMc'),
    nbtByte('acceptTextures', 1),
    Buffer.from([0x00]),
  ]);

  const listName   = Buffer.from('servers', 'utf8');
  const listHeader = Buffer.alloc(1 + 2 + listName.length + 1 + 4);
  let i = 0;
  listHeader[i++] = 0x09;
  listHeader.writeUInt16BE(listName.length, i); i += 2;
  listName.copy(listHeader, i); i += listName.length;
  listHeader[i++] = 0x0a;
  listHeader.writeUInt32BE(1, i);

  const root = Buffer.from([0x0a, 0x00, 0x00]);
  fs.writeFileSync(serversDat, Buffer.concat([root, listHeader, entry, Buffer.from([0x00])]));
}

// ─── Game directory setup ─────────────────────────────────────────────────────
function ensureGameDirStructure() {
  for (const d of ['mods', 'config', 'resourcepacks', 'shaderpacks', 'screenshots', 'saves']) {
    const p = path.join(GAME_DIR, d);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }
}

// ─── FancyMenu : écrit les configs directement (sans download) ────────────────
// Pour mettre à jour : modifie le contenu des constantes ci-dessous
// CONFIG_VERSION sert uniquement à forcer la réécriture si le contenu change
function ensureFancyMenuConfig() {
  const configDir  = path.join(GAME_DIR, 'config', 'fancymenu');
  const layoutsDir = path.join(configDir, 'layouts');
  if (!fs.existsSync(layoutsDir)) fs.mkdirSync(layoutsDir, { recursive: true });

  const LAYOUT_CONTENT = `{
type = layout-meta
fancymenu_layout = shangrimc_title
screen = net.minecraft.client.gui.screens.TitleScreen
last_edited_time = 1715000000000
is_enabled = true
}

{
type = menu_background
background_type = color
color = #000d1a
}

{
type = element
element_type = vanilla_button
instance_identifier = vanillabtn:mc_titlescreen_singleplayer_button
is_hidden = true
}

{
type = element
element_type = vanilla_button
instance_identifier = vanillabtn:mc_titlescreen_multiplayer_button
is_hidden = true
}

{
type = element
element_type = vanilla_button
instance_identifier = vanillabtn:mc_titlescreen_realms_button
is_hidden = true
}

{
type = element
element_type = vanilla_button
instance_identifier = vanillabtn:mc_titlescreen_options_button
is_hidden = true
}

{
type = element
element_type = vanilla_button
instance_identifier = vanillabtn:mc_titlescreen_quit_button
is_hidden = true
}

{
type = element
element_type = vanilla_button
instance_identifier = vanillabtn:mc_titlescreen_language_button
is_hidden = true
}

{
type = element
element_type = vanilla_button
instance_identifier = vanillabtn:mc_titlescreen_accessibility_button
is_hidden = true
}

{
type = element
element_type = vanilla_button
instance_identifier = vanillabtn:forge_titlescreen_mods_button
is_hidden = true
}

{
type = element
element_type = custom_button
instance_identifier = shangrimc_btn_join
anchor_point = MID_RIGHT
posOffsetX = -300
posOffsetY = -80
width = 220
height = 32
label = Rejoindre
button_element_executable_block_identifier = exec_shangrimc_btn_join
[executable_block:exec_shangrimc_btn_join][type:generic] =
[executables:exec_shangrimc_btn_join] = $prop_brackets_open$$prop_line_break$type = joinserver$prop_line_break$value = vocalist-submission.gl.joinmc.link:25565$prop_line_break$$prop_brackets_close$
}

{
type = element
element_type = custom_button
instance_identifier = shangrimc_btn_options
anchor_point = MID_RIGHT
posOffsetX = -300
posOffsetY = -36
width = 220
height = 32
label = Options
button_element_executable_block_identifier = exec_shangrimc_btn_options
[executable_block:exec_shangrimc_btn_options][type:generic] =
[executables:exec_shangrimc_btn_options] = $prop_brackets_open$$prop_line_break$type = opengui$prop_line_break$value = net.minecraft.client.gui.screens.OptionsScreen$prop_line_break$$prop_brackets_close$
}

{
type = element
element_type = custom_button
instance_identifier = shangrimc_btn_quit
anchor_point = MID_RIGHT
posOffsetX = -300
posOffsetY = 16
width = 220
height = 32
label = Quitter
button_element_executable_block_identifier = exec_shangrimc_btn_quit
[executable_block:exec_shangrimc_btn_quit][type:generic] =
[executables:exec_shangrimc_btn_quit] = $prop_brackets_open$$prop_line_break$type = quitgame$prop_line_break$$prop_brackets_close$
}
`;

  const OPTIONS_CONTENT = `{
type = general
play_vanilla_menu_music = false
}

{
type = customization
show_customization_overlay = false
modpack_mode = true
advanced_customization_mode = false
}

{
type = tutorial
show_welcome_screen = false
}
`;

  // Écrit layout (toujours mis à jour selon CONFIG_VERSION)
  const layoutFile  = path.join(layoutsDir, 'shangrimc_title.txt');
  const markerFile  = path.join(configDir, '.launcher_config_version');
  const savedCfgVer = fs.existsSync(markerFile) ? fs.readFileSync(markerFile, 'utf8').trim() : null;

  if (!fs.existsSync(layoutFile) || savedCfgVer !== CONFIG_VERSION) {
    fs.writeFileSync(layoutFile, LAYOUT_CONTENT, 'utf8');
    const optFile = path.join(configDir, 'options.txt');
    if (!fs.existsSync(optFile)) {  // options: ne pas écraser si le joueur a modifié
      fs.writeFileSync(optFile, OPTIONS_CONTENT, 'utf8');
    }
    fs.writeFileSync(markerFile, CONFIG_VERSION, 'utf8');
  }
}

// ─── Open mods dir ────────────────────────────────────────────────────────────
ipcMain.handle('open-mods-dir', async () => {
  const d = path.join(GAME_DIR, 'mods');
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  shell.openPath(d);
});

// ─── Sync mods (copie depuis <launcher>/mods/ → .shangrimc/mods/) ─────────────
ipcMain.handle('sync-mods', async () => {
  // Dossier source : mods/ à côté du launcher (ou dans resourcesPath si packagé)
  const srcDir  = path.join(RES_PATH, 'mods');
  const destDir = path.join(GAME_DIR, 'mods');
  if (!fs.existsSync(srcDir)) return { copied: 0 };
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.jar'));
  let copied = 0;
  for (const f of files) {
    const dest = path.join(destDir, f);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(path.join(srcDir, f), dest);
      copied++;
    }
  }
  return { copied };
});

// ─── List installed mods ──────────────────────────────────────────────────────
ipcMain.handle('get-installed-mods', async () => {
  const gameModsDir = path.join(GAME_DIR, 'mods');
  if (!fs.existsSync(gameModsDir)) return [];
  return fs.readdirSync(gameModsDir)
    .filter(f => f.endsWith('.jar'))
    .map(f => {
      const name = f
        .replace(/\.jar$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/\s+\d[\d.\-]+.*$/, '')
        .replace(/\b\w/g, c => c.toUpperCase());
      return { file: f, name };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
});

// ─── Settings ─────────────────────────────────────────────────────────────────
ipcMain.handle('get-setting', async (_, key) => {
  const s = await getStore();
  return s.get(`setting.${key}`) || null;
});
ipcMain.handle('set-setting', async (_, key, value) => {
  const s = await getStore();
  s.set(`setting.${key}`, value);
});

// ─── Open game dir ────────────────────────────────────────────────────────────
ipcMain.handle('open-game-dir', async () => {
  if (!fs.existsSync(GAME_DIR)) fs.mkdirSync(GAME_DIR, { recursive: true });
  shell.openPath(GAME_DIR);
});

// ─── Go Home ──────────────────────────────────────────────────────────────────
ipcMain.handle('go-home', async () => {
  const prevWin = mainWindow;
  mainWindow = createWindow('home.html');
  mainWindow.once('ready-to-show', () => {
    if (prevWin && !prevWin.isDestroyed()) prevWin.close();
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
ipcMain.handle('logout', async () => {
  const s = await getStore();
  s.delete('auth');
  const oldWin = mainWindow;
  mainWindow = createWindow('login.html', { width: 860, height: 560, minWidth: 700, minHeight: 500 });
  if (oldWin && !oldWin.isDestroyed()) oldWin.close();
});

// ─── Restart & install update ─────────────────────────────────────────────────
ipcMain.on('restart-and-update', () => {
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.quitAndInstall();
  } catch (_) {}
});

// ─── Discord RPC ──────────────────────────────────────────────────────────────
ipcMain.handle('start-discord-rpc', async () => {
  try {
    const RPC = require('discord-rpc');
    const rpc = new RPC.Client({ transport: 'ipc' });
    rpc.on('ready', () => {
      rpc.setActivity({
        details: 'Sur le serveur ShangriMc',
        state:   'Forge 1.20.1',
        largeImageKey: 'logo', largeImageText: 'ShangriMc',
        startTimestamp: Date.now(), instance: false,
      });
    });
    await rpc.login({ clientId: '1234567890123456789' });
  } catch (_) {}
});
