// Палитра сайта подстраивается под главный цвет фото: оттенок + насыщенность (яркий / пыльный)
(() => {
  const VARS = ["--blk","--bk","--bg1","--gl","--gl2","--dk","--m1","--m2","--m3","--ag","--ag2","--paper","--pline","--ink","--mt1","--mt2","--mt3","--mt4","--fg","--f1","--f2","--f3","--wa1","--wb1","--wa3","--wb3"];
  const hsl = (h, s, l) => { s /= 100; l /= 100; const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)].map(v => Math.round(v * 255)); };
  const H = (h, s, l) => "#" + hsl(h, s, l).map(v => v.toString(16).padStart(2, "0")).join(""), R = (h, s, l) => hsl(h, s, l).join(",");
  function paint(h, sat) {
    const k = sat < 0.35 ? 0.45 : sat < 0.6 ? 0.75 : 1, s = x => Math.round(x * k), cool = h > 180 && h < 290;
    const v = {
      "--blk": H(h, s(40), 3), "--bk": R(h, s(40), 3), "--bg1": H(h, s(45), 9), "--gl": R(h, s(70), 22), "--gl2": R(h, s(70), 45),
      "--dk": H(h, s(45), 6), "--m1": H(h, s(60), 18), "--m2": H(h, s(62), 30), "--m3": H(h, s(70), 52),
      "--ag": H(h, 16, 84), "--ag2": H(h, 10, 58), "--paper": H(h, 14, 82), "--pline": H(h, 12, 50) + "66", "--ink": H(h, 45, 12),
      "--mt1": H(h, 12, 86), "--mt2": H(h, 10, 45), "--mt3": H(h, 12, 76), "--mt4": H(h, 10, 32),
      "--wa1": H(h, s(60), 12), "--wb1": H(h, s(60), 38), "--wa3": H(h, 10, 55), "--wb3": H(h, 15, 90),
      ...(cool ? { "--fg": "110,175,255", "--f1": "#e4f3ff", "--f2": "#7ab8ff", "--f3": "#2f6fd0" } : { "--fg": "255,138,42", "--f1": "#ffe39a", "--f2": "#ff9b2e", "--f3": "#d4380d" })
    };
    Object.entries(v).forEach(([a, b]) => document.documentElement.style.setProperty(a, b));
  }
  function dominant(img) {
    const n = 48, c = document.createElement("canvas"); c.width = c.height = n;
    const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0, n, n);
    const d = x.getImageData(0, 0, n, n).data, bins = Array(36).fill(0), sat = Array(36).fill(0), cnt = Array(36).fill(0);
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255, mx = Math.max(r, g, b), dl = mx - Math.min(r, g, b);
      if (mx < 0.15 || dl < 0.08 || dl / mx < 0.2) continue;
      const h = mx === r ? ((g - b) / dl + 6) % 6 : mx === g ? (b - r) / dl + 2 : (r - g) / dl + 4, bi = Math.floor(h * 6) % 36;
      bins[bi] += (dl / mx) * mx; sat[bi] += dl / mx; cnt[bi]++;
    }
    let best = -1, bw = 0;
    for (let i = 0; i < 36; i++) { const w = bins[i] + 0.5 * (bins[(i + 35) % 36] + bins[(i + 1) % 36]); if (w > bw) { bw = w; best = i; } }
    return best < 0 || bw < 3 ? null : { h: best * 10 + 5, s: sat[best] / (cnt[best] || 1) };
  }
  window.adapt = img => {
    if (document.documentElement.dataset.theme !== "auto") return;
    try { const r = dominant(img); if (r) paint(r.h, r.s); } catch (e) {}
  };
  window.adaptCurrent = () => {
    const img = document.querySelector(cur === 3 ? "#t3 .photo" : "#t0 .photo");
    if (img && img.complete && img.naturalWidth) adapt(img);
  };
  window.clearPaint = () => VARS.forEach(v => document.documentElement.style.removeProperty(v));
})();
