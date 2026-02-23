import { Messages } from "../db/roller-schema";
import * as dbSchema from "../db/roller-schema";
import migrations from "../durable-object-migrations/roller/migrations";
import {
  sessionAttachmentSchema,
  webSocketClientMessageSchema,
  type RollerMessage,
  type SessionAttachment,
  type WebSocketServerMessage,
} from "./types";
import { DiceRoll } from "@dice-roller/rpg-dice-roller";
import { DurableObject } from "cloudflare:workers";
import { desc } from "drizzle-orm";
import { drizzle, DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";

const log = console.log.bind(console, "[Roller DO]");
const error = console.error.bind(console, "[Roller DO]");

export class DiceRollerRoom extends DurableObject {
  private sessions: Map<WebSocket, SessionAttachment>;
  private messages: RollerMessage[] = [];
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

    const tableNames = Object.keys(dbSchema);
    const query = `SELECT sql FROM sqlite_master WHERE name IN (${new Array(tableNames.length).fill("?").join(", ")})`;
    log(query, tableNames);
    const printedSchema = ctx.storage.sql
      .exec(query, ...tableNames)
      .toArray()
      .map((row) => row.sql)
      .join("\n");
    log("DB schema:", printedSchema);

    this.ctx.blockConcurrencyWhile(async () => {
      // migrate the db
      try {
        log("attempting migration");
        await migrate(this.db, migrations);
      } catch (e: any) {
        error("FAILED MIGRATION", e);
      }
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

    this.sendCatchUp(server);

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
    try {
      const parsed = webSocketClientMessageSchema.safeParse(
        JSON.parse(message as string),
      );
      if (!parsed.success) {
        console.error("Invalid message format:", parsed.error);
        return;
      }
      const data = parsed.data;
      if (data.type === "chat") {
        await this.runFormula(
          data.payload.formula,
          data.payload.text,
          data.payload.username,
          data.payload.userId,
        );
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
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

  async runFormula(
    formula: string | null,
    text: string | null,
    username: string,
    userId: string,
  ) {
    const roll = formula ? new DiceRoll(formula) : null;

    // Store the full structured rolls from the library so the frontend can
    // render dropped, exploded, rerolled, etc. with proper visual treatment.
    const structuredRolls = roll ? roll.toJSON().rolls : null;

    const rollerMessage: RollerMessage = {
      created_time: Date.now(),
      formula: formula ?? "no formula",
      id: crypto.randomUUID(),
      result: roll?.output ?? null,
      rolls: structuredRolls ? JSON.stringify(structuredRolls) : null,
      total: roll?.total ?? null,
      text,
      // username,
      userId,
      username,
    };
    await this.db.insert(Messages).values(rollerMessage);
    console.log("inserting into Messages", rollerMessage);
    this.broadcastMessage(rollerMessage);
  }

  broadcastMessage(message: RollerMessage) {
    for (const server of this.ctx.getWebSockets()) {
      this.sendMessage(server, message);
    }
  }

  async send(server: WebSocket, websocketMessage: WebSocketServerMessage) {
    server.send(JSON.stringify(websocketMessage));
  }

  async sendMessage(server: WebSocket, message: RollerMessage) {
    this.send(server, {
      type: "message",
      payload: {
        message,
      },
    });
  }

  async sendCatchUp(server: WebSocket) {
    const messages = (
      await this.db
        .select()
        .from(Messages)
        .orderBy(desc(Messages.created_time))
        .limit(100)
        .execute()
    ).toReversed();

    this.send(server, {
      type: "catchup",
      payload: {
        messages,
      },
    });
  }
}
