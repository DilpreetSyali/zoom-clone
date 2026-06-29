import { colorForName, initialsForName } from "@/lib/utils";

interface AvatarProps {
  name: string;
  /** Override the deterministic colour (e.g. from the user's stored avatar_color) */
  color?: string;
  size?: number;
  className?: string;
}

export default function Avatar({
  name,
  color,
  size = 36,
  className = "",
}: AvatarProps) {
  const bg = color || colorForName(name);
  return (
    <div
      aria-label={name}
      className={`flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white ${className}`}
      style={{
        backgroundColor: bg,
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        lineHeight: 1,
      }}
    >
      {initialsForName(name)}
    </div>
  );
}
