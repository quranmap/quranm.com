// Cloudflare Pages Function: only runs for the SEO paths listed in /_routes.json.
// Everything else (the SPA at /) is served as static assets, unchanged.
import { handle } from "../seo-src/handler.js";

export async function onRequest(ctx) {
  try {
    return await handle(ctx);
  } catch (err) {
    return new Response("Temporary error", { status: 503, headers: { "retry-after": "60", "cache-control": "no-store" } });
  }
}
