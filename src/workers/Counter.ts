import { DurableObject } from "cloudflare:workers";

function assertNumber(value: any): asserts value is number {
  if (typeof value !== "number") {
    throw new Error(`Expected number, got ${typeof value}`);
  }
}

export class Counter extends DurableObject {
  sessions: WebSocket[] = [];
  value = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Restore hibernating WebSocket connections
    // When the DO wakes up, we need to restore session data from attachments
    // this.ctx.getWebSockets().forEach((ws) => {
    //   const attachment = ws.deserializeAttachment() as SessionAttachment | null;
    //   if (attachment) {
    //     this.sessions.push(ws);
    //   }
    // });

    // Set up automatic ping/pong responses
    // This keeps connections alive without waking the DO
    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong"),
    );

    // Load message history from storage on initialization
    this.ctx.blockConcurrencyWhile(async () => {
      const stored = await this.ctx.storage.get<number>("value");
      if (stored) this.value = stored;
    });
  }

  async getCounterValue() {
    let value = (await this.ctx.storage.get("value")) || 0;
    return value;
  }

  async increment(amount = 1) {
    let value = (await this.ctx.storage.get("value")) || 0;
    assertNumber(value);
    value += amount;
    // You do not have to worry about a concurrent request having modified the value in storage.
    // "input gates" will automatically protect against unwanted concurrency.
    // Read-modify-write is safe.
    await this.ctx.storage.put("value", value);
    return value;
  }

  async decrement(amount = 1) {
    let value = (await this.ctx.storage.get("value")) || 0;
    assertNumber(value);
    value -= amount;
    await this.ctx.storage.put("value", value);
    return value;
  }

  /**
   * Handle HTTP requests to this Durable Object
   * This is called when a client wants to establish a WebSocket connection
   */
  async fetchWS(request: Request): Promise<Response> {
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

    // Generate a unique session ID
    const id = crypto.randomUUID();

    // Create session attachment data
    // const attachment: SessionAttachment = { id, userId, username };

    // Serialize the attachment to the WebSocket
    // This data persists across hibernation cycles
    // server.serializeAttachment(attachment);

    // Add to active sessions
    // this.sessions.set(server, attachment);

    // Send message history to the newly connected client
    this.sendValue(server);

    // Broadcast join notification to all clients
    // this.broadcast({
    //   id: crypto.randomUUID(),
    //   type: "join",
    //   userId,
    //   username,
    //   timestamp: Date.now(),
    // });

    // Send current presence to the new user
    // this.sendPresence(server);

    // Return the client WebSocket in the response
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  broadcastValue() {
    for (const server of this.ctx.getWebSockets()) {
      this.sendValue(server);
    }
  }

  sendValue(server: WebSocket) {
    server.send(
      JSON.stringify({
        type: "value",
        value: this.value,
      }),
    );
  }
}
