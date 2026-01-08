import { handle } from "@astrojs/cloudflare/handler";
import type { SSRManifest } from "astro";
import { App } from "astro/app";
import { DurableObject } from "cloudflare:workers";

interface SessionAttachment {
  id: string;
  userId: string;
  username: string;
}

interface ChatMessage {
  id: string;
  type: "message" | "join" | "leave" | "presence";
  userId: string;
  username: string;
  content?: string;
  timestamp: number;
}

class ChatRoom extends DurableObject<ENV> {
  // Map of WebSocket -> session data
  // When the DO hibernates, this gets reconstructed in the constructor
  private sessions: Map<WebSocket, SessionAttachment>;
  private messageHistory: ChatMessage[];

  constructor(ctx: DurableObjectState, env: ENV) {
    super(ctx, env);

    this.sessions = new Map();
    this.messageHistory = [];

    // Restore hibernating WebSocket connections
    // When the DO wakes up, we need to restore session data from attachments
    this.ctx.getWebSockets().forEach((ws) => {
      const attachment = ws.deserializeAttachment() as SessionAttachment | null;
      if (attachment) {
        this.sessions.set(ws, attachment);
      }
    });

    // Set up automatic ping/pong responses
    // This keeps connections alive without waking the DO
    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong"),
    );

    // Load message history from storage on initialization
    this.ctx.blockConcurrencyWhile(async () => {
      const stored = await this.ctx.storage.get<ChatMessage[]>("messages");
      if (stored) this.messageHistory = stored;
    });
  }

  /**
   * Handle HTTP requests to this Durable Object
   * This is called when a client wants to establish a WebSocket connection
   */
  async fetch(request: Request): Promise<Response> {
    // Parse the URL to get query parameters (userId and username)
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const username = url.searchParams.get("username");
    if (!userId || !username)
      return new Response("Missing userId or username", { status: 400 });
    // Expect a WebSocket upgrade request
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket")
      return new Response("Expected WebSocket upgrade", { status: 426 });
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
    const attachment: SessionAttachment = { id, userId, username };

    // Serialize the attachment to the WebSocket
    // This data persists across hibernation cycles
    server.serializeAttachment(attachment);

    // Add to active sessions
    this.sessions.set(server, attachment);

    // Send message history to the newly connected client
    this.sendMessageHistory(server);

    // Broadcast join notification to all clients
    this.broadcast({
      id: crypto.randomUUID(),
      type: "join",
      userId,
      username,
      timestamp: Date.now(),
    });

    // Send current presence to the new user
    this.sendPresence(server);

    // Return the client WebSocket in the response
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * Handle incoming WebSocket messages (Hibernation API)
   * Called when a message is received, even after hibernation
   */
  async webSocketMessage(
    ws: WebSocket,
    message: ArrayBuffer | string,
  ): Promise<void> {
    // Get session data from the map (or deserialize if just woken)
    let session = this.sessions.get(ws);
    if (!session) {
      session = ws.deserializeAttachment() as SessionAttachment;
      if (session) this.sessions.set(ws, session);
    }
    if (!session) return;

    try {
      const parsed = JSON.parse(message as string);
      if (parsed.type === "message" && parsed.content) {
        // Create a chat message
        const chatMessage: ChatMessage = {
          id: crypto.randomUUID(),
          type: "message",
          userId: session.userId,
          username: session.username,
          content: parsed.content,
          timestamp: Date.now(),
        };

        // Add to history
        this.messageHistory.push(chatMessage);
        // Persist to storage (limit to last 100 messages)
        if (this.messageHistory.length > 100)
          this.messageHistory = this.messageHistory.slice(-100);
        this.ctx.storage.put("messages", this.messageHistory);

        // Broadcast to all connected clients
        this.broadcast(chatMessage);
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }

  /**
   * Handle WebSocket close events (Hibernation API)
   * Called when a client disconnects
   */
  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ): Promise<void> {
    // Get session data
    const session =
      this.sessions.get(ws) ||
      (ws.deserializeAttachment() as SessionAttachment | null);

    // Remove from sessions
    this.sessions.delete(ws);

    // Broadcast leave notification
    if (session) {
      this.broadcast({
        id: crypto.randomUUID(),
        type: "leave",
        userId: session.userId,
        username: session.username,
        timestamp: Date.now(),
      });
    }

    // Close the WebSocket
    ws.close(code, "Durable Object is closing WebSocket");
  }

  /**
   * Handle WebSocket errors (Hibernation API)
   */
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error("WebSocket error:", error);
    // Treat errors as disconnections
    await this.webSocketClose(ws, 1011, "WebSocket error", false);
  }

  /**
   * Broadcast a message to all connected clients
   */
  private broadcast(message: ChatMessage): void {
    const messageStr = JSON.stringify(message);

    // Send to all active sessions
    this.sessions.forEach((_, ws) => {
      try {
        ws.send(messageStr);
      } catch (error) {
        // Connection might be closed, will be cleaned up by close handler
        console.error("Error broadcasting to session:", error);
      }
    });
  }

  /**
   * Send message history to a specific WebSocket
   */
  private sendMessageHistory(ws: WebSocket): void {
    const historyMessage = JSON.stringify({
      type: "history",
      messages: this.messageHistory,
    });
    try {
      ws.send(historyMessage);
    } catch (error) {
      console.error("Error sending history:", error);
    }
  }

  /**
   * Send current user presence to a specific WebSocket
   */
  private sendPresence(ws: WebSocket): void {
    const users = Array.from(this.sessions.values()).map((s) => ({
      userId: s.userId,
      username: s.username,
    }));
    const presenceMessage = JSON.stringify({
      type: "presence",
      users,
    });

    try {
      ws.send(presenceMessage);
    } catch (error) {
      console.error("Error sending presence:", error);
    }
  }

  /**
   * Handle Durable Object alarm for cleanup tasks
   */
  async alarm(): Promise<void> {
    // Clean up old messages (older than 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.messageHistory = this.messageHistory.filter(
      (msg) => msg.timestamp > oneDayAgo,
    );
    await this.ctx.storage.put("messages", this.messageHistory);
    // Schedule next cleanup in 1 hour
    await this.ctx.storage.setAlarm(Date.now() + 60 * 60 * 1000);
  }
}

export function createExports(manifest: SSRManifest) {
  const app = new App(manifest);
  return {
    default: {
      async fetch(request, env, ctx) {
        // @ts-expect-error - request is not typed correctly
        return handle(manifest, app, request, env, ctx);
      },
    } satisfies ExportedHandler<ENV>,
    ChatRoom,
  };
}
