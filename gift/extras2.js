// Спиритическая доска (секретное слово планшеткой) и Таро воспоминаний
(() => {
  const $ = s => document.querySelector(s);
  const mk = (id, h) => { const e = document.createElement("div"); e.id = id; e.innerHTML = h; document.body.append(e); return e; };
  const row = $("#write .row"), add = (t, f) => { const b = document.createElement("button"); b.className = "btn"; b.textContent = t; b.onclick = f; row.append(b); };

  const board = mk("board", '<div class="bd"><button class="x">×</button><h2>Спиритическая доска</h2><p>Назови слово. Веди планшетку по буквам.</p><div class="lt"></div><div id="spell"></div><button class="btn" id="clr">стереть</button><i id="plan"></i></div>');
  const bd = board.querySelector(".bd"), lt = board.querySelector(".lt"), plan = board.querySelector("#plan"), sp = board.querySelector("#spell");
  let word = "";
  const put = (x, y) => { const p = bd.getBoundingClientRect(); plan.style.transform = `translate(${x - p.left - 45}px,${y - p.top - 55}px)`; };
  const shut = () => { board.classList.remove("on"); word = ""; sp.textContent = ""; };
  "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ".split("").forEach(ch => {
    const b = document.createElement("button"); b.textContent = ch;
    b.onclick = () => { const a = b.getBoundingClientRect(); put(a.left + a.width / 2, a.top + a.height / 2); word += ch; sp.textContent = word; sfx.tick(); check(); };
    lt.append(b);
  });
  bd.addEventListener("pointermove", e => put(e.clientX, e.clientY));
  function check() {
    const w = word.toLowerCase(), main = (C.secretWord || "").toLowerCase(), keys = Object.keys(C.secrets || {});
    if (main && w.endsWith(main)) { shut(); unlocked = true; set("unlocked", true); $("#b3").hidden = false; sfx.bell(); setTimeout(() => go(3), 900); return; }
    const k = keys.find(x => w.endsWith(x.toLowerCase()));
    if (k) { shut(); setTimeout(() => openModal(C.secrets[k].title, C.secrets[k].text), 500); return; }
    if (word.length >= Math.max(main.length, ...keys.map(x => x.length))) {
      bd.classList.add("no"); sfx.tab();
      setTimeout(() => { bd.classList.remove("no"); word = ""; sp.textContent = ""; }, 600);
    }
  }
  board.querySelector(".x").onclick = shut;
  board.querySelector("#clr").onclick = () => { word = ""; sp.textContent = ""; };
  add("спиритическая доска", () => { board.classList.add("on"); sfx.paper(); });

  const NAMES = ["Шут", "Маг", "Жрица", "Императрица", "Отшельник", "Колесо Фортуны", "Сила", "Смерть", "Дьявол", "Башня", "Звезда", "Луна", "Солнце", "Суд", "Мир"];
  const tarot = mk("tarot", '<div><button class="x">×</button><h2>Таро воспоминаний</h2><div class="cards"></div><p><button class="btn" id="redraw">вытянуть заново</button></p></div>');
  function draw() {
    const box = tarot.querySelector(".cards"); box.innerHTML = "";
    const ph = (F.photos || []).slice().sort(() => Math.random() - 0.5), nm = NAMES.slice().sort(() => Math.random() - 0.5);
    ["Было", "Есть", "Будет"].forEach((t, i) => {
      const f = ph[i], s = document.createElement("div"); s.className = "slot";
      s.innerHTML = '<div class="card"><div class="in"><div class="bk"></div><div class="fc"><img alt=""><b></b></div></div></div><p class="cl"></p>';
      s.querySelector(".cl").textContent = t; s.querySelector("b").textContent = nm[i];
      if (f) s.querySelector("img").src = url("photos", f);
      const card = s.querySelector(".card");
      card.onclick = () => {
        if (!card.classList.contains("f")) { card.classList.add("f"); sfx.paper(); return; }
        const n = ((C.notes || {})[f] || [])[0]; if (n) openModal(n.title, n.text);
      };
      box.append(s);
    });
  }
  tarot.querySelector(".x").onclick = () => tarot.classList.remove("on");
  tarot.querySelector("#redraw").onclick = draw;
  add("таро воспоминаний", () => { draw(); tarot.classList.add("on"); sfx.paper(); });
  addEventListener("keydown", e => { if (e.key === "Escape") { shut(); tarot.classList.remove("on"); } });
})();
