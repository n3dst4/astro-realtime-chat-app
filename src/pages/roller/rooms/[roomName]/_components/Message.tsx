import { TimeDisplay } from "./TimeDisplay";
import { memo, type PropsWithChildren } from "react";

type MessageProps = PropsWithChildren<{
  user: string;
  timeStamp: number;
}>;

export const Message = memo(({ user, timeStamp, children }: MessageProps) => {
  return (
    <article className="chat chat-start">
      <header className="chat-header text-sm">
        <span>{user}</span>
        <TimeDisplay timeStamp={timeStamp} />
      </header>
      <div className="chat-bubble text-base">{children}</div>
    </article>
  );
});
