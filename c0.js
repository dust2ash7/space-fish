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
