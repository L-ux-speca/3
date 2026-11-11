// Cloudflare Worker: принимает записки и желания с сайта и шлёт их в Telegram.
// Секреты в настройках воркера: BOT_TOKEN, CHAT_ID, SITE_KEY (+ необязательно ALLOWED_ORIGIN).
export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Key, X-Admin"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method === "GET") {
      // панель наблюдателя: нужен KV с привязкой STATS и секрет ADMIN_KEY
      if (new URL(request.url).pathname === "/stats" && env.STATS && env.ADMIN_KEY && request.headers.get("X-Admin") === env.ADMIN_KEY) {
        const l = await env.STATS.list({ prefix: "log:", limit: 500 });
        const rows = await Promise.all(l.keys.map(k => env.STATS.get(k.name, "json")));
        return new Response(JSON.stringify(rows.filter(Boolean)), { headers: { ...cors, "Content-Type": "application/json" } });
      }
      return new Response("ok", { headers: cors });
    }
    if (request.method !== "POST") return new Response("ok", { headers: cors });
    if (request.headers.get("X-Key") !== env.SITE_KEY) return new Response("forbidden", { status: 403, headers: cors });
    let body;
    try { body = await request.json(); } catch { return new Response("bad", { status: 400, headers: cors }); }
    const text = String(body.text || "").slice(0, 3500);
    if (!text) return new Response("empty", { status: 400, headers: cors });
    if (body.kind === "log" && env.STATS && body.data) { try { await env.STATS.put("log:" + Date.now(), JSON.stringify({ t: Date.now(), ...body.data })); } catch {} }
    const title = { wish: "Желание", log: "Отчёт о сессии" }[body.kind] || "Записка";
    const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text: title + ":\n\n" + text })
    });
    return new Response(r.ok ? "sent" : "fail", { status: r.ok ? 200 : 502, headers: cors });
  }
};
