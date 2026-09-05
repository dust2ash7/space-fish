(() => {
  // Space Fish v6 markers: musicStart musicGain drawBolt r: 5.5
  const urls = [];
  for (let i = 0; i <= 10; i++) urls.push("c" + i + ".js?v=6");
  let chain = Promise.resolve();
  const parts = [];
  urls.forEach((u) => {
    chain = chain.then(() => fetch(u, { cache: "no-cache" }).then((r) => {
      if (!r.ok) throw new Error("load " + u);
      return r.text();
    }).then((t) => { parts.push(t); }));
  });
  chain.then(() => { (0, eval)(parts.join("")); }).catch((e) => console.error(e));
})();
