import { ReconnectingWebSocket } from "../../../../../utils/ReconnectingWebSocket";
import type { RollerMessage } from "../../../../../workers/Roller";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";

type DiceRollerProps = {
  roomName: string;
};
type ConnectionStatus = "connected" | "disconnected" | "error";

export const DiceRoller = ({ roomName }: DiceRollerProps) => {
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
        const data = JSON.parse(event.data);
        if (data.type && data.type === "messages") {
          setMessages((old) => [...old, ...data.payload.messages]);
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

  const handleSubmit = useCallback((event: SubmitEvent) => {
    event.preventDefault();
    websocketRef.current?.json({ type: "formula", payload: { formula } });
  }, []);

  return (
    <>
      <p>
        Connection status:
        <span
          data-connection-status={connectionStatus}
          className="ml-4 inline-block h-3 w-3 rounded-full bg-red-500 align-baseline data-[connection-status=connected]:bg-green-500"
        ></span>
      </p>
      {messages.map((message) => (
        <div>
          {message.created_time} ({message.user}): {message.formula} &mdash;&gt;{" "}
          {message.result}{" "}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          className="input input-primary"
          placeholder="Enter formula..."
        ></input>
        <button className="btn btn-primary">Send</button>
      </form>
    </>
  );
};
