import { TimeDisplay } from "./TimeDisplay";
import { memo, type PropsWithChildren } from "react";

type MessageProps = PropsWithChildren<{
  user: string;
  timeStamp: number;
}>;

export const Message = memo(({ user, timeStamp, children }: MessageProps) => {
  return (
    <article className="mb-2">
      <header className="text-sm">
        <span className="mr-4">{user}</span>
        <TimeDisplay timeStamp={timeStamp} />
      </header>
      <div className="w-fit rounded-2xl bg-pink-300 px-4 pt-1 text-base dark:bg-pink-900">
        {children}
      </div>
    </article>
  );
});
