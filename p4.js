
  function makePlayer() {
    return {
      x: W * 0.5,
      y: H * 0.78,
      vx: 0,
      vy: 0,
      r: 16,
      cool: 0,
      inv: 10.5,
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