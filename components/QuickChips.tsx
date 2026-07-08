type Props = {
  suggestions: string[];
  onPick: (s: string) => void;
  disabled?: boolean;
};

export default function QuickChips({ suggestions, onPick, disabled }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => onPick(s)}
          className="rounded-full border px-4 py-2 text-[13px] text-cream/85 transition active:scale-[0.97] disabled:opacity-50"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            borderColor: "rgba(255,255,255,0.14)",
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
