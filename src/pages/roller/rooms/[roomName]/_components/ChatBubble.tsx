import { TimeDisplay } from "./TimeDisplay";
import { memo, type PropsWithChildren } from "react";

type ChatBubbleProps = PropsWithChildren<{
  user: string;
  timeStamp: number;
}>;

export const ChatBubble = memo(
  ({ user, timeStamp, children }: ChatBubbleProps) => {
    return (
      <article className="mb-2">
        <header className="text-sm">
          <span className="mr-4">{user}</span>
          <TimeDisplay timeStamp={timeStamp} />
        </header>
        <div
          className="w-fit rounded-2xl bg-pink-300 px-4 pt-1 text-base
            dark:bg-pink-900"
        >
          {children}
        </div>
      </article>
    );
  },
);
