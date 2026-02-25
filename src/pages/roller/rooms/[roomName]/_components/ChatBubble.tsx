import type { RollerMessage } from "../../../../../workers/types";
import { DiceRollResult } from "./DiceRollResult";
import { ShowMoreDialog } from "./ShowMoreDialog";
import { TimeDisplay } from "./TimeDisplay";
import { memo, useLayoutEffect, useRef, useState } from "react";

type ChatBubbleProps = {
  message: RollerMessage;
};

export const ChatBubble = memo(({ message }: ChatBubbleProps) => {
  const textRef = useRef<HTMLParagraphElement>(null);
  // const [showMore, setShowMore] = useState(false);
  const [showShowMore, setShowShowMore] = useState(false);

  useLayoutEffect(() => {
    function checkHeight() {
      if (textRef.current) {
        setShowShowMore(
          textRef.current.scrollHeight > textRef.current.clientHeight,
        );
      }
    }
    const resizeObserver = new ResizeObserver(checkHeight);
    if (textRef.current) {
      resizeObserver.observe(textRef.current!);
      checkHeight();
      return () => resizeObserver.disconnect();
    }
  }, []);

  return (
    <article className="mb-2">
      <header className="text-sm">
        <span className="mr-4">{message.username}</span>
        <TimeDisplay timeStamp={message.created_time} />
      </header>
      <div
        className="w-fit rounded-lg bg-pink-300 px-4 pt-1 text-base
          dark:bg-pink-900"
      >
        {message.text && (
          <>
            <p ref={textRef} className="m-0 line-clamp-3 overflow-hidden p-0">
              {message.text}
            </p>
            {showShowMore && <ShowMoreDialog message={message} />}
          </>
        )}
        <DiceRollResult
          formula={message.formula}
          rolls={message.rolls}
          total={message.total}
        />
      </div>
    </article>
  );
});
