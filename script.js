(() => {
  const s = document.currentScript;
  const v = (s && s.src && s.src.split("v=")[1]) || "6";
  const urls = ["p0.js?v=" + v, "p1.js?v=" + v, "p2.js?v=" + v, "p3.js?v=" + v, "p4.js?v=" + v, "p5.js?v=" + v, "p6.js?v=" + v, "p7.js?v=" + v, "p8.js?v=" + v, "p9.js?v=" + v, "p10.js?v=" + v, "p11.js?v=" + v, "p12.js?v=" + v, "p13.js?v=" + v, "p14.js?v=" + v, "p15.js?v=" + v, "p16.js?v=" + v];
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
