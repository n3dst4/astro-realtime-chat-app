import handler from "@astrojs/cloudflare/entrypoints/server";

export { ChatRoom } from "./ChatRoom";

export default {
  async fetch(request, env, ctx) {
    return handler.fetch(request, env, ctx);
  },
  async queue(batch, _env) {
    let messages = JSON.stringify(batch.messages);
    console.log(`consumed from our queue: ${messages}`);
  },
} satisfies ExportedHandler<Env>;
