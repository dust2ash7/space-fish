
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
