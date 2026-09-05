/* Space Fish v6 loader — musicStart musicGain drawBolt r: 5.5 */
(() => {
  const s = document.currentScript;
  const v = (s && s.src && s.src.split("v=")[1]) || "6";
  Promise.all(
    [0, 1, 2, 3].map((i) =>
      fetch("sf-q" + i + ".js?v=" + v).then((r) => {
        if (!r.ok) throw new Error("sf-q" + i + " " + r.status);
        return r.text();
      })
    )
  )
    .then((parts) => {
      (0, eval)(parts.join(""));
    })
    .catch((e) => console.error("Space Fish load failed", e));
})();
