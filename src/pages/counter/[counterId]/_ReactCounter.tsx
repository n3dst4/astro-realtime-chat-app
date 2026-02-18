import { Button } from "../../../components/Button.tsx";
import { ReconnectingWebSocket } from "../../../utils/ReconnectingWebSocket";
import { useCallback, useEffect, useRef, useState } from "react";

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
  }, [counterId]);

  const handleIncrement = useCallback(() => {
    websocketRef.current?.json({ type: "increment" });
  }, []);

  const handleDecrement = useCallback(() => {
    websocketRef.current?.json({ type: "decrement" });
  }, []);

  return (
    <>
      <p>Counter Value is {counterValue}</p>
      <p>Connection status: {connectionStatus}</p>
      <button className="btn" onClick={handleIncrement}>
        Increment
      </button>{" "}
      <button className="btn" onClick={handleDecrement}>
        Decrement
      </button>
    </>
  );
};
