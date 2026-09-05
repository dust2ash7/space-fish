(() => {
  const s = document.currentScript;
  const v = (s && s.src && s.src.split("v=")[1]) || "6";
  const urls = ["sf-a.js?v=" + v, "sf-b.js?v=" + v];
  let chain = Promise.resolve();
  const parts = [];
  urls.forEach((u) => {
    chain = chain.then(() => fetch(u, { cache: "no-cache" }).then((r) => {
      if (!r.ok) throw new Error("load " + u);
      return r.text();
    }).then((t) => { parts.push(t); }));
  });
  chain.then(() => { (0, eval)(parts.join("\n")); }).catch((e) => console.error(e));
})();
