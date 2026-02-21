import { Messages } from "../db/roller-schema";
import * as dbSchema from "../db/roller-schema";
import migrations from "../durable-object-migrations/roller/migrations";
import { DurableObject } from "cloudflare:workers";
import { drizzle, DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod/v4";

const sessionAttachmentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  username: z.string().min(1).max(100),
});

type SessionAttachment = z.infer<typeof sessionAttachmentSchema>;

const messageSchema = createSelectSchema(Messages);

type Message = z.infer<typeof messageSchema>;

export class Roller extends DurableObject {
  private sessions: Map<WebSocket, SessionAttachment>;
  private messages: Message[] = [];
  private readonly db: DrizzleSqliteDODatabase<typeof dbSchema>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    this.sessions = new Map();

    // Restore hibernating WebSocket connections
    // When the DO wakes up, we need to restore session data from attachments
    this.ctx.getWebSockets().forEach((websocket) => {
      const attachment = sessionAttachmentSchema.safeParse(
        websocket.deserializeAttachment(),
      );
      if (attachment.success) {
        this.sessions.set(websocket, attachment.data);
      }
    });

    // Set up automatic ping/pong responses
    // This keeps connections alive without waking the DO
    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong"),
    );

    this.db = drizzle(ctx.storage, { schema: dbSchema });

    this.ctx.blockConcurrencyWhile(async () => {
      // migrate the db
      await migrate(this.db, migrations);
      // load message history from storage
      this.messages = this.db.select().from(dbSchema.Messages).limit(100).all();
    });
  }

  /**
   * Handle HTTP requests to this Durable Object
   * This is called when a client wants to establish a WebSocket connection
   * This MUST be called `fetch`: it's the original API for interacting with
   * Durable Objects and can handle returning a Response object. Calls to any
   * other method go through RPC, which requires that all arguments and return
   * values must be serializable.
   *
   * Official docs:
   * https://developers.cloudflare.com/durable-objects/best-practices/create-durable-object-stubs-and-send-requests/#invoking-the-fetch-handler
   *
   * Blog post says the same thing but slower and louder:
   * https://flaredup.substack.com/i/161450113/synchronous-calls-with-fetch-and-rpc
   */
  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 426 });
    }
    // Create a WebSocket pair (client and server)
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket connection using the Hibernation API
    // Unlike server.accept(), this allows the DO to hibernate while
    // keeping the WebSocket connection open
    this.ctx.acceptWebSocket(server);

    // Return the client WebSocket in the response
    // return new Response("splat", { status: 200 });
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * Handle incoming WebSocket messages (Hibernation API)
   * Called when a message is received, even after hibernation
   */
  override async webSocketMessage(
    _ws: WebSocket,
    message: ArrayBuffer | string,
  ): Promise<void> {
    //
  }

  /**
   * Handle WebSocket close events (Hibernation API)
   * Called when a client disconnects
   */
  override async webSocketClose(
    ws: WebSocket,
    code: number,
    // reason: string,
    // wasClean: boolean,
  ): Promise<void> {
    // Close the WebSocket
    ws.close(code, "Durable Object is closing WebSocket");
  }

  /**
   * Handle WebSocket errors (Hibernation API)
   */
  override async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error("WebSocket error:", error);
    // Treat errors as disconnections
    await this.webSocketClose(ws, 1011); //, "WebSocket error", false);
  }

  broadcastValue() {
    for (const server of this.ctx.getWebSockets()) {
      this.sendValue(server);
    }
  }

  async sendValue(server: WebSocket) {
    server.send(
      JSON.stringify({
        type: "value",
        payload: await this.ctx.storage.get("value"),
      }),
    );
  }
}
