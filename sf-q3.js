    if (G.state !== "play") return;
    if (G.banner > 0) G.banner -= dt;
    G.waveClock += dt;
    while (G.spawnQ.length && G.spawnQ[0].at <= G.waveClock) {
      const s = G.spawnQ.shift();
      spawnEnemy(s.type, s.x);
    }
    if (!G.spawnQ.length && !G.enemies.length && G.waveClock > (G.wave === 1 ? 18 : 10)) {
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
    G.bullets.forEach((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.trail = (b.trail || 0) + dt;
      if (b.trail > 0.02) {
        b.trail = 0;
        G.particles.push({
          x: b.x, y: b.y + 6,
          vx: (Math.random() - 0.5) * 20, vy: 40 + Math.random() * 30,
          life: 0.18, max: 0.18, size: 2,
          color: Math.random() > 0.5 ? "#ffc14a" : "#ff7a3d", drag: 0.92,
        });
      }
    });
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
          burst(b.x, b.y, "#ffc14a", 10, 110);
          ring(b.x, b.y, "rgba(255,244,210,0.7)");
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
    if (G.waveClock > 10.5) {
      for (let i = 0; i < G.enemies.length; i++) {
        const e = G.enemies[i];
        if (Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.r - 6) {
          hitPlayer();
          break;
        }
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
    let dt = Math.min(0.02, (ts - last) / 1000);
    if (document.hidden) dt = 0;
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
    const space = e.key === " " || e.code === "Space";
    if (space) input.keys[" "] = true;
    input.keys[e.key] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) || space) e.preventDefault();
    if (G.state === "play" && space) {
      e.preventDefault();
      e.stopPropagation();
      grabPlayFocus();
      return;
    }
    if (e.key === "p" || e.key === "P" || e.key === "Escape") {
      if (G.state === "play") pauseGame();
      else if (G.state === "pause") resumeGame();
    }
    if (e.key === "m" || e.key === "M") setMuteUI(!AudioBus.muted);
    if ((e.key === "Enter" || space) && G.state === "start") startGame();
    if ((e.key === "Enter" || space) && G.state === "over") startGame();
  }, true);
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
    last = performance.now();
    if (document.hidden && G.state === "play") pauseGame();
    if (!document.hidden && G.state === "pause" && G.player) {
      G.player.inv = Math.max(G.player.inv, 2.5);
    }
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
