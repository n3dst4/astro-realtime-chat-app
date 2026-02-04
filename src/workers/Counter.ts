import { DurableObject } from "cloudflare:workers";

function assertNumber(value: any): asserts value is number {
  if (typeof value !== "number") {
    throw new Error(`Expected number, got ${typeof value}`);
  }
}

export class Counter extends DurableObject {
  sessions: WebSocket[] = [];

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
    // this.ctx.blockConcurrencyWhile(async () => {
    //   const stored = await this.ctx.storage.get<number>("value");
    //   if (stored) this.value = stored;
    // });
  }

  async getCounterValue() {
    let value = (await this.ctx.storage.get("value")) || 0;
    return Number(value);
  }

  async increment(amount = 1) {
    let value = (await this.ctx.storage.get("value")) || 0;
    assertNumber(value);
    value += amount;
    // You do not have to worry about a concurrent request having modified the value in storage.
    // "input gates" will automatically protect against unwanted concurrency.
    // Read-modify-write is safe.
    await this.ctx.storage.put("value", value);
    console.log("new value is ", value);
    this.broadcastValue();
    return value;
  }

  async decrement(amount = 1) {
    let value = (await this.ctx.storage.get("value")) || 0;
    assertNumber(value);
    value -= amount;
    await this.ctx.storage.put("value", value);
    this.broadcastValue();
    return value;
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

    // Generate a unique session ID
    const id = crypto.randomUUID();

    // Send message history to the newly connected client
    this.sendValue(server);

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
    ws: WebSocket,
    message: ArrayBuffer | string,
  ): Promise<void> {
    // Get session data from the map (or deserialize if just woken)
    try {
      const parsed = JSON.parse(message as string);
      if (parsed.type === "increment") {
        this.increment();
      }
      if (parsed.type === "decrement") {
        this.decrement();
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
