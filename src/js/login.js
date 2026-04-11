/* Login renderer — ShangriMc Launcher */
const api = window.shangrimc;

// ── Stars canvas ──────────────────────────────────────────────────────────
(function initStars() {
  const canvas = document.getElementById('stars');
  const ctx    = canvas.getContext('2d');
  let stars    = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function spawn(n) {
    for (let i = 0; i < n; i++) {
      stars.push({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        r:  Math.random() * 1.5 + 0.2,
        a:  Math.random(),
        da: (Math.random() - 0.5) * 0.004,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.a = Math.max(0.05, Math.min(1, s.a + s.da));
      if (s.a <= 0.05 || s.a >= 1) s.da *= -1;
      s.x += s.vx; s.y += s.vy;
      if (s.x < 0) s.x = canvas.width;
      if (s.x > canvas.width) s.x = 0;
      if (s.y < 0) s.y = canvas.height;
      if (s.y > canvas.height) s.y = 0;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,200,255,${s.a})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  resize(); spawn(200); draw();
  window.addEventListener('resize', () => { resize(); stars = []; spawn(200); });
})();

// ── Shooting stars ────────────────────────────────────────────────────────
(function shootingStars() {
  const canvas = document.getElementById('stars');
  const ctx    = canvas.getContext('2d');

  function spawnShootingStar() {
    const x0 = Math.random() * canvas.width;
    const y0 = Math.random() * (canvas.height * 0.5);
    const len = Math.random() * 120 + 60;
    const angle = Math.PI / 5;
    let progress = 0;

    function draw() {
      if (progress >= 1) return;
      progress += 0.03;
      const x1 = x0 + Math.cos(angle) * len * progress;
      const y1 = y0 + Math.sin(angle) * len * progress;
      const x2 = x0 + Math.cos(angle) * Math.max(0, len * (progress - 0.15));
      const y2 = y0 + Math.sin(angle) * Math.max(0, len * (progress - 0.15));
      const grad = ctx.createLinearGradient(x2, y2, x1, y1);
      grad.addColorStop(0, 'rgba(200,200,255,0)');
      grad.addColorStop(1, `rgba(200,200,255,${0.8 * (1 - progress)})`);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x1, y1);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      requestAnimationFrame(draw);
    }
    draw();
  }

  setInterval(() => {
    if (Math.random() < 0.6) spawnShootingStar();
  }, 3000);
})();

// ── Window controls ───────────────────────────────────────────────────────
document.getElementById('btn-min').addEventListener('click', () => api.minimize());
document.getElementById('btn-close').addEventListener('click', () => api.close());

// Créer un compte → ouvre dans le navigateur
document.getElementById('btn-create-account').addEventListener('click', () => {
  api.openExternal('https://signup.live.com/signup?mkt=fr-FR&uiflavor=web&id=292841');
});

// ── Server ping ───────────────────────────────────────────────────────────
const dot    = document.getElementById('server-dot');
const status = document.getElementById('server-status');

setTimeout(() => {
  dot.className = 'server-dot online';
  status.textContent = 'vocalist-submission.gl.joinmc.link · En ligne';
}, 1200);

// ── Login flow ────────────────────────────────────────────────────────────
const btnLogin  = document.getElementById('btn-login');
const errBox    = document.getElementById('error-box');
const loadState = document.getElementById('loading-state');
const loadText  = document.getElementById('loading-text');

function showError(msg) {
  errBox.textContent = msg;
  errBox.classList.remove('hidden');
  btnLogin.disabled = false;
  loadState.classList.add('hidden');
  btnLogin.classList.remove('hidden');
}

function setLoading(msg) {
  loadText.textContent = msg;
  loadState.classList.remove('hidden');
  btnLogin.classList.add('hidden');
  errBox.classList.add('hidden');
}

btnLogin.addEventListener('click', async () => {
  btnLogin.disabled = true;
  setLoading('Ouverture de la fenêtre Microsoft…');

  try {
    const auth = await api.microsoftLogin();
    setLoading(`Bienvenue, ${auth.name} ! Chargement…`);
    await new Promise(r => setTimeout(r, 900));
    await api.goHome();
  } catch (err) {
    showError(`Erreur de connexion : ${err.message || err}`);
  }
});

// ── Check if already logged in ────────────────────────────────────────────
(async () => {
  const auth = await api.getAuth();
  if (auth) {
    setLoading(`Reconnexion en tant que ${auth.name}…`);
    await new Promise(r => setTimeout(r, 600));
    await api.goHome();
  }
})();
