(()=>{// musicStart musicGain inv: 10.5 grabPlayFocus
const s=document.currentScript;const v=(s&&s.src&&s.src.split("v=")[1])||"6d";
Promise.all([fetch("sf-ma.js?v="+v).then(r=>r.text()),fetch("sf-mb.js?v="+v).then(r=>r.text())])
.then(([a,b])=>{(0,eval)(a+b)}).catch(e=>console.error(e));})();
