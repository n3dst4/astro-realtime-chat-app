import { ReconnectingWebSocket } from "../../../../../utils/ReconnectingWebSocket";
import {
  webSocketMessageSchema,
  type RollerMessage,
} from "../../../../../workers/types";
import { Message } from "./Message";
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
        const incomingWebsocketMessage = webSocketMessageSchema.safeParse(
          JSON.parse(event.data),
        );
        if (!incomingWebsocketMessage.success) {
          console.error(
            "unknown incoming websocket message",
            incomingWebsocketMessage,
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
      ws.close();
    };
  }, [roomName]);

  const handleSubmit = useCallback(
    (event: SubmitEvent) => {
      event.preventDefault();
      websocketRef.current?.json({ type: "formula", payload: { formula } });
    },
    [formula],
  );

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
      <div className="flex-1 basis-0 overflow-auto px-4">
        {messages.map((message) => (
          <Message
            key={message.id}
            user={message.user}
            timeStamp={message.created_time}
          >
            {message.result}
          </Message>
        ))}
        {messages.length === 0 && (
          <div className="font-italic">No messages yet</div>
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
