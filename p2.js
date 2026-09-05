
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