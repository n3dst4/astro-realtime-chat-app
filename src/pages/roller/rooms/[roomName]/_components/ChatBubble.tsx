import type { RollerMessage } from "../../../../../workers/types";
import { DiceRollResult } from "./DiceRollResult";
import { TimeDisplay } from "./TimeDisplay";
import {
  memo,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type ChatBubbleProps = {
  message: RollerMessage;
};

export const ChatBubble = memo(({ message }: ChatBubbleProps) => {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [showMore, setShowMore] = useState(false);
  const [showShowMore, setShowShowMore] = useState(false);
  const dialogId = useId();

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
        className="w-fit rounded-2xl bg-pink-300 px-4 pt-1 text-base
          dark:bg-pink-900"
      >
        {message.text && (
          <>
            <p ref={textRef} className="line-clamp-3 overflow-hidden">
              {message.text}
            </p>
            {showShowMore && (
              <>
                <div className="text-center">
                  <button
                    command="show-modal"
                    commandfor={dialogId}
                    // onClick={() => setShowMore(true)}
                    className="btn btn-secondary btn-link h-auto px-2 py-0
                      text-sm"
                  >
                    Show more
                  </button>
                </div>
                <dialog
                  id={dialogId}
                  closedby="any"
                  className="m-auto w-200 backdrop:bg-black/50
                    backdrop:backdrop-blur-sm"
                >
                  {message.text}
                </dialog>
              </>
            )}
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
