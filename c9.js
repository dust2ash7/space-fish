
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
