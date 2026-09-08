import type { Priority } from "../types";
import { PRIORITY_COLOR, label } from "../lib/format";

export function PriorityFlag({ priority }: { priority: Priority }) {
  return (
    <span className="priority-flag" title={`${label(priority)} priority`}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill={PRIORITY_COLOR[priority]}>
        <path d="M1 0h1v12H1V0z" />
        <path d="M2 1h8l-2 2.5L10 6H2V1z" />
      </svg>
    </span>
  );
}
