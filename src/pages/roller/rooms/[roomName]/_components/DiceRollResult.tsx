import type {
  ResultGroupItem,
  RollEntry,
  RollResultItem,
  RollResultsGroup,
  StructuredRolls,
} from "../../../../../workers/types";
import { memo } from "react";

type DiceRollResultProps = {
  formula: string | null;
  rolls: string | null;
  total: number | null;
};

function parseRolls(rolls: string): StructuredRolls | null {
  try {
    const parsed = JSON.parse(rolls);
    if (Array.isArray(parsed)) return parsed as StructuredRolls;
    return null;
  } catch {
    return null;
  }
}

function DieChip({ die }: { die: RollResultItem }) {
  const isDropped = !die.useInTotal;
  const isExploded = die.modifiers.includes("explode");
  const isCritSuccess = die.modifiers.includes("critical-success");
  const isCritFail = die.modifiers.includes("critical-failure");
  const isRerolled = die.modifiers.includes("re-roll");

  let extraClasses = "";
  if (isDropped) {
    extraClasses = "opacity-35 line-through decoration-2";
  } else if (isCritSuccess) {
    extraClasses = "text-success ring-2 ring-success/50";
  } else if (isCritFail) {
    extraClasses = "text-error ring-2 ring-error/50";
  } else if (isExploded) {
    extraClasses = "text-warning ring-2 ring-warning/50";
  } else if (isRerolled) {
    extraClasses = "opacity-50 line-through";
  }

  return (
    <kbd className={`kbd kbd-sm tabular-nums ${extraClasses}`}>
      {die.value}
      {isExploded && <span className="text-warning ml-px">!</span>}
    </kbd>
  );
}

function RollGroup({ group }: { group: RollResultsGroup }) {
  return (
    <div className="flex flex-wrap gap-1">
      {group.rolls.map((die, i) => (
        <DieChip key={i} die={die} />
      ))}
    </div>
  );
}

function SubExpression({ group }: { group: ResultGroupItem }) {
  const isDropped = !group.useInTotal;
  return (
    <div
      className={`flex flex-wrap items-center gap-1 rounded-lg border px-2 py-1 ${isDropped ? "border-base-300 opacity-35" : "border-base-content/20"}`}
    >
      {group.results.map((entry, i) => (
        <RollEntryNode key={i} entry={entry} />
      ))}
      <span
        className={`ml-1 text-sm font-semibold tabular-nums ${isDropped ? "line-through" : "opacity-70"}`}
      >
        ={group.value}
      </span>
    </div>
  );
}

function RollGroupContainer({ group }: { group: ResultGroupItem }) {
  return (
    <div className="flex flex-wrap gap-2">
      {group.results.map((entry, i) => {
        if (typeof entry === "object" && entry.type === "result-group") {
          return <SubExpression key={i} group={entry} />;
        }
        return null;
      })}
    </div>
  );
}

function RollEntryNode({ entry }: { entry: RollEntry }) {
  if (typeof entry === "string") {
    // operator: +, -, *, /
    return <span className="self-center opacity-40">{entry}</span>;
  }
  if (typeof entry === "number") {
    // literal modifier, e.g. the +3 in "2d6+3"
    return (
      <span className="self-center font-mono text-sm opacity-60">{entry}</span>
    );
  }
  if (entry.type === "roll-results") {
    return <RollGroup group={entry} />;
  }
  if (entry.type === "result-group" && entry.isRollGroup) {
    return <RollGroupContainer group={entry} />;
  }
  return null;
}

export const DiceRollResult = memo(
  ({ formula, rolls, total }: DiceRollResultProps) => {
    if (!formula || total === null) return null;

    const structured = rolls ? parseRolls(rolls) : null;

    // Fall back to just showing formula = total if we can't parse rolls
    if (!structured) {
      return (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-1">
          <span className="font-mono text-sm opacity-50">{formula}</span>
          <span className="opacity-30">=</span>
          <span className="text-lg font-bold tabular-nums">{total}</span>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1">
        <span className="font-mono text-sm opacity-50">{formula}</span>
        <span className="opacity-30">→</span>
        {structured.map((entry, i) => (
          <RollEntryNode key={i} entry={entry} />
        ))}
        <span className="opacity-30">=</span>
        <span className="text-lg font-bold tabular-nums">{total}</span>
      </div>
    );
  },
);
