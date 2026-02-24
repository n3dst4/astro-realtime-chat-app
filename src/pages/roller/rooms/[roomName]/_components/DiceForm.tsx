import { Dices, SendHorizontal } from "lucide-react";
import { memo, type SubmitEvent } from "react";

type DiceFormProps = {
  formula: string;
  text: string;
  onFormulaChange: (value: string) => void;
  onTextChange: (value: string) => void;
  onSubmit: (event: SubmitEvent) => void;
};

export const DiceForm = memo(
  ({
    formula,
    text,
    onFormulaChange,
    onTextChange,
    onSubmit,
  }: DiceFormProps) => {
    return (
      <form onSubmit={onSubmit} className="flex flex-row flex-wrap p-4">
        <div
          className="border-primary flex min-w-0 flex-1 flex-col overflow-hidden
            rounded-l-xl border shadow-sm sm:flex-row"
        >
          <input
            className="bg-base-100 border-base-300
              placeholder:text-base-content/40 min-w-0 flex-1 border-b px-4 py-2
              outline-none sm:border-r sm:border-b-0"
            value={formula}
            onChange={(e) => onFormulaChange(e.target.value)}
            placeholder='Dice formula, e.g. "3d6"'
          />
          <input
            className="bg-base-100 placeholder:text-base-content/40 min-w-0
              flex-1 px-4 py-2 outline-none"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={formula.trim() ? "Annotation" : "Chat message"}
          />
        </div>
        <button
          className="btn btn-primary h-auto self-stretch rounded-none
            rounded-r-xl px-6"
        >
          <span
            className="relative flex h-[22px] w-[22px] items-center
              justify-center"
          >
            <SendHorizontal
              size={22}
              className={`absolute transition-opacity duration-300
                ${formula.trim() ? "opacity-0" : "opacity-100"}`}
            />
            <Dices
              size={22}
              className={`absolute transition-opacity duration-300
                ${formula.trim() ? "opacity-100" : "opacity-0"}`}
            />
          </span>
        </button>
      </form>
    );
  },
);

DiceForm.displayName = "DiceForm";
