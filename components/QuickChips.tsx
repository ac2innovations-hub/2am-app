type Props = {
  suggestions: string[];
  onPick: (s: string) => void;
  disabled?: boolean;
};

export default function QuickChips({ suggestions, onPick, disabled }: Props) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2">
      <div className="flex w-max gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onPick(s)}
            className="shrink-0 rounded-full border border-cream/15 bg-navy/60 px-4 py-2 text-sm text-cream/90 transition active:scale-[0.97] disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
