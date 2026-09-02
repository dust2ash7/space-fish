(() => {
  "use strict";

  const W = 480;
  const H = 720;
  const HS_KEY = "spacefish-best";
  const MUTE_KEY = "spacefish-mute";
  const TAU = Math.PI * 2;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  const live = document.getElementById("live");
  const touchEl = document.getElementById("touch");
  const stick = document.getElementById("stick");
  const knob = document.getElementById("stick-knob");
  const fireBtn = document.getElementById("btn-fire");
  const livesEl = document.getElementById("lives");
  const pillsEl = document.getElementById("power-pills");
  const overlays = {
    start: document.getElementById("overlay-start"),
    pause: document.getElementById("overlay-pause"),
    over: document.getElementById("overlay-over"),
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarseOnly = window.matchMedia("(pointer: coarse) and (hover: none)").matches;
  let sawTouch = false;
  function useTouchPads() {
    return sawTouch || coarseOnly;
  }

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  function announce(msg) {
    live.textContent = msg;
  }

  const AudioBus = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.2;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.2;
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    },
    beep(freq, dur, type, vol, slide) {
      if (this.muted) return;
      this.ensure();
      if (!this.ctx) return;
      const t0 = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t0 + dur);
      g.gain.setValueAtTime(vol || 0.12, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    },
    noise(dur, vol) {
      if (this.muted || !this.ctx) return;
      this.ensure();
      const n = this.ctx.sampleRate * dur;
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 900;
      src.buffer = buf;
      g.gain.value = vol || 0.18;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    shoot() { this.beep(920, 0.05, "square", 0.07, 420); },
    boom() { this.beep(110, 0.22, "sawtooth", 0.16, 38); this.noise(0.18, 0.12); },
    hit() { this.beep(240, 0.08, "triangle", 0.1, 90); },
    power() { this.beep(520, 0.12, "sine", 0.12, 880); this.beep(780, 0.16, "sine", 0.08, 1200); },
    hurt() { this.beep(160, 0.28, "sawtooth", 0.18, 50); },
    ui() { this.beep(660, 0.07, "sine", 0.08, 990); },
    wave() { this.beep(300, 0.18, "triangle", 0.1, 600); },
  };

  const input = {
    keys: Object.create(null),
    ax: 0,
    ay: 0,
    firing: false,
    stickId: null,
  };

  function loadBest() {
    const n = parseInt(localStorage.getItem(HS_KEY) || "0", 10);
    return Number.isFinite(n) ? n : 0;
  }

  const G = {
    state: "start",
    t: 0,
    score: 0,
    best: loadBest(),
    lives: 3,
    combo: 1,
    comboTimer: 0,
    wave: 1,
    shake: 0,
    spawnQ: [],
    banner: 0,
    bannerText: "",
    player: null,
    enemies: [],
    bullets: [],
    eBullets: [],
    drops: [],
    particles: [],
    stars: [],
    nebula: [],
    flashes: [],
  };

  function makeStars() {
    G.stars = [];
    for (let i = 0; i < 90; i++) {
      const layer = i < 40 ? 0 : i < 70 ? 1 : 2;
      G.stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        layer,
        s: layer === 0 ? rand(0.6, 1.1) : layer === 1 ? rand(1.1, 1.8) : rand(1.6, 2.6),
        a: rand(0.25, 0.95),
      });
    }
    G.nebula = [
      { x: 80, y: 120, r: 180, c: "rgba(226,61,110,0.10)", v: 8 },
      { x: 380, y: 300, r: 220, c: "rgba(58,160,255,0.10)", v: 6 },
      { x: 220, y: 560, r: 200, c: "rgba(255,193,74,0.07)", v: 10 },
      { x: 40, y: 420, r: 140, c: "rgba(124,240,255,0.06)", v: 5 },
    ];
  }

  function burst(x, y, color, n, speed) {
    const count = reduceMotion ? Math.ceil(n * 0.35) : n;
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const v = rand(speed * 0.3, speed);
      G.particles.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: rand(0.25, 0.7),
        max: 0.7,
        size: rand(1.2, 3.4),
        color,
        drag: 0.96,
      });
    }
  }

  function ring(x, y, color) {
    G.flashes.push({ x, y, r: 6, max: 42, life: 0.35, color });
  }

  function makePlayer() {
    return {
      x: W * 0.5,
      y: H * 0.78,
      vx: 0,
      vy: 0,
      r: 16,
      cool: 0,
      inv: 4.2,
      shield: 0,
      rapid: 0,
      bloom: 0,
      trail: 0,
    };
  }

  function resetRun() {
    G.score = 0;
    G.lives = 3;
    G.combo = 1;
    G.comboTimer = 0;
    G.wave = 1;
    G.shake = 0;
    G.enemies = [];
    G.bullets = [];
    G.eBullets = [];
    G.drops = [];
    G.particles = [];
    G.flashes = [];
    G.spawnQ = [];
    G.player = makePlayer();
    G.banner = 1.6;
    G.bannerText = "WAVE 1";
    queueWave(1);
  }

  function queueWave(n) {
    const q = [];
    const grunts = n === 1 ? 3 : 3 + n * 2;
    const spreaders = n === 1 ? 0 : Math.floor(n / 2);
    const tanks = n < 3 ? 0 : (n % 3 === 0 ? 1 + Math.floor(n / 9) : 0);
    let t = n === 1 ? 4.0 : 1.2;
    for (let i = 0; i < grunts; i++) {
      q.push({ at: t, type: "grunt", x: 70 + (i % 5) * 80 + rand(-10, 10) });
      t += n === 1 ? 1.35 : Math.max(0.22, 0.48 - n * 0.015);
    }
    for (let i = 0; i < spreaders; i++) {
      q.push({ at: (n === 1 ? 4.5 : 2.2) + i * 1.4, type: "spreader", x: 90 + (i % 3) * 150 });
    }
    for (let i = 0; i < tanks; i++) {
      q.push({ at: 4.5 + i * 2.2, type: "tank", x: W * (0.3 + i * 0.35) });
    }
    G.spawnQ = q.sort((a, b) => a.at - b.at);
    G.waveClock = 0;
    G.banner = 1.5;
    G.bannerText = "WAVE " + n;
    AudioBus.wave();
    announce("Wave " + n);
  }

  function spawnEnemy(type, x) {
    const base = {
      type,
      x: clamp(x || rand(50, W - 50), 40, W - 40),
      y: -30,
      t: 0,
      cool: rand(0.4, 1.2),
      phase: rand(0, TAU),
    };
    if (type === "grunt") {
      Object.assign(base, { hp: 1, r: 13, speed: (G.wave === 1 ? 36 : 54) + G.wave * 4, worth: 100 });
    } else if (type === "spreader") {
      Object.assign(base, { hp: 3 + Math.floor(G.wave / 4), r: 20, speed: 48 + G.wave * 2, worth: 250 });
    } else {
      Object.assign(base, { hp: 10 + G.wave * 2, r: 30, speed: 32 + G.wave, worth: 500, maxHp: 10 + G.wave * 2 });
    }
    G.enemies.push(base);
  }

  function firePlayer() {
    const p = G.player;
    if (!p || p.cool > 0) return;
    p.cool = p.rapid > 0 ? 0.1 : 0.18;
    const shots = p.bloom > 0 ? [-0.28, 0, 0.28] : [0];
    shots.forEach((ang) => {
      G.bullets.push({
        x: p.x + Math.sin(ang) * 10,
        y: p.y - 36,
        vx: Math.sin(ang) * 140,
        vy: -300,
        r: 10,
      });
    });
    burst(p.x, p.y - 20, "rgba(255,225,140,0.9)", 3, 40);
    AudioBus.shoot();
  }

  function enemyShoot(e) {
    if (e.type === "grunt") {
      G.eBullets.push({ x: e.x, y: e.y + 12, vx: 0, vy: 220 + G.wave * 8, r: 3.2 });
    } else if (e.type === "spreader") {
      for (let i = -2; i <= 2; i++) {
        const a = Math.PI / 2 + i * 0.28;
        G.eBullets.push({
          x: e.x, y: e.y + 10,
          vx: Math.cos(a) * 180,
          vy: Math.sin(a) * 180,
          r: 3,
        });
      }
    } else {
      const p = G.player;
      const ang = Math.atan2(p.y - e.y, p.x - e.x);
      G.eBullets.push({
        x: e.x, y: e.y + 16,
        vx: Math.cos(ang) * 210,
        vy: Math.sin(ang) * 210,
        r: 5.2,
        heavy: true,
      });
    }
  }

  function dropPower(x, y) {
    const roll = Math.random();
    const kind = roll < 0.34 ? "rapid" : roll < 0.67 ? "shield" : "bloom";
    G.drops.push({ x, y, kind, t: 0, r: 12, vy: 46 });
  }

  function addScore(n) {
    G.score += Math.round(n * G.combo);
    G.comboTimer = 1.35;
    G.combo = Math.min(8, G.combo + 0.25);
    if (G.score > G.best) {
      G.best = G.score;
      localStorage.setItem(HS_KEY, String(G.best));
    }
  }

  function killEnemy(e) {
    burst(e.x, e.y, e.type === "tank" ? "#ff7a3d" : e.type === "spreader" ? "#ff8ad4" : "#7cf0ff", e.type === "tank" ? 28 : 16, 180);
    ring(e.x, e.y, "rgba(255,193,74,0.7)");
    AudioBus.boom();
    if (!reduceMotion) G.shake = Math.min(12, G.shake + (e.type === "tank" ? 8 : 4));
    addScore(e.worth);
    const chance = e.type === "grunt" ? 0.12 : e.type === "spreader" ? 0.28 : 0.55;
    if (Math.random() < chance) dropPower(e.x, e.y);
  }

  function hitPlayer() {
    const p = G.player;
    if (p.inv > 0) return;
    if (p.shield > 0) {
      p.shield = 0;
      p.inv = 1.4;
      burst(p.x, p.y, "#ffc14a", 18, 140);
      AudioBus.hit();
      announce("Shield broke");
      return;
    }
    G.lives -= 1;
    p.inv = 2.6;
    if (!reduceMotion) G.shake = 10;
    burst(p.x, p.y, "#e23d6e", 22, 160);
    AudioBus.hurt();
    G.combo = 1;
    if (G.lives <= 0) gameOver();
    else announce(G.lives + " lives left");
  }

  function setOverlay(name) {
    for (const [key, el] of Object.entries(overlays)) {
      const open = key === name;
      el.classList.toggle("is-open", open);
      el.hidden = !open;
    }
    hud.hidden = G.state !== "play" && G.state !== "pause";
    if (G.state === "play" && useTouchPads()) touchEl.hidden = false;
    else if (G.state !== "play") touchEl.hidden = true;
  }

  function startGame() {
    AudioBus.ensure();
    AudioBus.ui();
    resetRun();
    G.state = "play";
    last = performance.now();
    setOverlay(null);
    if (useTouchPads()) touchEl.hidden = false;
    hud.hidden = false;
    syncHud(true);
  }

  function pauseGame() {
    if (G.state !== "play") return;
    G.state = "pause";
    setOverlay("pause");
    announce("Paused");
  }

  function resumeGame() {
    if (G.state !== "pause") return;
    AudioBus.ensure();
    G.state = "play";
    last = performance.now();
    if (G.player) G.player.inv = Math.max(G.player.inv, 1.8);
    setOverlay(null);
    hud.hidden = false;
    if (useTouchPads()) touchEl.hidden = false;
    announce("Resumed");
  }

  function gameOver() {
    G.state = "over";
    document.getElementById("over-score").textContent = G.score.toLocaleString();
    document.getElementById("over-best").textContent = G.best.toLocaleString();
    document.getElementById("over-wave").textContent = String(G.wave);
    const record = G.score >= G.best && G.score > 0;
    document.getElementById("over-eyebrow").textContent = record ? "New best run" : "Hull breach";
    document.getElementById("over-copy").textContent = record
      ? "The nebula will remember that current."
      : "The school scattered. Try another current.";
    setOverlay("over");
    announce("Game over. Score " + G.score);
  }

  function goTitle() {
    G.state = "start";
    G.player = makePlayer();
    setOverlay("start");
    document.getElementById("start-best").textContent = G.best.toLocaleString();
  }

  let lastHud = "";
  function syncHud(force) {
    const key = [G.score, G.best, G.wave, G.combo, G.lives, G.player && G.player.shield, G.player && G.player.rapid, G.player && G.player.bloom].join("|");
    if (!force && key === lastHud) return;
    lastHud = key;
    document.getElementById("hud-score").textContent = G.score.toLocaleString();
    document.getElementById("hud-best").textContent = G.best.toLocaleString();
    document.getElementById("hud-wave").textContent = String(G.wave);
    document.getElementById("hud-combo").textContent = "x" + G.combo.toFixed(G.combo % 1 ? 1 : 0);
    livesEl.replaceChildren();
    livesEl.setAttribute("aria-label", G.lives + " lives remaining");
    for (let i = 0; i < 3; i++) {
      const s = document.createElement("span");
      s.className = "life" + (i < G.lives ? "" : " is-empty");
      s.title = i < G.lives ? "Life" : "Lost life";
      livesEl.appendChild(s);
    }
    const p = G.player;
    const pills = [];
    if (p && p.shield > 0) pills.push(["shield", "Shield " + Math.ceil(p.shield) + "s"]);
    if (p && p.rapid > 0) pills.push(["rapid", "Rapid " + Math.ceil(p.rapid) + "s"]);
    if (p && p.bloom > 0) pills.push(["bloom", "Bloom " + Math.ceil(p.bloom) + "s"]);
    pillsEl.replaceChildren(...pills.map(([k, lab]) => {
      const el = document.createElement("span");
      el.className = "pill pill-" + k;
      el.textContent = lab;
      return el;
    }));
  }

  function resize() {
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    const bw = Math.max(1, Math.round(r.width * dpr));
    const bh = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    ctx.setTransform(bw / W, 0, 0, bh / H, 0, 0);
  }

  function drawBackground(dt) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#070816");
    g.addColorStop(0.45, "#0b1024");
    g.addColorStop(1, "#120816");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    G.nebula.forEach((n) => {
      n.y += n.v * dt;
      if (n.y - n.r > H) n.y = -n.r;
      const rg = ctx.createRadialGradient(n.x, n.y, 10, n.x, n.y, n.r);
      rg.addColorStop(0, n.c);
      rg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, TAU);
      ctx.fill();
    });
    const speeds = [22, 48, 90];
    G.stars.forEach((s) => {
      s.y += speeds[s.layer] * dt;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      ctx.globalAlpha = s.a;
      ctx.fillStyle = s.layer === 2 ? "#fff4d2" : s.layer === 1 ? "#cfe7ff" : "#8aa0c8";
      ctx.fillRect(s.x, s.y, s.s, s.s);
    });
    ctx.globalAlpha = 1;
  }

  function drawKoi(x, y, rot, t, hurt) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const pulse = 1 + Math.sin(t * 9) * 0.025;
    ctx.scale(pulse, pulse);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const eg = ctx.createRadialGradient(0, 22, 0, 0, 26, 18);
    eg.addColorStop(0, "rgba(124,240,255,0.45)");
    eg.addColorStop(1, "rgba(58,160,255,0)");
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(0, 24, 16, 0, TAU);
    ctx.fill();
    ctx.restore();
    const wag = Math.sin(t * 11) * 0.32;
    ctx.save();
    ctx.translate(0, 18);
    ctx.rotate(wag);
    ctx.fillStyle = "#7cf0ff";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(22, 8, 10, 26);
    ctx.quadraticCurveTo(0, 14, -10, 26);
    ctx.quadraticCurveTo(-22, 8, 0, 0);
    ctx.fill();
    ctx.restore();
    const flap = Math.sin(t * 7) * 0.22;
    ctx.fillStyle = "rgba(124,240,255,0.88)";
    ctx.save();
    ctx.rotate(0.45 + flap);
    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.quadraticCurveTo(30, 6, 24, 18);
    ctx.quadraticCurveTo(12, 10, 3, 8);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.rotate(-0.45 - flap);
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.quadraticCurveTo(-30, 6, -24, 18);
    ctx.quadraticCurveTo(-12, 10, -3, 8);
    ctx.fill();
    ctx.restore();
    const body = ctx.createLinearGradient(0, -26, 0, 22);
    body.addColorStop(0, hurt ? "#fff" : "#fff6e0");
    body.addColorStop(0.25, "#ffc14a");
    body.addColorStop(0.65, "#ff7a3d");
    body.addColorStop(1, "#e23d6e");
    ctx.fillStyle = body;
    ctx.shadowColor = "#ffc14a";
    ctx.shadowBlur = reduceMotion ? 0 : 16;
    ctx.beginPath();
    ctx.moveTo(0, -26);
    ctx.bezierCurveTo(13, -18, 15, -4, 12, 8);
    ctx.bezierCurveTo(9, 18, 4, 22, 0, 22);
    ctx.bezierCurveTo(-4, 22, -9, 18, -12, 8);
    ctx.bezierCurveTo(-15, -4, -13, -18, 0, -26);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ff7a3d";
    ctx.beginPath();
    ctx.moveTo(2, -6);
    ctx.quadraticCurveTo(22, -18, 8, 4);
    ctx.quadraticCurveTo(10, -2, 2, 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,246,224,0.85)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-6, -20);
    ctx.quadraticCurveTo(-16, -28, -18, -22);
    ctx.moveTo(6, -20);
    ctx.quadraticCurveTo(16, -28, 18, -22);
    ctx.stroke();
    ctx.fillStyle = "rgba(226,61,110,0.72)";
    ctx.beginPath();
    ctx.ellipse(5, -2, 6.5, 8.5, 0.45, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "rgba(255,246,224,0.4)";
    ctx.beginPath();
    ctx.ellipse(-5, 5, 4.2, 5.2, -0.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#1a1020";
    ctx.beginPath();
    ctx.ellipse(-4, -14, 3.3, 3.9, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#7cf0ff";
    ctx.beginPath();
    ctx.arc(-3.1, -15.2, 1.35, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawGrunt(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(0.12 * Math.sin(e.t * 6));
    ctx.fillStyle = "#1c3148";
    ctx.strokeStyle = "#7cf0ff";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.bezierCurveTo(12, 8, 10, -8, 0, -16);
    ctx.bezierCurveTo(-10, -8, -12, 8, 0, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#7cf0ff";
    ctx.beginPath();
    ctx.arc(-3, -4, 2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawSpreader(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = "rgba(255,138,212,0.18)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 22, 16, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#3a1830";
    ctx.strokeStyle = "#ff8ad4";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 12, 0, Math.PI, TAU);
    ctx.quadraticCurveTo(0, 18, -18, 0);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,138,212,0.7)";
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5, 8);
      ctx.quadraticCurveTo(i * 8, 18 + Math.sin(e.t * 6 + i) * 4, i * 4, 26);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTank(e) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = "#241018";
    ctx.strokeStyle = "#ff7a3d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 2, 28, 22, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e23d6e";
    ctx.beginPath();
    ctx.moveTo(-10, -18);
    ctx.lineTo(0, -34 - Math.sin(e.t * 4) * 3);
    ctx.lineTo(10, -18);
    ctx.fill();
    ctx.fillStyle = "#ffc14a";
    ctx.beginPath();
    ctx.arc(0, -36, 4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ff7a3d";
    ctx.beginPath();
    ctx.arc(-8, -2, 4, 0, TAU);
    ctx.fill();
    if (e.maxHp) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(-18, 24, 36, 4);
      ctx.fillStyle = "#ffc14a";
      ctx.fillRect(-18, 24, 36 * (e.hp / e.maxHp), 4);
    }
    ctx.restore();
  }

  function drawDrop(d) {
    const bob = Math.sin(d.t * 5) * 3;
    ctx.save();
    ctx.translate(d.x, d.y + bob);
    ctx.globalCompositeOperation = "lighter";
    const col = d.kind === "shield" ? "#ffc14a" : d.kind === "rapid" ? "#7cf0ff" : "#ff8ad4";
    const rg = ctx.createRadialGradient(0, 0, 2, 0, 0, 16);
    rg.addColorStop(0, col);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.font = "700 9px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(d.kind === "shield" ? "S" : d.kind === "rapid" ? "R" : "B", 0, 1);
    ctx.restore();
  }

  function render(dt) {
    resize();
    ctx.save();
    if (G.shake > 0 && !reduceMotion) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
    }
    drawBackground(dt);
    G.particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;
    G.flashes.forEach((f) => {
      ctx.strokeStyle = f.color;
      ctx.globalAlpha = f.life / 0.35;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, TAU);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    G.drops.forEach(drawDrop);
    G.eBullets.forEach((b) => {
      ctx.fillStyle = b.heavy ? "#ff7a3d" : "#ff8ad4";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, TAU);
      ctx.fill();
    });
    G.enemies.forEach((e) => {
      if (e.type === "grunt") drawGrunt(e);
      else if (e.type === "spreader") drawSpreader(e);
      else drawTank(e);
    });
    const p = G.player;
    if (p) {
      const hurtFlash = p.inv > 0 && Math.floor(G.t * 16) % 2 === 0;
      if (!(p.inv > 0 && hurtFlash && G.state === "play")) {
        drawKoi(p.x, p.y, p.vx * 0.012, G.t, p.inv > 0.2);
      }
      if (p.shield > 0) {
        ctx.strokeStyle = "rgba(255,193,74,0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 28 + Math.sin(G.t * 6) * 2, 0, TAU);
        ctx.stroke();
      }
    }
    G.bullets.forEach((b) => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "#fffef6";
      ctx.shadowColor = "#7cf0ff";
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, 5.2, 16, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#7cf0ff";
      ctx.beginPath();
      ctx.ellipse(b.x, b.y + 10, 3.2, 10, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#ffe37a";
      ctx.beginPath();
      ctx.ellipse(b.x, b.y - 6, 2.4, 6, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    });
    if (G.banner > 0) {
      ctx.globalAlpha = Math.min(1, G.banner, G.banner > 0.4 ? 1 : G.banner / 0.4);
      ctx.fillStyle = "#ffc14a";
      ctx.font = "800 28px Syne, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(G.bannerText, W / 2, H * 0.28);
      ctx.globalAlpha = 1;
    }
    if (G.state === "start") {
      ctx.fillStyle = "rgba(232,238,252,0.55)";
      ctx.font = "600 13px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("a koi starfighter in a hungry nebula", W / 2, H * 0.9);
    }
    ctx.restore();
  }

  function steer(dt) {
    const p = G.player;
    let ix = 0, iy = 0;
    if (input.keys.ArrowLeft || input.keys.a || input.keys.A) ix -= 1;
    if (input.keys.ArrowRight || input.keys.d || input.keys.D) ix += 1;
    if (input.keys.ArrowUp || input.keys.w || input.keys.W) iy -= 1;
    if (input.keys.ArrowDown || input.keys.s || input.keys.S) iy += 1;
    ix += input.ax;
    iy += input.ay;
    const mag = Math.hypot(ix, iy);
    if (mag > 1) { ix /= mag; iy /= mag; }
    const spd = 320;
    p.vx = lerp(p.vx, ix * spd, 1 - Math.pow(0.001, dt));
    p.vy = lerp(p.vy, iy * spd, 1 - Math.pow(0.001, dt));
    p.x = clamp(p.x + p.vx * dt, 24, W - 24);
    p.y = clamp(p.y + p.vy * dt, 40, H - 36);
    if (input.firing || input.keys[" "] || input.keys.Spacebar) firePlayer();
  }

  function update(dt) {
    G.t += dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    G.particles.forEach((p) => {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += 20 * dt;
    });
    G.particles = G.particles.filter((p) => p.life > 0);
    G.flashes.forEach((f) => {
      f.life -= dt;
      f.r += dt * 90;
    });
    G.flashes = G.flashes.filter((f) => f.life > 0);
    const p = G.player;
    if (!p) return;
    if (G.state === "start") {
      p.x = W * 0.5 + Math.sin(G.t * 0.8) * 30;
      p.y = H * 0.72 + Math.sin(G.t * 1.3) * 10;
      p.trail += dt;
      if (p.trail > 0.04) {
        p.trail = 0;
        G.particles.push({
          x: p.x + rand(-4, 4), y: p.y + 22,
          vx: rand(-8, 8), vy: rand(40, 80),
          life: 0.4, max: 0.4, size: 2, color: "rgba(124,240,255,0.6)", drag: 0.98,
        });
      }
      return;
    }
    if (G.state !== "play") return;
    if (G.banner > 0) G.banner -= dt;
    G.waveClock += dt;
    while (G.spawnQ.length && G.spawnQ[0].at <= G.waveClock) {
      const s = G.spawnQ.shift();
      spawnEnemy(s.type, s.x);
    }
    if (!G.spawnQ.length && !G.enemies.length && G.waveClock > (G.wave === 1 ? 14 : 9)) {
      G.wave += 1;
      queueWave(G.wave);
    }
    steer(dt);
    p.cool = Math.max(0, p.cool - dt);
    p.inv = Math.max(0, p.inv - dt);
    p.shield = Math.max(0, p.shield - dt);
    p.rapid = Math.max(0, p.rapid - dt);
    p.bloom = Math.max(0, p.bloom - dt);
    G.comboTimer -= dt;
    if (G.comboTimer <= 0) G.combo = Math.max(1, G.combo - dt * 1.5);
    p.trail += dt;
    if (p.trail > 0.03) {
      p.trail = 0;
      G.particles.push({
        x: p.x + rand(-3, 3), y: p.y + 20,
        vx: rand(-12, 12), vy: rand(50, 110),
        life: 0.35, max: 0.35, size: rand(1.5, 3),
        color: p.rapid > 0 ? "rgba(124,240,255,0.8)" : "rgba(255,122,61,0.55)",
        drag: 0.97,
      });
    }
    G.bullets.forEach((b) => { b.x += b.vx * dt; b.y += b.vy * dt; });
    G.eBullets.forEach((b) => { b.x += b.vx * dt; b.y += b.vy * dt; });
    G.bullets = G.bullets.filter((b) => b.y > -20 && b.y < H + 20 && b.x > -20 && b.x < W + 20);
    G.eBullets = G.eBullets.filter((b) => b.y > -20 && b.y < H + 20 && b.x > -20 && b.x < W + 20);
    G.enemies.forEach((e) => {
      e.t += dt;
      if (e.type === "grunt") {
        e.y += e.speed * dt;
        e.x += Math.sin(e.t * 3 + e.phase) * 70 * dt;
        e.cool -= dt;
        if (G.wave > 1 && e.cool <= 0 && e.y > 80 && e.y < H * 0.62) {
          enemyShoot(e);
          e.cool = rand(1.6, 2.4) - G.wave * 0.03;
        }
      } else if (e.type === "spreader") {
        e.y += e.speed * dt;
        e.x += Math.sin(e.t * 1.4 + e.phase) * 40 * dt;
        e.cool -= dt;
        if (e.cool <= 0 && e.y > 30) {
          enemyShoot(e);
          e.cool = Math.max(0.9, 1.8 - G.wave * 0.05);
        }
      } else {
        e.y += e.speed * dt * (e.y < 90 ? 1 : 0.35);
        e.x += Math.sin(e.t * 0.8) * 28 * dt;
        e.x = clamp(e.x, 40, W - 40);
        e.cool -= dt;
        if (e.cool <= 0 && e.y > 40) {
          enemyShoot(e);
          e.cool = Math.max(0.7, 1.4 - G.wave * 0.04);
        }
      }
      e.x = clamp(e.x, 20, W - 20);
    });
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (e.y > H + 40) {
        G.enemies.splice(i, 1);
        continue;
      }
      for (let j = G.bullets.length - 1; j >= 0; j--) {
        const b = G.bullets[j];
        if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + b.r) {
          G.bullets.splice(j, 1);
          e.hp -= 1;
          burst(b.x, b.y, "#fff4d2", 6, 70);
          AudioBus.hit();
          if (e.hp <= 0) {
            killEnemy(e);
            G.enemies.splice(i, 1);
          }
          break;
        }
      }
    }
    for (let i = G.eBullets.length - 1; i >= 0; i--) {
      const b = G.eBullets[i];
      if (Math.hypot(b.x - p.x, b.y - p.y) < 11 + b.r) {
        G.eBullets.splice(i, 1);
        hitPlayer();
      }
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.r - 4) {
        hitPlayer();
        break;
      }
    }
    G.drops.forEach((d) => {
      d.t += dt;
      d.y += d.vy * dt;
      if (Math.hypot(d.x - p.x, d.y - p.y) < 80) {
        d.x = lerp(d.x, p.x, dt * 4);
        d.y = lerp(d.y, p.y, dt * 4);
      }
    });
    for (let i = G.drops.length - 1; i >= 0; i--) {
      const d = G.drops[i];
      if (d.y > H + 20) { G.drops.splice(i, 1); continue; }
      if (Math.hypot(d.x - p.x, d.y - p.y) < p.r + d.r + 6) {
        if (d.kind === "shield") p.shield = 10;
        if (d.kind === "rapid") p.rapid = 8;
        if (d.kind === "bloom") p.bloom = 8;
        addScore(50);
        AudioBus.power();
        burst(d.x, d.y, d.kind === "shield" ? "#ffc14a" : d.kind === "rapid" ? "#7cf0ff" : "#ff8ad4", 14, 90);
        announce(d.kind === "shield" ? "Shield up" : d.kind === "rapid" ? "Rapid fire" : "Bloom shot");
        G.drops.splice(i, 1);
      }
    }
    syncHud();
  }

  let last = performance.now();
  function loop(ts) {
    const dt = Math.min(0.033, (ts - last) / 1000);
    last = ts;
    update(dt);
    render(dt);
    requestAnimationFrame(loop);
  }

  function setMuteUI(m) {
    AudioBus.setMuted(m);
    ["btn-mute", "btn-mute-start"].forEach((id) => {
      const b = document.getElementById(id);
      if (!b) return;
      b.setAttribute("aria-pressed", m ? "true" : "false");
      b.textContent = m ? "Sound off" : "Sound on";
      b.setAttribute("aria-label", m ? "Unmute sound" : "Mute sound");
    });
  }

  window.addEventListener("keydown", (e) => {
    input.keys[e.key] = true;
    if (e.code === "Space") input.keys[" "] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key) || e.code === "Space") e.preventDefault();
    if (e.key === "p" || e.key === "P" || e.key === "Escape") {
      if (G.state === "play") pauseGame();
      else if (G.state === "pause") resumeGame();
    }
    if (e.key === "m" || e.key === "M") setMuteUI(!AudioBus.muted);
    if ((e.key === "Enter" || e.key === " ") && G.state === "start") startGame();
    if ((e.key === "Enter" || e.key === " ") && G.state === "over") startGame();
  });
  window.addEventListener("keyup", (e) => { input.keys[e.key] = false; if (e.code === "Space") input.keys[" "] = false; });

  function toGame(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width * W,
      y: (e.clientY - r.top) / r.height * H,
    };
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch" || e.pointerType === "pen") {
      sawTouch = true;
      if (G.state === "play") touchEl.hidden = false;
    }
    if (G.state !== "play") return;
    input.firing = true;
    AudioBus.ensure();
    if (e.pointerType === "touch" || e.pointerType === "pen") {
      canvas.setPointerCapture(e.pointerId);
      const g = toGame(e);
      G.player.x = clamp(g.x, 24, W - 24);
      G.player.y = clamp(g.y, 40, H - 36);
    }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (G.state !== "play" || !canvas.hasPointerCapture(e.pointerId)) return;
    const g = toGame(e);
    G.player.x = clamp(g.x, 24, W - 24);
    G.player.y = clamp(g.y, 40, H - 36);
  });
  window.addEventListener("pointerup", () => { input.firing = false; });

  function bindStick() {
    const setFrom = (clientX, clientY) => {
      const r = stick.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const max = r.width * 0.34;
      const mag = Math.hypot(dx, dy) || 1;
      if (mag > max) { dx = dx / mag * max; dy = dy / mag * max; }
      input.ax = dx / max;
      input.ay = dy / max;
      knob.style.transform = "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px))";
    };
    const clear = () => {
      input.ax = 0;
      input.ay = 0;
      input.stickId = null;
      knob.style.transform = "translate(-50%, -50%)";
    };
    stick.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (e.pointerType === "touch" || e.pointerType === "pen") sawTouch = true;
      stick.setPointerCapture(e.pointerId);
      input.stickId = e.pointerId;
      setFrom(e.clientX, e.clientY);
    });
    stick.addEventListener("pointermove", (e) => {
      if (input.stickId !== e.pointerId) return;
      e.preventDefault();
      setFrom(e.clientX, e.clientY);
    });
    stick.addEventListener("pointerup", clear);
    stick.addEventListener("pointercancel", clear);
  }

  fireBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (e.pointerType === "touch" || e.pointerType === "pen") sawTouch = true;
    input.firing = true;
    AudioBus.ensure();
  });
  fireBtn.addEventListener("pointerup", () => { input.firing = false; });
  fireBtn.addEventListener("pointercancel", () => { input.firing = false; });

  document.getElementById("btn-play").addEventListener("click", startGame);
  document.getElementById("btn-retry").addEventListener("click", startGame);
  document.getElementById("btn-resume").addEventListener("click", resumeGame);
  document.getElementById("btn-pause").addEventListener("click", pauseGame);
  document.getElementById("btn-quit").addEventListener("click", goTitle);
  document.getElementById("btn-home").addEventListener("click", goTitle);
  document.getElementById("btn-mute").addEventListener("click", () => setMuteUI(!AudioBus.muted));
  document.getElementById("btn-mute-start").addEventListener("click", () => setMuteUI(!AudioBus.muted));

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && G.state === "play") pauseGame();
  });

  window.addEventListener("resize", resize);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  bindStick();
  makeStars();
  G.player = makePlayer();
  setMuteUI(localStorage.getItem(MUTE_KEY) === "1");
  document.getElementById("start-best").textContent = G.best.toLocaleString();
  resize();
  requestAnimationFrame(loop);
})();
