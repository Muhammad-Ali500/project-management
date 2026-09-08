import type { Priority } from "../types";

export interface Row {
  id: string;
  title: string;
  status: string;
  priority: Priority;
  dueDate: string | null;
  assignee?: string | null;
  done: boolean;
}
