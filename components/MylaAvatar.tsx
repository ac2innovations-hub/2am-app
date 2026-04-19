export default function MylaAvatar({ size = 36 }: { size?: number }) {
  const fontSize = Math.round(size * 0.5);
  return (
    <div
      className="flex items-center justify-center rounded-full bg-peach-gradient font-display font-bold text-midnight shadow-glow"
      style={{ width: size, height: size, fontSize }}
      aria-label="myla"
    >
      M
    </div>
  );
}
