import { colorForString, initials } from "../lib/format";

export function Avatar({ name, size = 22 }: { name: string; size?: number }) {
  return (
    <span
      className="avatar"
      title={name}
      style={{
        background: colorForString(name),
        width: size,
        height: size,
        fontSize: size * 0.4,
      }}
    >
      {initials(name)}
    </span>
  );
}
