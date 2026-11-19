import { todayResponse } from "../../seo-src/features/widget.js";

export async function onRequest(ctx) {
  if (ctx.request.method !== "GET" && ctx.request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
  return todayResponse(ctx, ctx.request.url);
}
