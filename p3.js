
      src.buffer = buf;
      g.gain.value = vol || 0.18;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    shoot() { this.beep(920, 0.05, "square", 0.07, 420); this.duckMusic(120); },
    boom() { this.beep(110, 0.22, "sawtooth", 0.16, 38); this.noise(0.18, 0.12); this.duckMusic(120); },
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
