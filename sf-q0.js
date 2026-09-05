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
    musicGain: null,
    musicNodes: null,
    motifTimer: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.2;
        this.master.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.0001;
        this.musicGain.connect(this.master);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.2;
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    },
    musicStart() {
      this.ensure();
      if (!this.ctx || !this.musicGain) return;
      const ac = this.ctx;
      const t0 = ac.currentTime;
      if (!this.musicNodes) {
        const dest = this.musicGain;
        const nodes = [];
        const mkOsc = (type, freq, gain, detune) => {
          const o = ac.createOscillator();
          const g = ac.createGain();
          o.type = type;
          o.frequency.value = freq;
          if (detune) o.detune.value = detune;
          g.gain.value = gain;
          o.connect(g);
          g.connect(dest);
          o.start();
          nodes.push(o, g);
          return o;
        };
        mkOsc("sine", 55, 0.22, 0);
        mkOsc("sine", 55.4, 0.12, 6);
        mkOsc("triangle", 82.4, 0.08, -4);
        mkOsc("sine", 110, 0.05, 3);
        const n = ac.sampleRate * 4;
        const buf = ac.createBuffer(1, n, ac.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
        const src = ac.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const bp = ac.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 420;
        bp.Q.value = 2.2;
        const ng = ac.createGain();
        ng.gain.value = 0.045;
        const lfo = ac.createOscillator();
        const lfoG = ac.createGain();
        lfo.frequency.value = 0.07;
        lfoG.gain.value = 180;
        lfo.connect(lfoG);
        lfoG.connect(bp.frequency);
        src.connect(bp);
        bp.connect(ng);
        ng.connect(dest);
        src.start();
        lfo.start();
        nodes.push(src, bp, ng, lfo, lfoG);
        const motif = [220, 261.63, 293.66, 329.63, 392, 329.63, 293.66, 261.63];
        let mi = 0;
        const playMotif = () => {
          if (!this.musicNodes || this.muted) return;
          const f = motif[mi % motif.length];
          mi += 1;
          const o = ac.createOscillator();
          const g = ac.createGain();
          const lp = ac.createBiquadFilter();
          o.type = "sine";
          o.frequency.value = f;
          lp.type = "lowpass";
          lp.frequency.value = 1400;
          const now = ac.currentTime;
          g.gain.setValueAtTime(0.0001, now);
          g.gain.exponentialRampToValueAtTime(0.04, now + 0.05);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
          o.connect(lp);
          lp.connect(g);
          g.connect(dest);
          o.start(now);
          o.stop(now + 1.3);
        };
        this.motifTimer = setInterval(playMotif, 2800);
        playMotif();
        this.musicNodes = nodes;
      }
      this.musicGain.gain.cancelScheduledValues(t0);
      this.musicGain.gain.setValueAtTime(Math.max(0.0001, this.musicGain.gain.value), t0);
      this.musicGain.gain.linearRampToValueAtTime(0.11, t0 + 0.9);
    },
    musicFade(to, dur, stopAfter) {
      this.ensure();
      if (!this.musicGain) return;
      const ac = this.ctx;
      const t0 = ac.currentTime;
      this.musicGain.gain.cancelScheduledValues(t0);
      this.musicGain.gain.setValueAtTime(Math.max(0.0001, this.musicGain.gain.value), t0);
      this.musicGain.gain.linearRampToValueAtTime(Math.max(0.0001, to), t0 + dur);
      if (stopAfter) {
        setTimeout(() => this.musicStop(), dur * 1000 + 40);
      }
    },
    musicStop() {
      if (this.motifTimer) { clearInterval(this.motifTimer); this.motifTimer = null; }
      if (this.musicNodes) {
        this.musicNodes.forEach((n) => {
          try { if (n.stop) n.stop(); } catch (_) {}
          try { if (n.disconnect) n.disconnect(); } catch (_) {}
        });
        this.musicNodes = null;
      }
      if (this.musicGain) this.musicGain.gain.value = 0.0001;
    },
    duckMusic(ms) {
      if (!this.musicGain || this.muted) return;
      const ac = this.ctx;
      if (!ac) return;
      const t0 = ac.currentTime;
      const g = this.musicGain.gain;
      g.cancelScheduledValues(t0);
      g.setValueAtTime(0.11, t0);
      g.linearRampToValueAtTime(0.04, t0 + 0.02);
      g.linearRampToValueAtTime(0.11, t0 + (ms || 120) / 1000);
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
