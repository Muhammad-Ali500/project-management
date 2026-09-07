export type ProjectStatus = "planned" | "active" | "on_hold" | "completed" | "archived";
export type InitiativeStatus = "not_started" | "in_progress" | "blocked" | "completed";
export type TaskStatus = "todo" | "in_progress" | "in_review" | "done";
export type Priority = "low" | "medium" | "high" | "critical";

export interface Project {
  id: string;
  name: string;
  description: string;
  owner: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface Initiative {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: InitiativeStatus;
  priority: Priority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  initiative_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignee: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}
