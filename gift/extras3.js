// Гримуар, кодовый замок, несколько пластинок, небо на финальном письме
(() => {
  const $ = s => document.querySelector(s);
  const mk = (id, h) => { const e = document.createElement("div"); e.id = id; e.innerHTML = h; document.body.append(e); return e; };
  const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const row = $("#write .row");
  const add = (t, f) => { const b = document.createElement("button"); b.className = "btn"; b.textContent = t; b.onclick = f; row.append(b); };

  // ----- несколько пластинок: все mp3 из папки music, кнопки ‹ ›, у каждой своя этикетка
  window.setupPlaylist = () => {
    const list = F.music || []; if (list.length < 2) return;
    const a = $("#audio"), song = $("#song"), lab = $("#player .lab"); let i = 0;
    const step = d => {
      i = (i + d + list.length) % list.length; a.src = url("music", list[i]);
      song.textContent = (i === 0 && C.songTitle) || base(list[i]); lab.style.filter = `hue-rotate(${i * 50}deg)`; a.play().catch(() => {});
    };
    const mkb = (t, d) => { const b = document.createElement("button"); b.className = "btn"; b.textContent = t; b.onclick = () => step(d); return b; };
    $("#player .ctl").prepend(mkb("‹", -1)); $("#pp").after(mkb("›", 1));
    a.loop = false; a.onended = () => step(1);
  };

  // ----- кодовый замок перед входом (lockCode в extras.json, например "1405")
  const splash = $("#splash"); let opened = get("lockOK", false);
  splash.addEventListener("click", e => {
    if (opened || !C || !C.lockCode) return;
    e.stopImmediatePropagation(); if (!$("#lock")) showLock();
  }, true);
  function showLock() {
    const code = String(C.lockCode), val = Array(code.length).fill(0);
    const L = mk("lock", "<div><h2>" + esc(C.lockHint || "Введи нашу дату") + '</h2><div class="wh"></div><button class="btn">открыть</button></div>');
    val.forEach((_, i) => {
      const w = document.createElement("div"); w.className = "w"; w.innerHTML = "<button>▲</button><b>0</b><button>▼</button>";
      const [u, b, d] = w.children, set1 = k => { val[i] = (val[i] + k + 10) % 10; b.textContent = val[i]; sfx.tick(); };
      u.onclick = () => set1(1); d.onclick = () => set1(-1); L.querySelector(".wh").append(w);
    });
    L.querySelector(".btn").onclick = () => {
      if (val.join("") === code) { opened = true; set("lockOK", true); L.remove(); splash.click(); }
      else { L.classList.add("no"); sfx.tab(); setTimeout(() => L.classList.remove("no"), 500); }
    };
  }

  // ----- небо на финальном письме: своя картинка (skyImage) или нарисованное по дате
  const letter = $("#letter"); let skyDone = false;
  new MutationObserver(() => {
    if (!letter.classList.contains("on") || skyDone) return; skyDone = true;
    letter.prepend(C.skyImage ? Object.assign(document.createElement("img"), { src: C.skyImage, className: "sky" }) : sky());
  }).observe(letter, { attributes: true, attributeFilter: ["class"] });
  function sky() {
    const c = document.createElement("canvas"), W = c.width = innerWidth, Hh = c.height = innerHeight, g = c.getContext("2d"); c.className = "sky";
    let s = 0; for (const ch of String(C.birthDate || "sky")) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const st = Array.from({ length: 380 }, () => ({ x: rnd() * W, y: rnd() * Hh, r: rnd() ** 3 * 2 + 0.3 }));
    st.forEach(o => { g.fillStyle = `rgba(255,255,255,${0.4 + o.r / 3})`; g.beginPath(); g.arc(o.x, o.y, o.r, 0, 6.3); g.fill(); });
    g.strokeStyle = "rgba(255,255,255,.25)"; g.beginPath();
    st.filter(o => o.r > 1.4).slice(0, 9).forEach((o, i) => i ? g.lineTo(o.x, o.y) : g.moveTo(o.x, o.y)); g.stroke();
    return c;
  }

  // ----- гримуар: записки в книге с перелистыванием
  const book = mk("book", '<div class="bw"><button class="x">×</button><div class="bk2"><div class="pgL"></div><div class="pgR"></div><div class="leaf" hidden><div class="fr"></div><div class="bf"></div></div></div><div class="nav"><button class="btn" data-d="-1">‹ назад</button><button class="btn" data-d="1">вперёд ›</button></div></div>');
  const PL = book.querySelector(".pgL"), PR = book.querySelector(".pgR"), leaf = book.querySelector(".leaf"), fr = leaf.children[0], bf = leaf.children[1];
  let pages = [], sp = 0, busy = false;
  const pg = p => p ? `<h3>${esc(p.title)}</h3>${p.img ? `<img src="${p.img}" alt="">` : ""}<p>${esc(p.text)}</p>${p.seal ? '<i class="seal"></i>' : ""}` : "";
  const show = () => { PL.innerHTML = pg(pages[sp * 2]); PR.innerHTML = pg(pages[sp * 2 + 1]); };
  function build() {
    pages = [];
    Object.entries(C.notes || {}).forEach(([k, ns]) => {
      const dir = (F.photos || []).includes(k) ? "photos" : (F.myPhotos || []).includes(k) ? "my-photos" : null;
      ns.forEach((n, j) => {
        const left = n.until ? Math.ceil((new Date(n.until) - Date.now()) / 864e5) : 0;
        pages.push({ title: n.title, text: left > 0 ? "Запечатано. Откроется через " + left + " дн." : n.text, img: dir && j === 0 ? url(dir, k) : "", seal: n.seal || left > 0 });
      });
    });
    get("notes", []).slice().reverse().forEach(n => pages.push({ title: n.date, text: n.text }));
    if (!pages.length) pages.push({ title: "Пусто", text: "Здесь появятся записки." });
  }
  function flip(d) {
    const t = sp + d; if (busy || t < 0 || t > Math.ceil(pages.length / 2) - 1) return;
    busy = true; sfx.paper(); leaf.style.transition = "none";
    if (d > 0) { fr.innerHTML = pg(pages[sp * 2 + 1]); bf.innerHTML = pg(pages[t * 2]); leaf.style.transform = "rotateY(0)"; PR.innerHTML = pg(pages[t * 2 + 1]); }
    else { fr.innerHTML = pg(pages[t * 2 + 1]); bf.innerHTML = pg(pages[sp * 2]); leaf.style.transform = "rotateY(-180deg)"; PL.innerHTML = pg(pages[t * 2]); }
    leaf.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => { leaf.style.transition = "transform .9s ease-in-out"; leaf.style.transform = d > 0 ? "rotateY(-180deg)" : "rotateY(0)"; }));
    setTimeout(() => { sp = t; show(); leaf.hidden = true; busy = false; }, 950);
  }
  book.querySelectorAll(".nav .btn").forEach(b => b.onclick = () => flip(+b.dataset.d));
  book.querySelector(".x").onclick = () => book.classList.remove("on");
  addEventListener("keydown", e => {
    if (!book.classList.contains("on")) return;
    if (e.key === "ArrowRight") flip(1); else if (e.key === "ArrowLeft") flip(-1); else if (e.key === "Escape") book.classList.remove("on"); else return;
    e.stopPropagation();
  }, true);
  add("гримуар", () => { build(); sp = 0; show(); leaf.hidden = true; book.classList.add("on"); sfx.paper(); });
})();
