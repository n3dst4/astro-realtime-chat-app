import { type WebSocketClientMessage } from "../../../../../workers/types";
import { ChatBubble } from "./ChatBubble";
import { ChatForm } from "./ChatForm";
import { UsernameDialog } from "./UsernameDialog";
import { useChatWebSocket } from "./useChatWebSocket";
import { useSmartScroll } from "./useSmartScroll";
import { memo, useCallback, useEffect, useState } from "react";
import type { SubmitEvent } from "react";

type DiceRollerProps = {
  roomName: string;
};

export const DiceRoller = memo(({ roomName }: DiceRollerProps) => {
  const [username, setUsername] = useState<string>(
    localStorage.getItem("username") ?? "",
  );
  const [userId, setUserId] = useState<string>(
    localStorage.getItem("userId") ?? "",
  );

  const [formula, setFormula] = useState("");
  const [text, setText] = useState("");

  const { connectionStatus, messages, sendJSON } = useChatWebSocket({
    roomName,
  });

  const handleSubmit = useCallback(
    (event: SubmitEvent) => {
      event.preventDefault();
      const msg: WebSocketClientMessage = {
        type: "chat",
        payload: {
          formula: formula.toLowerCase(),
          text,
          userId,
          username,
        },
      };
      sendJSON(msg);
    },
    [formula, text],
  );

  useEffect(() => {
    if (userId === "") {
      const newUserId = crypto.randomUUID();
      localStorage.setItem("userId", newUserId);
      setUserId(newUserId);
    }
  }, []);

  const {
    scrollContainerRef,
    handleScroll,
    scrollToBottom,
    hasNewMessages,
    bottomRef,
  } = useSmartScroll({ messages });

  const handleSetUsername = useCallback((newUsername: string) => {
    setUsername(newUsername);
    localStorage.setItem("username", newUsername);
  }, []);

  return (
    <div className="@container-[size] flex h-full w-full flex-col">
      <header className="bg-base-200 flex flex-row px-4">
        <div className="flex-1" />
        <UsernameDialog
          initialUsername={username}
          onSetUsername={handleSetUsername}
        />
        <div
          className="text-middle ml-4 inline-flex h-(--size) flex-col
            justify-center"
        >
          Connection status:
        </div>
        <div
          className="text-middle inline-flex h-(--size) flex-col justify-center"
        >
          <span
            data-connection-status={connectionStatus}
            aria-description={connectionStatus}
            className="text-middle ml-4 inline-block h-3 w-3 rounded-full
              bg-red-500 align-baseline
              data-[connection-status=connected]:bg-green-500"
          ></span>
        </div>
      </header>
      <div className="relative flex-1 basis-0">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-auto px-4"
        >
          {messages.map((message) => (
            <ChatBubble key={message.id} message={message}></ChatBubble>
          ))}
          {messages.length === 0 && (
            <div className="font-italic">No messages yet</div>
          )}
          <div ref={bottomRef} />
        </div>
        {hasNewMessages && (
          <button
            onClick={scrollToBottom}
            className="btn btn-primary btn-sm absolute bottom-4 left-1/2
              -translate-x-1/2 shadow-lg"
          >
            ↓ New messages
          </button>
        )}
      </div>
      <ChatForm
        formula={formula}
        text={text}
        onFormulaChange={setFormula}
        onTextChange={setText}
        onSubmit={handleSubmit}
      />
    </div>
  );
});
