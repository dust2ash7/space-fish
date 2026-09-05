(() => {
  const s = document.currentScript;
  const v = (s && s.src && s.src.split("v=")[1]) || "6";
  const urls = ["c0.js?v=" + v, "c1.js?v=" + v, "c2.js?v=" + v, "c3.js?v=" + v, "c4.js?v=" + v, "c5.js?v=" + v, "c6.js?v=" + v, "c7.js?v=" + v, "c8.js?v=" + v, "c9.js?v=" + v, "c10.js?v=" + v];
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
