// Дополнения: задуть свечи + желание + письмо, угли, свет у курсора, виды фото, ворон, подсказка, иконка
(() => {
  const $ = s => document.querySelector(s), mk = (t, id, h) => { const e = document.createElement(t); if (id) e.id = id; if (h) e.innerHTML = h; document.body.append(e); return e; };
  const ic = document.createElement("link"); ic.rel = "icon";
  ic.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🕯️</text></svg>"; document.head.append(ic);

  // подсказка про стрелки
  const keys = mk("div", "keys"); keys.textContent = "← →  листай вкладки";
  setTimeout(() => keys.classList.add("show"), 4000); setTimeout(() => keys.classList.add("gone"), 16000);
  addEventListener("keydown", e => { if (e.key.startsWith("Arrow")) keys.classList.add("gone"); });

  // свет только вокруг курсора (4-я вкладка)
  const lamp = mk("div", "lamp");
  addEventListener("mousemove", e => { lamp.style.setProperty("--mx", e.clientX + "px"); lamp.style.setProperty("--my", e.clientY + "px"); });

  // угли и пепел
  if (!matchMedia("(prefers-reduced-motion:reduce)").matches) {
    const cv = mk("canvas", "embers"), g = cv.getContext("2d"); let W, H, col = "255,138,42", n = 0;
    const fit = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; }; fit(); addEventListener("resize", fit);
    const P = Array.from({ length: 45 }, () => ({ x: Math.random() * 3000, y: Math.random() * 1500, r: .5 + Math.random() * 1.6, v: .2 + Math.random() * .5, p: Math.random() * 6 }));
    (function loop() {
      if (!(n++ % 90)) col = getComputedStyle(document.documentElement).getPropertyValue("--fg").trim() || col;
      g.clearRect(0, 0, W, H);
      P.forEach(o => {
        o.y -= o.v; o.p += .02; o.x += Math.sin(o.p) * .4;
        if (o.y < -10) { o.y = H + 10; o.x = Math.random() * W; }
        g.fillStyle = `rgba(${col},${.25 + .35 * Math.sin(o.p * 2) ** 2})`; g.beginPath(); g.arc(Math.abs(o.x) % W, o.y, o.r, 0, 6.3); g.fill();
      });
      requestAnimationFrame(loop);
    })();
  }

  // виды фото: обычный / сепия / гравюра / негатив
  const FL = ["", "sepia", "engr", "neg"], NM = ["обычный", "сепия", "гравюра", "негатив"];
  document.addEventListener("click", e => {
    const b = e.target.closest(".flt"); if (!b) return;
    const ph = b.closest(".altar").querySelector(".photo"), i = ((+b.dataset.i || 0) + 1) % 4; b.dataset.i = i;
    ph.classList.remove("sepia", "engr", "neg"); if (FL[i]) ph.classList.add(FL[i]);
    b.textContent = "вид: " + NM[i];
  });

  // ворон-предсказатель
  const ob = document.createElement("button"); ob.className = "btn"; ob.textContent = "спросить ворона"; $("#write .row").append(ob);
  ob.onclick = () => { const o = C.oracle || []; if (!o.length) return; $("#msg").textContent = "Ворон шепчет: " + o[Math.random() * o.length | 0]; sfx.paper(); };

  // Одно нажатие гасит свечи и открывает финальное письмо. Микрофон не используется.
  const letter = mk("div", "letter", '<article><button class="x" aria-label="Закрыть">×</button><h2></h2><p></p></article>');
  const closeLetter = () => letter.classList.remove("on");
  letter.querySelector(".x").onclick = closeLetter;
  letter.addEventListener("click", e => { if (e.target === letter) closeLetter(); });

  const bb = mk("button", "blow");
  bb.className = "btn";
  bb.textContent = "задуть свечи";
  let finished = false;
  const candles = () => document.querySelectorAll("#t0 .cd");

  function showLetter() {
    const L = C.finalLetter || { title: "С днём рождения", text: "" };
    letter.querySelector("h2").textContent = L.title || "С днём рождения";
    letter.classList.add("on");
    const p = letter.querySelector("p");
    p.textContent = "";
    const text = String(L.text || "");
    let i = 0;
    const typing = setInterval(() => {
      p.textContent += text[i++] || "";
      if (i >= text.length) clearInterval(typing);
    }, 35);
  }

  bb.onclick = () => {
    if (finished) return;
    finished = true;
    bb.hidden = true;
    candles().forEach((c, i) => setTimeout(() => c.classList.add("off"), i * 180));
    sfx.tab();
    setTimeout(showLetter, 2200);
  };
})();
