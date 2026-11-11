// Звуки берутся из папки sounds/. Нет файла - нет звука.
const sfx = (() => {
  const vol = { ambient: 0.35, vinyl: 0.25, match: 0.6, tab: 0.5, paper: 0.5, photo: 0.4, bell: 0.6, click: 0.3, needle: 0.5, key: 0.25 };
  const A = {};
  let on = true, ducked = false, started = false, vin = false, lv = 1;
  try { on = localStorage.getItem("sfx") !== "0"; } catch (e) {}
  Object.keys(vol).forEach(n => {
    const a = new Audio("sounds/" + n + ".mp3");
    a.preload = "auto"; a.volume = vol[n]; a.loop = n === "ambient" || n === "vinyl";
    a.onerror = () => { a.missing = true; };
    A[n] = a;
  });
  const once = n => {
    const a = A[n];
    if (!on || ducked || !started || a.missing) return;
    const c = a.cloneNode(); c.volume = vol[n] * lv; c.play().catch(() => {});
  };
  const loop = (n, v) => {
    const a = A[n]; if (a.missing) return;
    if (v && on && !ducked && started) a.play().catch(() => {}); else a.pause();
  };
  const sync = () => { loop("ambient", true); loop("vinyl", vin); };
  return {
    start() { const f = !started; started = true; if (f) once("match"); sync(); },
    tab: () => once("tab"), paper: () => once("paper"), photo: () => once("photo"),
    bell: () => once("bell"), tick: () => once("click"),
    vinyl(v) { vin = v; if (v) once("needle"); sync(); },
    duck(v) { ducked = v; sync(); },
    toggle() { on = !on; try { localStorage.setItem("sfx", on ? "1" : "0"); } catch (e) {} sync(); return on; },
    isOn: () => on,
    key: () => once("key"),
    level(x) { lv = x; Object.keys(A).forEach(n => { A[n].volume = vol[n] * lv; }); }
  };
})();
