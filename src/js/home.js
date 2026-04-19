/* Home renderer — ShangriMc Launcher */
const api = window.shangrimc;

// ── Mod list ─────────────────────────────────────────────────────────────
const MODS = [
  { name: 'Aesthetic Windows',         ver: '1.20.1 v2.0.1' },
  { name: 'AI Improvements',           ver: '1.20 0.5.2' },
  { name: 'Alcocraft Plus',            ver: '1.20 2.1.0' },
  { name: "Alex's Mobs",               ver: '1.22.9' },
  { name: 'Apotheosis',                ver: '1.20.1 7.4.8' },
  { name: 'Apothic Attributes',        ver: '1.20.1 1.3.7' },
  { name: 'Architectury',              ver: '9.2.14' },
  { name: "Armourer's Workshop",       ver: '1.20.1 3.2.7-beta' },
  { name: 'Artifacts',                 ver: '9.5.16' },
  { name: 'Auroras',                   ver: '1.20.1 1.6.2' },
  { name: 'AutoSave',                  ver: '1.0' },
  { name: 'Balm',                      ver: '1.20.1 7.3.38' },
  { name: 'Better Combat',             ver: '1.9.0+1.20.1' },
  { name: 'Better Fruits',             ver: '1.20.1' },
  { name: 'Biome Music',               ver: '1.20.1 3.5' },
  { name: 'Biomes O Plenty',           ver: '1.20.1 19.0.0.96' },
  { name: 'Blossom',                   ver: 'latest' },
  { name: 'Celestisynth',              ver: '1.20.1 1.3.4' },
  { name: 'Citadel',                   ver: '1.20.1 2.6.3' },
  { name: 'Cloth Config',              ver: '11.1.136' },
  { name: 'Collective',                ver: '1.20.1 8.13' },
  { name: 'Croptopia',                 ver: '1.20.1 3.0.4' },
  { name: 'Croptopia Additions',       ver: '1.20.1 2.4' },
  { name: 'Curios API',                ver: '5.14.1' },
  { name: 'Custom Player Models',      ver: '1.20 0.6.25a' },
  { name: 'Decorative Blocks',         ver: '1.20.1 4.1.3' },
  { name: 'Dungeons Arise Seven Seas', ver: '1.20.x 1.0.2' },
  { name: 'Dusty Decorations',         ver: '1.20.1 V1.12.1' },
  { name: 'Easy NPC',                  ver: '1.20.1 6.11.0' },
  { name: 'Ecologics',                 ver: '1.20.1 2.2.4' },
  { name: 'Enhanced Boss Bars',        ver: '1.20.1 1.0.0' },
  { name: 'Epic Fight',                ver: '20.14.14 1.20.1' },
  { name: 'Epic PArCool',              ver: '20.12.0.1' },
  { name: 'Fancy Menu',                ver: '2.14.7' },
  { name: 'Fantasy Armor',             ver: '1.2.3' },
  { name: 'FerriteCore',               ver: '6.0.1' },
  { name: 'FTB Quests',                ver: '2001.4.18' },
  { name: 'GeckoLib',                  ver: '1.20.1 4.8.3' },
  { name: 'Handcrafted',               ver: '1.20.1 3.0.6' },
  { name: 'Immersive Lanterns',        ver: '1.0.6' },
  { name: 'JEI',                       ver: '1.20.1 15.20.0.129' },
  { name: "L_Ender's Cataclysm",      ver: '3.26' },
  { name: "Let's Do Bakery",           ver: '1.1.15' },
  { name: "Let's Do Brewery",          ver: '1.1.9' },
  { name: "Let's Do Furniture",        ver: '1.0.4' },
  { name: 'LuckPerms',                 ver: '5.4.102' },
  { name: "Luki's Grand Capitals",     ver: '1.1.3' },
  { name: 'MCW Lights',                ver: '1.1.5' },
  { name: 'MCW Fences',                ver: '1.2.1' },
  { name: 'ModernFix',                 ver: '5.26.2' },
  { name: 'Nether Portal Fix',         ver: '13.0.1' },
  { name: 'Oculus',                    ver: '1.20.1 1.8.0' },
  { name: 'Open Parties & Claims',     ver: '0.25.10' },
  { name: 'ParCool',                   ver: '1.20.1 3.4.3.3' },
  { name: 'Particular',                ver: '1.20.1 1.2.7' },
  { name: 'Placebo',                   ver: '1.20.1 8.6.3' },
  { name: 'Regions Unexplored',        ver: '0.5.6' },
  { name: 'ShangriMC',                 ver: '1.0.2 1.20.1' },
  { name: 'Skin Layers 3D',            ver: '1.11.0' },
  { name: 'Sodium Dynamic Lights',     ver: '1.0.10' },
  { name: 'Sound Physics Remastered',  ver: '1.4.10' },
  { name: 'Structory',                 ver: '1.20.x 1.3.5' },
  { name: 'TerraBlender',              ver: '1.20.1 3.0.1.10' },
  { name: 'Terralith',                 ver: '1.20.x 2.5.4' },
  { name: 'Tidal Towns',               ver: '1.3.4' },
  { name: 'Too Many Bows',             ver: '4.0.1' },
  { name: "Traveler's Backpack",       ver: '1.20.1 9.1.53' },
  { name: 'Simple Voice Chat',         ver: '1.20.1 2.6.14' },
  { name: 'Waystones',                 ver: '1.20.1 14.1.20' },
  { name: 'Weapon Master',             ver: '1.20.1 4.2.3' },
  { name: 'WorldEdit',                 ver: '7.2.15' },
  { name: 'Xaero World Map',           ver: '1.40.11' },
  { name: "YUNG's Better Desert Temples", ver: '3.0.3' },
  { name: "YUNG's API",               ver: '4.0.6' },
  { name: 'Medieval Music',            ver: '1.20.1 2.2' },
];

// ── State ─────────────────────────────────────────────────────────────────
let auth     = null;
let ramValue = '4G';
let launched = false;

// ── Stars ─────────────────────────────────────────────────────────────────
(function initStars() {
  const canvas = document.getElementById('stars');
  const ctx    = canvas.getContext('2d');
  let stars    = [];

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }

  function spawn(n) {
    for (let i = 0; i < n; i++) {
      stars.push({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        r:  Math.random() * 1.2 + 0.2,
        a:  Math.random(),
        da: (Math.random() - 0.5) * 0.002,
        vx: (Math.random() - 0.5) * 0.04,
        vy: (Math.random() - 0.5) * 0.04,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.a = Math.max(0.05, Math.min(1, s.a + s.da));
      if (s.a <= 0.05 || s.a >= 1) s.da *= -1;
      s.x += s.vx; s.y += s.vy;
      if (s.x < 0) s.x = canvas.width; if (s.x > canvas.width) s.x = 0;
      if (s.y < 0) s.y = canvas.height; if (s.y > canvas.height) s.y = 0;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(190,190,255,${s.a})`; ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  resize(); spawn(220); draw();
  window.addEventListener('resize', () => { resize(); stars = []; spawn(220); });
})();

// ── Floating particles canvas ─────────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx    = canvas.getContext('2d');
  let particles = [];

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }

  function spawnParticle() {
    const hue = Math.random() < 0.6 ? 260 : 220;
    particles.push({
      x:  Math.random() * canvas.width,
      y:  canvas.height + 10,
      r:  Math.random() * 3 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(Math.random() * 0.6 + 0.3),
      a:  Math.random() * 0.5 + 0.3,
      da: -0.002,
      hue,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.a > 0 && p.y > -10);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.a += p.da;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},80%,70%,${p.a})`;
      ctx.fill();
    }
    if (Math.random() < 0.08) spawnParticle();
    requestAnimationFrame(draw);
  }
  resize(); draw();
  window.addEventListener('resize', resize);
})();

// ── Animated block hero (SUNRISE-style) ───────────────────────────────────
(function initHero() {
  const container = document.getElementById('hero-blocks');
  const PALETTES = [
    ['#1a2a5e','#1e3a8a','#1d4ed8','#2563eb','#3b82f6','#60a5fa'],
    ['#4c1d95','#5b21b6','#6d28d9','#7c3aed','#8b5cf6','#a78bfa'],
    ['#134e4a','#115e59','#0f766e','#0d9488','#14b8a6','#2dd4bf'],
    ['#1e1b4b','#312e81','#3730a3','#4338ca','#4f46e5','#6366f1'],
  ];

  const cols = 22, rows = 13;
  const blocks = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const el = document.createElement('div');
      el.className = 'hero-block';
      const palette = PALETTES[Math.floor(Math.random() * PALETTES.length)];
      const color   = palette[Math.floor(Math.random() * palette.length)];
      el.style.background = color;
      const baseOpacity = Math.random() * 0.5 + 0.05;
      el.style.opacity   = baseOpacity.toString();
      el.dataset.baseOp  = baseOpacity.toString();
      container.appendChild(el);
      blocks.push({ el, palette });
    }
  }

  let tick = 0;
  function waveAnimate() {
    tick += 0.015;
    for (let i = 0; i < blocks.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const wave = Math.sin(tick + col * 0.25 + row * 0.15) * 0.5 + 0.5;
      const base = parseFloat(blocks[i].el.dataset.baseOp);
      blocks[i].el.style.opacity = (base * 0.4 + wave * 0.35).toFixed(3);
    }
    requestAnimationFrame(waveAnimate);
  }
  waveAnimate();

  function randomFlicker() {
    const idx = Math.floor(Math.random() * blocks.length);
    const b   = blocks[idx];
    const palette = b.palette;
    const newColor = palette[Math.floor(Math.random() * palette.length)];
    b.el.style.background = newColor;
    setTimeout(randomFlicker, Math.random() * 600 + 80);
  }
  randomFlicker();
})();


// ── Window controls ───────────────────────────────────────────────────────
document.getElementById('btn-min').addEventListener('click',   () => api.minimize());
document.getElementById('btn-max').addEventListener('click',   () => api.maximize());
document.getElementById('btn-close').addEventListener('click', () => api.close());

// ── Tabs ─────────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    closeDropdown();
  });
});

// ── Profile dropdown ──────────────────────────────────────────────────────
const dropdown = document.getElementById('profile-dropdown');

function closeDropdown() { dropdown.classList.add('hidden'); }

document.getElementById('profile-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  dropdown.classList.toggle('hidden');
});
document.addEventListener('click', closeDropdown);
dropdown.addEventListener('click', e => e.stopPropagation());

// Logout buttons
async function doLogout() {
  if (confirm('Se déconnecter de ShangriMc ?')) await api.logout();
}
document.getElementById('dd-logout').addEventListener('click', doLogout);
document.getElementById('btn-logout').addEventListener('click', doLogout);
document.getElementById('settings-logout').addEventListener('click', doLogout);


// ── RAM selector (avec sauvegarde persistante) ────────────────────────────
async function initRam() {
  const saved = await api.getSetting('ram');
  if (saved) ramValue = saved;

  document.querySelectorAll('.ram-btn').forEach(btn => {
    if (btn.dataset.val === ramValue) {
      document.querySelectorAll('.ram-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.ram-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ramValue = btn.dataset.val;
      await api.setSetting('ram', ramValue);
    });
  });
}
initRam();

// ── Discord button ────────────────────────────────────────────────────────
document.getElementById('btn-discord').addEventListener('click', () => {
  api.openExternal('https://discord.gg/EMhW5VTqsW');
});

// ── Folder button ─────────────────────────────────────────────────────────
document.getElementById('btn-folder').addEventListener('click', () => api.openGameDir());

// ── Launch game ───────────────────────────────────────────────────────────
const btnPlay      = document.getElementById('btn-play');
const playTxt      = document.getElementById('play-btn-text');
const progressArea = document.getElementById('progress-area');
const progressFill = document.getElementById('progress-fill');
const progressLabel= document.getElementById('progress-label');
const logArea      = document.getElementById('log-area');
const logScroll    = document.getElementById('log-scroll');

function appendLog(msg) {
  const line = document.createElement('div');
  line.textContent = msg;
  logScroll.appendChild(line);
  logScroll.scrollTop = logScroll.scrollHeight;
}

// ── Install + launch progress listeners ──────────────────────────────────
api.onInstallProgress((data) => {
  progressArea.classList.remove('hidden');
  progressLabel.textContent = data.message || 'Installation…';
  progressFill.style.width  = (data.pct || 0) + '%';
});

api.onLaunchLog((msg) => appendLog(msg));

api.onLaunchProgress((prog) => {
  progressArea.classList.remove('hidden');
  if (prog.task && prog.total) {
    const pct = Math.round((prog.task / prog.total) * 100);
    progressFill.style.width = pct + '%';
    progressLabel.textContent = `${prog.type || 'Téléchargement'}… ${pct}%`;
  } else if (prog.type) {
    progressLabel.textContent = prog.type;
  }
});

api.onLaunchStarted(() => {
  launched = true;
  playTxt.textContent = '🎮  En jeu…';
  btnPlay.classList.add('launched');
  btnPlay.disabled = false;
  progressArea.classList.add('hidden');
  // log masquee — les joueurs n'ont pas besoin de voir ca
});

api.onLaunchClosed((code) => {
  launched = false;
  playTxt.textContent = '▶ \u00a0Jouer';
  btnPlay.classList.remove('launched');
  btnPlay.disabled = false;
  appendLog(`Jeu fermé (code: ${code})`);
});

api.onLaunchError((err) => {
  launched = false;
  playTxt.textContent = '▶ \u00a0Jouer';
  btnPlay.classList.remove('launched');
  btnPlay.disabled = false;
  progressArea.classList.add('hidden');
  appendLog(`❌ Erreur: ${err}`);
  logArea.classList.remove('hidden');
  alert(`Erreur de lancement:\n${err}\n\nVérifie que Java 17+ est installé.`);
});

// ── Bouton Play/Install ───────────────────────────────────────────────────
let installState = 'install'; // 'install' | 'update' | 'ready'

async function setInstallMode(state) {
  installState = state;
  if (state === 'ready') {
    playTxt.textContent = '▶ \u00a0Jouer';
    btnPlay.classList.remove('install-mode');
    btnPlay.classList.remove('update-mode');
  } else if (state === 'update') {
    playTxt.textContent = '🔄 \u00a0Mettre à jour';
    btnPlay.classList.remove('install-mode');
    btnPlay.classList.add('update-mode');
  } else {
    playTxt.textContent = '⬇ \u00a0Installer';
    btnPlay.classList.add('install-mode');
    btnPlay.classList.remove('update-mode');
  }
}

btnPlay.addEventListener('click', async () => {
  if (launched) return;
  if (!auth) { alert('Non connecté !'); return; }

  btnPlay.disabled = true;
  progressArea.classList.remove('hidden');
  progressFill.style.width = '0%';
  logScroll.innerHTML = '';

  // ── Mode Installation ou Mise à jour ──────────────────────────────────────
  if (installState === 'install' || installState === 'update') {
    playTxt.textContent = installState === 'update' ? '⌛ Mise à jour…' : '⌛ Installation…';
    progressLabel.textContent = 'Préparation…';

    const result = await api.installAll();

    logArea.classList.remove('hidden');
    if (result.errors && result.errors.length > 0) {
      for (const err of result.errors) appendLog(`❌ ${err}`);
    }
    appendLog(`✅ Mods: ${result.mods} | Packs: ${result.packs}/${result.totalPacks}`);

    progressArea.classList.add('hidden');

    // Re-vérifie l'état après installation
    const check = await api.checkInstalled();
    await setInstallMode(check.state);

    if (check.state !== 'ready') {
      btnPlay.disabled = false;
      const detail = result.errors && result.errors.length > 0
        ? result.errors.join('\n')
        : 'Aucun mod trouve apres telechargement.';
      alert(`Installation incomplete !\n\n${detail}\n\nVerifie ta connexion internet.`);
      return;
    }

    btnPlay.disabled = false;
    return;
  }

  // ── Mode Lancement ────────────────────────────────────────────────────────
  playTxt.textContent = '⌛ Lancement…';
  progressLabel.textContent = 'Démarrage de Minecraft…';
  logScroll.innerHTML = '';

  progressArea.classList.add('hidden');
  await api.launchGame({ ...auth, ram: ramValue });
});

// ── Load auth and update UI ───────────────────────────────────────────────
(async () => {
  auth = await api.getAuth();
  if (!auth) { await api.logout(); return; }

  const initial = auth.name.charAt(0).toUpperCase();
  document.getElementById('profile-avatar').textContent   = initial;
  document.getElementById('dd-avatar').textContent         = initial;
  document.getElementById('dd-name').textContent           = auth.name;
  document.getElementById('play-username').textContent     = `Connecté · ${auth.name}`;
  document.getElementById('settings-username').textContent = auth.name;

  // Vérifie l'état d'installation pour adapter le bouton
  const check = await api.checkInstalled();
  await setInstallMode(check.state);
})();

// ── Bannière de mise à jour launcher ─────────────────────────────────────
api.onUpdateAvailable((version) => {
  const banner = document.getElementById('update-banner');
  const text   = document.getElementById('update-banner-text');
  const btn    = document.getElementById('btn-restart-update');
  text.textContent    = `🔄 Mise à jour v${version} disponible — téléchargement en cours…`;
  btn.style.display   = 'none';
  banner.classList.remove('hidden');
});

api.onUpdateDownloaded(() => {
  const text = document.getElementById('update-banner-text');
  const btn  = document.getElementById('btn-restart-update');
  text.textContent  = '✅ Mise à jour prête — clique sur Redémarrer pour l\'installer';
  btn.style.display = '';
});

document.getElementById('btn-restart-update').addEventListener('click', () => {
  api.restartAndUpdate();
});
