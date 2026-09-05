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
    let t = n === 1 ? 5.5 : 1.4;
    for (let i = 0; i < grunts; i++) {
      q.push({ at: t, type: "grunt", x: n === 1
        ? (i % 2 === 0 ? rand(48, 110) : rand(370, 432))
        : 70 + (i % 5) * 80 + rand(-10, 10) });
      t += n === 1 ? 1.6 : Math.max(0.22, 0.48 - n * 0.015);
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
      Object.assign(base, { hp: 1, r: 13, speed: (G.wave === 1 ? 28 : 54) + G.wave * 4, worth: 100 });
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
        r: 5.5,
        trail: 0,
      });
    });
    burst(p.x, p.y - 22, "#ffc14a", 8, 90);
    ring(p.x, p.y - 24, "rgba(255,193,74,0.85)");
    AudioBus.shoot();
  }

  function enemyShoot(e) {
    if (e.type === "grunt") {
      G.eBullets.push({ x: e.x, y: e.y + 12, vx: 0, vy: 220 + G.wave * 8, r: 3.2, hue: "#ff3ea5" });
    } else if (e.type === "spreader") {
      for (let i = -2; i <= 2; i++) {
        const a = Math.PI / 2 + i * 0.28;
        G.eBullets.push({
          x: e.x, y: e.y + 10,
          vx: Math.cos(a) * 180,
          vy: Math.sin(a) * 180,
          r: 3,
          hue: "#ff3ea5",
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
    grabPlayFocus();
    AudioBus.musicStart();
  }

  function grabPlayFocus() {
    const active = document.activeElement;
    if (active && active !== canvas && typeof active.blur === "function") active.blur();
    canvas.setAttribute("tabindex", "0");
    try { canvas.focus({ preventScroll: true }); } catch (_) { canvas.focus(); }
  }

  function pauseGame() {
    if (G.state !== "play") return;
    G.state = "pause";
    AudioBus.musicFade(0.0001, 0.18, false);
    setOverlay("pause");
    announce("Paused");
  }

  function resumeGame() {
    if (G.state !== "pause") return;
    AudioBus.ensure();
    G.state = "play";
    last = performance.now();
    if (G.player) G.player.inv = Math.max(G.player.inv, 2.5);
    setOverlay(null);
    hud.hidden = false;
    if (useTouchPads()) touchEl.hidden = false;
    grabPlayFocus();
    AudioBus.musicFade(0.11, 0.22, false);
    announce("Resumed");
  }

  function gameOver() {
    G.state = "over";
    AudioBus.musicFade(0.0001, 1.1, true);
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
