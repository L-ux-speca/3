// «Память»: открытая статистика интересов для следующего подарка. Сводка уходит в Telegram.
// НЕ собирается: набираемый текст до отправки, микрофон, содержимое загруженных файлов, всё за пределами сайта.
(() => {
  const $ = s => document.querySelector(s), KEY = "stats2", TABS = ["Алтарь", "Кружки", "Записка", "Для тебя"];
  let on = get("memOn", true), n = 0;
  const blank = () => ({ pv: {}, ps: {}, sp: {}, ss: {}, up: {}, vp: {}, vs: {}, tabs: {}, notes: {}, btn: {}, t0: Date.now() });
  const T = Object.assign(blank(), get(KEY, {})), S = blank();
  const inc = (k, name, v = 1) => { if (!on || !name) return; S[k][name] = (S[k][name] || 0) + v; T[k][name] = (T[k][name] || 0) + v; };
  const nameOf = el => el && el.src ? decodeURIComponent(el.src.split("/").pop().split("?")[0]) : "";
  let last = "";

  setInterval(() => {
    if (!on || document.hidden) return;
    const spl = $("#splash"); if (!spl || !spl.classList.contains("gone")) return;
    inc("tabs", TABS[cur]);
    const nm = nameOf(cur === 0 ? $("#t0 .photo") : cur === 3 ? $("#t3 .photo") : null);
    if (nm) { if (nm !== last) { inc("pv", nm); last = nm; } inc("ps", nm); }
    const a = $("#audio"); if (a && !a.paused) inc("ss", $("#song").textContent);
    document.querySelectorAll("#videos video").forEach(v => { if (!v.paused) inc("vs", nameOf(v)); });
    if (!(++n % 15)) set(KEY, T);
  }, 1000);

  document.addEventListener("play", e => {
    const t = e.target; if (t.id === "audio") inc("sp", $("#song").textContent); else if (t.tagName === "VIDEO") inc("vp", nameOf(t));
  }, true);
  document.addEventListener("change", e => { if (e.target.id === "file" && e.target.files[0]) inc("up", e.target.files[0].name); }, true);
  document.addEventListener("click", e => {
    const b = e.target.closest(".btn,#tabs button"); if (b && b.id !== "mem" && b.textContent.trim()) inc("btn", b.textContent.trim().slice(0, 30));
  }, true);
  const om = window.openModal; window.openModal = (t, x) => { inc("notes", t); om(t, x); };

  const top = (o, k = 5) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, k).map(([a, b]) => a + " — " + b).join("\n") || "—";
  function flush() {
    const act = Object.values(S.tabs).reduce((a, b) => a + b, 0);
    if (!on || act < 60 || typeof C === "undefined" || !C.notifyUrl) return;
    const text = `Сессия: ${Math.round((Date.now() - S.t0) / 6e4)} мин\n\nВкладки, сек:\n${top(S.tabs, 4)}\n\nФото, просмотры:\n${top(S.pv)}\nФото, секунды:\n${top(S.ps, 3)}\n\nПесни, сек:\n${top(S.ss, 4)}\nЗагружала:\n${top(S.up, 3)}\n\nКружки, сек:\n${top(S.vs, 3)}\n\nЗаписки открыты:\n${top(S.notes)}\n\nНажатия:\n${top(S.btn, 6)}\n\nЗА ВСЁ ВРЕМЯ\nФото, сек:\n${top(T.ps)}\nПесни, сек:\n${top(T.ss)}`;
    const snap = JSON.parse(JSON.stringify(S)); Object.assign(S, blank()); set(KEY, T);
    fetch(C.notifyUrl, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json", "X-Key": C.notifyKey || "" }, body: JSON.stringify({ text, kind: "log", data: snap }) }).catch(() => {});
  }
  addEventListener("visibilitychange", () => { if (document.hidden) flush(); });
  addEventListener("pagehide", flush);
  setInterval(flush, 10 * 6e4);

  const note = document.createElement("small"); note.id = "memnote";
  note.textContent = "Сайт запоминает, чем ты интересуешься (фото, песни, вкладки), и присылает это мне, чтобы следующий подарок вышел лучше. Не записывается то, что ты печатаешь, пока не нажала «сохранить», и ничего за пределами сайта. Выключить можно кнопкой «память» справа вверху.";
  $("#splash").firstElementChild.append(note);
  const mem = document.createElement("button"); mem.id = "mem"; mem.className = "btn";
  const lab = () => { mem.textContent = on ? "память: вкл" : "память: выкл"; };
  mem.onclick = () => { if (on) flush(); on = !on; set("memOn", on); lab(); }; lab(); document.body.append(mem);
})();
