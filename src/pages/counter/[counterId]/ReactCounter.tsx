import { useCallback, useEffect, useRef, useState } from "react";
import { ReconnectingWebSocket } from "../../../utils/ReconnectingWebSocket";

type ReactCounterProps = {
  counterId: string;
  initialCounterValue: number;
};

type ConnectionStatus = "connected" | "disconnected" | "error";

export const ReactCounter = ({
  counterId,
  initialCounterValue,
}: ReactCounterProps) => {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");

  const [counterValue, setCounterValue] = useState<number>(initialCounterValue);

  const websocketRef = useRef<ReconnectingWebSocket>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;

    // Build WebSocket URL
    const wsUrl = `${protocol}//${host}/counter/api/${counterId}/ws`;

    // Create WebSocket connection
    const ws = new ReconnectingWebSocket(wsUrl, {
      onopen: () => {
        setConnectionStatus("connected");
      },
      onmessage: (event) => {
        const data = JSON.parse(event.data);
        if (data.type && data.type === "value") {
          setCounterValue(data.payload);
        }
      },
      onclose: (event) => {
        setConnectionStatus("disconnected");
      },
      onerror: (error) => {
        setConnectionStatus("error");
      },
      keepaliveInterval: 30_000,
    });

    websocketRef.current = ws;

    return () => {
      ws.close();
    };
  }, [counterId]);

  const handleIncrement = useCallback(() => {
    websocketRef.current?.json({ type: "increment" });
  }, []);

  const handleDecrement = useCallback(() => {
    websocketRef.current?.json({ type: "decrement" });
  }, []);

  return (
    <>
      <h1>React + Websockets! Counter Value is {counterValue}</h1>
      <p>Connection status: {connectionStatus}</p>

      <button onClick={handleIncrement}>Increment</button>
      <button onClick={handleDecrement}>Decrement</button>
    </>
  );
};
