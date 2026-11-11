// Ритуал зажигания свечей, засыпающий алтарь, ночной режим, фотопроявка, пишущая машинка
(() => {
  const $ = s => document.querySelector(s), splash = $("#splash");
  const cfg = k => (typeof C !== "undefined" && C) ? C[k] : undefined;

  // ----- 1. зажечь свечи при входе
  const wicks = document.createElement("div"); wicks.id = "wicks";
  wicks.innerHTML = Array.from({ length: 5 }, (_, i) => `<b class="cd" style="--h:${70 + (i * 37) % 50}px;--w:22px;--d:-${i * 0.6}s"><i></i></b>`).join("");
  splash.firstElementChild.insertBefore(wicks, splash.querySelector("p"));
  splash.querySelector("p").textContent = "зажги свечи, чтобы войти";
  splash.setAttribute("role", "button");
  splash.setAttribute("tabindex", "0");
  splash.setAttribute("aria-label", "Нажми, чтобы войти");
  document.addEventListener("gift:enter", () => {
    wicks.querySelectorAll(".cd").forEach(c => c.classList.add("lit"));
    const prompt = splash.querySelector("p");
    if (prompt) prompt.textContent = "добро пожаловать";
  }, { once: true });

  // ----- 2. засыпающий алтарь (по умолчанию 8 минут, sleepMinutes в extras.json) и ночной режим
  let idle, lvl = 1, tgt = 1, ft;
  const fade = t => {
    tgt = t; clearInterval(ft);
    ft = setInterval(() => {
      lvl += (tgt - lvl) * 0.12; if (Math.abs(tgt - lvl) < 0.01) { lvl = tgt; clearInterval(ft); }
      sfx.level(lvl); const a = $("#audio"), v = $("#vol"); if (a) a.volume = (v ? +v.value : 1) * lvl;
    }, 200);
  };
  const sleep = () => { document.body.classList.add("sleep"); fade(0.25); };
  const wake = () => {
    if (document.body.classList.contains("sleep")) { document.body.classList.remove("sleep"); fade(1); }
    clearTimeout(idle); idle = setTimeout(sleep, (cfg("sleepMinutes") || 8) * 6e4);
  };
  ["mousemove", "keydown", "pointerdown", "wheel", "touchstart"].forEach(ev => addEventListener(ev, wake, { passive: true }));
  wake();
  const late = () => { const h = new Date().getHours(); document.body.classList.toggle("late", h >= 22 || h < 6); };
  late(); setInterval(late, 3e5);

  // ----- 3. фотопроявка: красный свет и тень, затем изображение проявляется
  window.develop = img => {
    const fr = img.closest(".frame"); img.classList.remove("dev"); if (fr) fr.classList.remove("red");
    void img.offsetWidth; img.classList.add("dev"); if (fr) fr.classList.add("red");
  };

  // ----- 4. пишущая машинка: записки печатаются, звук sounds/key.mp3
  let tw;
  const prev = window.openModal, cm = window.closeModal;
  window.openModal = (t, x) => {
    prev(t, ""); const p = $("#modal p"), s = String(x || ""); clearInterval(tw); p.textContent = "";
    let i = 0; const d = Math.max(12, Math.min(40, 6000 / Math.max(s.length, 1)));
    tw = setInterval(() => { p.textContent = s.slice(0, ++i); if (i % 2 === 0 && s[i - 1] !== " ") sfx.key(); if (i >= s.length) clearInterval(tw); }, d);
    p.onpointerdown = () => { clearInterval(tw); p.textContent = s; };
  };
  window.closeModal = () => { clearInterval(tw); cm(); };
})();
