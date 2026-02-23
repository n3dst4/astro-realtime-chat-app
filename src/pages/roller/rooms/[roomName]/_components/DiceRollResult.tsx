import { memo } from "react";

type DiceRollResultProps = {
  formula: string | null;
  rolls: string | null;
  total: number | null;
};

export const DiceRollResult = memo(
  ({ formula, rolls, total }: DiceRollResultProps) => {
    if (!formula || total === null) return null;

    let rollValues: number[] = [];
    if (rolls) {
      try {
        const parsed = JSON.parse(rolls);
        if (Array.isArray(parsed)) {
          rollValues = parsed;
        }
      } catch {
        // fall through with empty array
      }
    }

    return (
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-1">
        <span className="font-mono text-sm opacity-50">{formula}</span>
        <span className="opacity-30">→</span>
        {rollValues.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {rollValues.map((value, i) => (
              <kbd key={i} className="kbd kbd-sm">
                {value}
              </kbd>
            ))}
          </div>
        )}
        <span className="opacity-30">=</span>
        <span className="text-lg font-bold tabular-nums">{total}</span>
      </div>
    );
  },
);
