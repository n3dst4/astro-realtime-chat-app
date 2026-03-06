import { Component, type PropsWithChildren, type ReactNode } from "react";

interface State {
  error: Error | null;
}

function ErrorDisplay({ error }: { error: Error }) {
  return (
    <div
      className="relative flex h-full flex-col items-center justify-center
        overflow-hidden bg-black p-8 font-mono text-green-400
        [--grid-color:var(--color-cyan-500)]"
    >
      {/* Scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-40
          bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.25)_0px,rgba(0,0,0,0.25)_1px,transparent_1px,transparent_2px)]"
      />

      {/*Top gridlines*/}
      {/*<div
        className="absolute top-0 z-15 h-1/2 w-full perspective-dramatic
          perspective-origin-bottom"
      >
        <div
          className="h-full w-[400%] -translate-x-1/2 -rotate-x-45
            bg-[repeating-linear-gradient(0deg,transparent_0px,transparent_12px,var(--grid-color)_14px,transparent_16px),repeating-linear-gradient(90deg,transparent_0px,transparent_50px,var(--grid-color)_60px,transparent_70px)]
            mix-blend-screen"
        />
      </div>*/}

      {/*bottom gridlines*/}
      {/*<div
        className="absolute top-1/2 z-15 h-1/2 w-full perspective-dramatic
          perspective-origin-top"
      >
        <div
          className="h-full w-[400%] -translate-x-1/2 rotate-x-45
            bg-[repeating-linear-gradient(0deg,transparent_0px,transparent_12px,var(--grid-color)_14px,transparent_16px),repeating-linear-gradient(90deg,transparent_0px,transparent_50px,var(--grid-color)_60px,transparent_70px)]"
        />
      </div>*/}

      {/*<div
        className="absolute z-16 h-full w-full
          bg-linear-[transparent_0px,black_50%,black_50%,transparent_100%]"
      />*/}

      <div
        className="relative z-20 w-full max-w-2xl -skew-x-3 transform-gpu border
          border-cyan-500 bg-black/80 p-8
          shadow-[0_0_40px_#00ffff66,0_0_80px_#ff00ff33]"
      >
        {/* Header */}
        <div
          className="mb-6 flex items-center gap-3 border-b border-pink-500 pb-4"
        >
          <h2
            className="animate-pulse text-2xl font-extrabold tracking-widest
              text-pink-500 uppercase drop-shadow-[0_0_8px_#ff00ff]
              [text-shadow:0_0_10px_#ff00ff,0_0_30px_#ff00ff]"
          >
            &gt; ERROR
          </h2>
        </div>

        {/* Subheading */}
        <p
          className="mb-4 text-xs tracking-[0.3em] text-pink-400
            drop-shadow-[0_0_6px_#00ffff]"
        >
          &gt;&gt; {error.message}
        </p>

        {/* Error message block */}
        {error.stack && (
          <pre
            className="relative max-h-60 overflow-auto border border-cyan-500/40
              bg-black p-4 text-sm leading-relaxed break-all whitespace-pre-wrap
              text-cyan-300 shadow-[inset_0_0_20px_#00ff0022] before:absolute
              before:inset-0
              before:bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(0,255,255,0.03)_2px,rgba(0,255,255,0.03)_4px)]
              before:content-['']"
          >
            {error.stack.split("\n").slice(1).join("\n")}
          </pre>
        )}

        {/* Footer glitch bar */}
        <div className="mt-6 flex gap-1">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 bg-pink-500"
              style={{ opacity: Math.random() }}
            />
          ))}
        </div>
        <p className="mt-3 text-right tracking-widest">
          <button
            className="animate-pulse cursor-pointer text-cyan-400/60
              hover:animate-none hover:text-pink-400"
            onClick={() => {
              location.reload();
            }}
            onKeyDown={() => {
              location.reload();
            }}
          >
            &gt; refresh the page_
          </button>
        </p>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render(): ReactNode {
    if (this.state.error) {
      return <ErrorDisplay error={this.state.error} />;
    }

    return this.props.children;
  }
}
