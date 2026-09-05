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


  function drawBolt(b) {
    const rm = reduceMotion;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    if (!rm) {
      ctx.shadowColor = "#ff7a3d";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "rgba(255,122,61,0.35)";
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, 7.2, 16, 0, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = "#ffc14a";
    ctx.beginPath();
    ctx.ellipse(b.x, b.y, 3.6, 11, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ff7a3d";
    ctx.beginPath();
    ctx.ellipse(b.x, b.y + 2.2, 2.2, 7.5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#fff4d2";
    ctx.beginPath();
    ctx.ellipse(b.x, b.y - 5.2, 1.4, 3.2, 0, 0, TAU);
    ctx.fill();
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
      ctx.fillStyle = b.hue || (b.heavy ? "#ff7a3d" : "#ff3ea5");
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.r * 0.7, b.r * 1.5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "rgba(255,62,165,0.45)";
      ctx.fillRect(b.x - 1, b.y, 2, 10);
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
    G.bullets.forEach(drawBolt);
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
