const $ = s => document.querySelector(s);
const NAMES = ["Алтарь", "Кружки", "Записка", "Для тебя"];
let C, F, cur = 0;
const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
let unlocked = get("unlocked", false);
document.documentElement.dataset.theme = get("theme2", "auto");
function setTheme(k) {
  document.documentElement.dataset.theme = k; set("theme2", k); if (k === "auto") adaptCurrent(); else clearPaint();
  document.querySelectorAll("#themes .btn").forEach(b => b.classList.toggle("cur", b.dataset.k === k));
}
const base = n => n.replace(/\.[^.]+$/, "");
const url = (dir, n) => dir + "/" + encodeURIComponent(n);

Promise.all([
  fetch("data/content.json").then(r => r.json()),
  fetch("data/files.json").then(r => r.json()),
  fetch("data/extras.json").then(r => r.json()).catch(() => ({}))
]).then(([c, f, e]) => { C = { ...e, ...c }; F = f; init(); })
  .catch(() => { $("#sTitle").textContent = "Не найден data/files.json — запусти update-lists.ps1"; });

const cands = n => Array.from({ length: n }, () => `<b class="cd" style="--h:${40 + Math.random() * 90 | 0}px;--w:${12 + Math.random() * 9 | 0}px;--d:-${(Math.random() * 3).toFixed(1)}s"><i></i><s></s></b>`).join("");
const TPL = () => '<aside class="notes"><div class="nb"><h3>Записки</h3><div class="pg"></div></div></aside><div class="altar"><div class="stage"><svg class="sigil s1" viewBox="0 0 100 100"><circle cx="50" cy="50" r="47"/><circle cx="50" cy="50" r="43"/><polygon points="50,90 26.5,17.6 88,62.4 12,62.4 73.5,17.6"/></svg><svg class="sigil s2" viewBox="0 0 100 100"><circle cx="50" cy="50" r="47"/><circle cx="50" cy="50" r="43"/><path d="M58,22 A30,30 0 1 0 58,78 A40,40 0 0 1 58,22Z"/><circle cx="74" cy="30" r="1.5"/><circle cx="80" cy="52" r="1"/><circle cx="70" cy="72" r="1.5"/></svg><svg class="sigil s3" viewBox="0 0 100 100"><circle cx="50" cy="50" r="47"/><circle cx="50" cy="50" r="43"/><rect x="22" y="22" width="56" height="56"/><rect x="22" y="22" width="56" height="56" transform="rotate(45 50 50)"/><circle cx="50" cy="50" r="14"/></svg><div class="cands">' + cands(4) + '</div><div class="fw"><div class="frame"><img class="photo" alt=""></div></div><div class="cands">' + cands(4) + '</div></div><div class="table"></div><p class="cap"></p><button class="next btn">следующее фото</button><button class="flt btn">вид: обычный</button></div><aside class="pslot"></aside>';

function makeAltar(root, dir, files) {
  root.innerHTML = TPL();
  const img = root.querySelector(".photo"), cap = root.querySelector(".cap");
  let idx = -1, timer;
  function show() {
    if (!files.length) { cap.textContent = "В папке " + dir + " пока нет фото"; return; }
    let i;
    do { i = Math.floor(Math.random() * files.length); } while (i === idx && files.length > 1);
    idx = i;
    const name = files[i];
    img.classList.add("fade");
    setTimeout(() => {
      img.onload = img.onerror = () => { img.classList.remove("fade"); if (root.classList.contains("on")) adapt(img); if (window.develop) develop(img); };
      img.src = url(dir, name); sfx.photo();
      cap.textContent = (C.captions || {})[name] || "";
      const box = root.querySelector(".pg"); box.innerHTML = "";
      const list = (C.notes || {})[name] || [];
      if (!list.length) box.innerHTML = "<em>Здесь пока пусто</em>";
      list.forEach(n => {
        const b = document.createElement("button");
        b.className = "note"; b.innerHTML = "<b></b><span></span>";
        b.firstChild.textContent = n.title; b.lastChild.textContent = n.text;
        const left = n.until ? Math.ceil((new Date(n.until) - Date.now()) / 864e5) : 0;
        if (left > 0) { b.lastChild.textContent = "Запечатано. Откроется через " + left + " дн."; b.style.opacity = .7; b.classList.add("sealed", "fut"); b.onclick = sfx.tick; }
        else {
          const bk = get("broken", []);
          if (n.seal && !bk.includes(n.title)) b.classList.add("sealed");
          b.onclick = () => {
            if (b.classList.contains("sealed")) { b.classList.remove("sealed"); set("broken", bk.concat(n.title)); sfx.paper(); setTimeout(() => openModal(n.title, n.text), 450); }
            else openModal(n.title, n.text);
          };
        }
        box.append(b);
      });
    }, 600);
    clearTimeout(timer);
    timer = setTimeout(show, (180 + Math.random() * 120) * 1000); // 3–5 минут
  }
  root.querySelector(".next").onclick = show;
  show();
}

function init() {
  $("#sTitle").textContent = C.title || "Для тебя";
  $("#hint").textContent = C.hint || "";
  NAMES.forEach((n, i) => {
    const b = document.createElement("button");
    b.textContent = n; b.id = "b" + i; b.onclick = () => go(i);
    $("#tabs").append(b);
  });
  $("#b3").hidden = !unlocked;

  makeAltar($("#t0"), "photos", F.photos || []);
  makeAltar($("#t3"), "my-photos", F.myPhotos || []);

  const pl = document.createElement("div");
  pl.id = "player";
  pl.innerHTML = '<h3>Её песня</h3><div class="deck"><div class="vinyl"><div class="lab"></div></div><div class="arm"></div></div><p id="song"></p><div class="ctl"><button id="pp" class="btn">играть</button><input id="seek" type="range" min="0" max="100" value="0" step="0.1"><span id="tm">0:00 / 0:00</span></div><label class="vl">громкость<input id="vol" type="range" min="0" max="1" step="0.05" value="1"></label><audio id="audio" loop></audio><label class="btn">загрузить свою<input id="file" type="file" accept="audio/*" hidden></label>';
  $("#t0 .pslot").append(pl);
  const audio = $("#audio"), track = (F.music || [])[0];
  if (track) { audio.src = url("music", track); $("#song").textContent = C.songTitle || base(track); }
  else $("#song").textContent = "Положи mp3 в папку music";
  const pp = $("#pp"), seek = $("#seek"), fmt = t => isFinite(t) ? Math.floor(t / 60) + ":" + String(Math.floor(t % 60)).padStart(2, "0") : "0:00";
  const vol = $("#vol");
  vol.max = "0.5";
  vol.value = "0.5";
  audio.volume = 0;
  let audioFadeTimer = 0, audioFadeFrame = 0;
  function playWithFade() {
    clearTimeout(audioFadeTimer);
    cancelAnimationFrame(audioFadeFrame);
    audio.volume = 0;
    const target = Math.min(0.5, Math.max(0, Number(vol.value) || 0.5));
    audio.play().then(() => {
      audioFadeTimer = setTimeout(() => {
        const started = performance.now(), duration = 2200;
        const ramp = now => {
          if (audio.paused) return;
          const k = Math.min(1, (now - started) / duration);
          audio.volume = target * k;
          if (k < 1) audioFadeFrame = requestAnimationFrame(ramp);
        };
        audioFadeFrame = requestAnimationFrame(ramp);
      }, 650);
    }).catch(() => {});
  }
  pp.onclick = () => {
    if (audio.paused) playWithFade();
    else audio.pause();
  };
  audio.onplay = () => { pl.classList.add("on"); sfx.vinyl(true); pp.textContent = "пауза"; };
  audio.onpause = () => { pl.classList.remove("on"); sfx.vinyl(false); pp.textContent = "играть"; };
  audio.ontimeupdate = () => { seek.value = audio.duration ? audio.currentTime / audio.duration * 100 : 0; $("#tm").textContent = fmt(audio.currentTime) + " / " + fmt(audio.duration); };
  seek.oninput = () => { if (audio.duration) audio.currentTime = seek.value / 100 * audio.duration; };
  vol.oninput = e => {
    clearTimeout(audioFadeTimer);
    cancelAnimationFrame(audioFadeFrame);
    audio.volume = Math.min(0.5, Math.max(0, Number(e.target.value) || 0));
  };
  if (window.setupPlaylist) setupPlaylist();

  $("#file").onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    audio.src = URL.createObjectURL(f); $("#song").textContent = f.name; audio.play();
  };
  const splash = $("#splash");
  const enterSite = () => {
    if (splash.classList.contains("gone")) return;
    splash.classList.add("gone");
    // Удаляем заставку из DOM после завершения затемнения, чтобы она не оставалась слоем над сайтом.
    setTimeout(() => splash.remove(), 1300);
    sfx.start();
    playWithFade();
    document.dispatchEvent(new CustomEvent("gift:enter"));
  };
  splash.addEventListener("click", enterSite);
  splash.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      enterSite();
    }
  });
  $("#save").onclick = saveNote;
  $("#dl").onclick = download;
  $("#close").onclick = closeModal;
  $("#modal").onclick = e => { if (e.target.id === "modal") closeModal(); };
  document.addEventListener("keydown", onKey);
  const snd = document.createElement("button");
  snd.id = "snd"; snd.className = "btn";
  const lab = () => { snd.textContent = sfx.isOn() ? "эффекты: вкл" : "эффекты: выкл"; };
  snd.onclick = () => { sfx.toggle(); lab(); }; lab(); document.body.append(snd);
  const th = document.createElement("div"); th.id = "themes";
  [["auto", "Авто"], ["wine", "Бордо"], ["moon", "Склеп"], ["gold", "Золото"]].forEach(([k, n]) => {
    const b = document.createElement("button");
    b.className = "btn"; b.textContent = n; b.dataset.k = k; b.onclick = () => setTheme(k); th.append(b);
  });
  document.body.append(th); setTheme(get("theme2", "auto"));
  document.addEventListener("click", e => { if (e.target.closest(".btn")) sfx.tick(); });
  renderVideos(); renderSaved(); go(0);
}

function visible() { return [0, 1, 2].concat(unlocked ? [3] : []); }

function go(n) {
  if (n === 3 && !unlocked) return;
  cur = n; sfx.tab(); document.body.dataset.tab = n; adaptCurrent();
  document.querySelectorAll(".tab").forEach((t, i) => t.classList.toggle("on", i === n));
  document.querySelectorAll("#tabs button").forEach((b, i) => b.classList.toggle("on", i === n));
  if (n === 0 || n === 3) $("#t" + n + " .pslot").append($("#player"));
}

function onKey(e) {
  if (e.key === "Escape") return closeModal();
  if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  const v = visible(), i = v.indexOf(cur);
  if (e.key === "ArrowRight") go(v[(i + 1) % v.length]);
  if (e.key === "ArrowLeft") go(v[(i - 1 + v.length) % v.length]);
}

function openModal(title, text) {
  const m = $("#modal");
  m.querySelector("h2").textContent = title || "";
  m.querySelector("p").textContent = text || "";
  m.classList.add("on"); sfx.paper();
}
function closeModal() { if ($("#modal").classList.contains("on")) sfx.paper(); $("#modal").classList.remove("on"); }

function renderVideos() {
  const box = $("#videos");
  (F.videos || []).forEach(name => {
    const f = document.createElement("figure");
    f.innerHTML = '<video controls playsinline preload="metadata"></video><figcaption></figcaption>';
    const el = f.firstChild; el.src = url("videos", name);
    f.lastChild.textContent = (C.videoTitles || {})[name] || base(name);
    el.onpause = el.onended = () => sfx.duck(false);
    el.onplay = () => { sfx.duck(true); $("#audio").pause(); box.querySelectorAll("video").forEach(o => o !== el && o.pause()); };
    box.append(f);
  });
}

function saveNote() {
  const text = $("#text").value.trim();
  if (!text) return;
  const all = get("notes", []);
  all.unshift({ text, date: new Date().toLocaleString("ru-RU") });
  set("notes", all);
  notify(text, "note");
  const hit = Object.keys(C.secrets || {}).find(k => text.toLowerCase().includes(k.toLowerCase()));
  if (hit) setTimeout(() => openModal(C.secrets[hit].title, C.secrets[hit].text), 700);
  $("#text").value = ""; renderSaved();
  const word = (C.secretWord || "").toLowerCase();
  if (word && text.toLowerCase().includes(word) && !unlocked) {
    unlocked = true; set("unlocked", true); sfx.bell();
    $("#b3").hidden = false;
    $("#msg").textContent = C.unlockMessage || "Открылась ещё одна вкладка.";
    setTimeout(() => go(3), 2200);
  } else {
    $("#msg").textContent = "Записка сохранена."; sfx.paper();
  }
}

function renderSaved() {
  const box = $("#saved"); box.innerHTML = "";
  get("notes", []).forEach(n => {
    const d = document.createElement("div");
    d.className = "saved"; d.innerHTML = "<small></small><span></span>";
    d.firstChild.textContent = n.date; d.lastChild.textContent = n.text;
    box.append(d);
  });
}

function download() {
  const all = get("notes", []);
  if (!all.length) { $("#msg").textContent = "Пока нет записок."; return; }
  const txt = all.map(n => n.date + "\n" + n.text).join("\n\n---\n\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain;charset=utf-8" }));
  a.download = "записки.txt"; a.click();
}

function notify(text, kind) {
  if (!C.notifyUrl) return;
  fetch(C.notifyUrl, { method: "POST", headers: { "Content-Type": "application/json", "X-Key": C.notifyKey || "" }, body: JSON.stringify({ text, kind }) }).catch(() => {});
}
