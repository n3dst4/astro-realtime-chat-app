import { ReconnectingWebSocket } from "../../../../../utils/ReconnectingWebSocket";
import {
  webSocketServerMessageSchema,
  type RollerMessage,
  type WebSocketClientMessage,
} from "../../../../../workers/types";
import { Message } from "./Message";
import { useSmartScroll } from "./useSmartScroll";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";

type DiceRollerProps = {
  roomName: string;
};
type ConnectionStatus = "connected" | "disconnected" | "error";

export const DiceRoller = memo(({ roomName }: DiceRollerProps) => {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");

  const [messages, setMessages] = useState<RollerMessage[]>([]);

  const [formula, setFormula] = useState("");

  const websocketRef = useRef<ReconnectingWebSocket>(null);

  useEffect(() => {
    // const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // const host = window.location.host;

    // Build WebSocket URL
    const wsUrl = `../ws/?roomName=${roomName}`;

    // return;
    // Create WebSocket connection
    const ws = new ReconnectingWebSocket(wsUrl, {
      onopen: () => {
        setConnectionStatus("connected");
      },
      onmessage: (event) => {
        let blob: any;
        try {
          blob = JSON.parse(event.data);
        } catch (e: any) {
          console.error("Error parsing WebSocket message:", e);
          return;
        }
        const incomingWebsocketMessage =
          webSocketServerMessageSchema.safeParse(blob);
        if (!incomingWebsocketMessage.success) {
          console.error(
            "unknown incoming websocket message",
            incomingWebsocketMessage.error,
          );
          return;
        }
        const data = incomingWebsocketMessage.data;
        if (data.type === "message") {
          setMessages((old) => [...old, data.payload.message].slice(-100));
        } else if (data.type === "catchup") {
          setMessages(data.payload.messages);
        }
      },
      onclose: () => {
        setConnectionStatus("disconnected");
      },
      onerror: () => {
        setConnectionStatus("error");
      },
      keepaliveInterval: 30_000,
    });

    websocketRef.current = ws;

    return () => {
      console.log("Closing websocket because effect re-ran");
      ws.close();
    };
  }, [roomName]);

  const handleSubmit = useCallback(
    (event: SubmitEvent) => {
      event.preventDefault();
      const msg: WebSocketClientMessage = {
        type: "chat",
        payload: {
          formula: formula.toLowerCase(),
          text: "",
          userId: "xxx123",
          username: "Anon",
        },
      };
      websocketRef.current?.json(msg);
    },
    [formula],
  );

  const {
    scrollContainerRef,
    handleScroll,
    scrollToBottom,
    hasNewMessages,
    bottomRef,
  } = useSmartScroll({ messages });

  return (
    <div className="flex h-full w-full flex-col">
      <header className="bg-base-200 p-4">
        Connection status:
        <span
          data-connection-status={connectionStatus}
          aria-description={connectionStatus}
          className="ml-4 inline-block h-3 w-3 rounded-full bg-red-500 align-baseline data-[connection-status=connected]:bg-green-500"
        ></span>
      </header>
      <div className="relative flex-1 basis-0">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-auto px-4"
        >
          {messages.map((message) => (
            <Message
              key={message.id}
              // user={message.username}
              user={message.username}
              timeStamp={message.created_time}
            >
              {message.result}
            </Message>
          ))}
          {messages.length === 0 && (
            <div className="font-italic">No messages yet</div>
          )}
          <div ref={bottomRef} />
        </div>
        {hasNewMessages && (
          <button
            onClick={scrollToBottom}
            className="btn btn-primary btn-sm absolute bottom-4 left-1/2 -translate-x-1/2 shadow-lg"
          >
            ↓ New messages
          </button>
        )}
      </div>
      <form
        className="bg-base-200 join flex w-full flex-row p-4 pt-0 shadow-lg"
        onSubmit={handleSubmit}
      >
        <input
          className="input join-item input-primary flex-1 shadow-lg"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder='Enter a dice formula, e.g. "3d6"'
        />
        <div className="validator-hint hidden">Enter valid email address</div>
        <button className="btn btn-primary join-item">Send</button>
      </form>
    </div>
  );
});
