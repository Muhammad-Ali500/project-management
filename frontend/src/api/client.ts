import type { Initiative, Project, Task } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Request to ${path} failed (${response.status}): ${detail}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const api = {
  listProjects: () => request<Project[]>("/projects"),
  createProject: (data: Partial<Project>) =>
    request<Project>("/projects", { method: "POST", body: JSON.stringify(data) }),
  updateProject: (id: string, data: Partial<Project>) =>
    request<Project>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProject: (id: string) => request<void>(`/projects/${id}`, { method: "DELETE" }),

  listInitiatives: (projectId: string) =>
    request<Initiative[]>(`/projects/${projectId}/initiatives`),
  createInitiative: (projectId: string, data: Partial<Initiative>) =>
    request<Initiative>(`/projects/${projectId}/initiatives`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateInitiative: (id: string, data: Partial<Initiative>) =>
    request<Initiative>(`/initiatives/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteInitiative: (id: string) => request<void>(`/initiatives/${id}`, { method: "DELETE" }),

  listTasks: (initiativeId: string) => request<Task[]>(`/initiatives/${initiativeId}/tasks`),
  createTask: (initiativeId: string, data: Partial<Task>) =>
    request<Task>(`/initiatives/${initiativeId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTask: (id: string, data: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
};
