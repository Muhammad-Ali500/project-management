import type { InitiativeStatus, Priority, ProjectStatus, TaskStatus } from "../types";

export const PROJECT_STATUSES: ProjectStatus[] = [
  "planned",
  "active",
  "on_hold",
  "completed",
  "archived",
];

export const INITIATIVE_STATUSES: InitiativeStatus[] = [
  "not_started",
  "in_progress",
  "blocked",
  "completed",
];

export const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "in_review", "done"];

export const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];

// A ClickUp-style fixed palette: every status/priority across all three entities maps
// into one of these five hues, so badges read consistently no matter which panel you're in.
export const STATUS_COLOR: Record<string, string> = {
  planned: "#8b8fa3",
  not_started: "#8b8fa3",
  todo: "#8b8fa3",
  active: "#4b9bff",
  in_progress: "#4b9bff",
  on_hold: "#f5a623",
  in_review: "#a259e6",
  blocked: "#e5484d",
  completed: "#2ecc71",
  done: "#2ecc71",
  archived: "#5c6178",
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  low: "#8b8fa3",
  medium: "#4b9bff",
  high: "#f5a623",
  critical: "#e5484d",
};

export function label(value: string): string {
  return value
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatDate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateShort(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function toDateInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function isOverdue(dueDate: string | null, doneStatuses: string[], status: string): boolean {
  if (!dueDate || doneStatuses.includes(status)) return false;
  return new Date(dueDate).getTime() < Date.now();
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic hash so the same name always gets the same avatar color.
export function colorForString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}
