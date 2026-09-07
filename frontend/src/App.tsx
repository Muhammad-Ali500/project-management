import { useEffect, useState } from "react";
import { api } from "./api/client";
import { InitiativePanel } from "./components/InitiativePanel";
import { ProjectPanel } from "./components/ProjectPanel";
import { TaskPanel } from "./components/TaskPanel";
import type { Initiative, Project, Task } from "./types";

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedInitiative, setSelectedInitiative] = useState<Initiative | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshProjects();
  }, []);

  async function refreshProjects() {
    try {
      setError(null);
      setProjects(await api.listProjects());
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function selectProject(project: Project) {
    setSelectedProject(project);
    setSelectedInitiative(null);
    setTasks([]);
    try {
      setError(null);
      setInitiatives(await api.listInitiatives(project.id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function selectInitiative(initiative: Initiative) {
    setSelectedInitiative(initiative);
    try {
      setError(null);
      setTasks(await api.listTasks(initiative.id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function createProject(name: string) {
    try {
      setError(null);
      await api.createProject({ name, owner: "unassigned" });
      await refreshProjects();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function createInitiative(title: string) {
    if (!selectedProject) return;
    try {
      setError(null);
      await api.createInitiative(selectedProject.id, { title });
      setInitiatives(await api.listInitiatives(selectedProject.id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function createTask(title: string) {
    if (!selectedInitiative) return;
    try {
      setError(null);
      await api.createTask(selectedInitiative.id, { title });
      setTasks(await api.listTasks(selectedInitiative.id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function toggleTaskDone(task: Task) {
    if (!selectedInitiative) return;
    try {
      setError(null);
      const nextStatus = task.status === "done" ? "todo" : "done";
      await api.updateTask(task.id, { status: nextStatus });
      setTasks(await api.listTasks(selectedInitiative.id));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <header className="app-header">
        <h1>Project Manager</h1>
        <p>Track projects, initiatives, and tasks end to end.</p>
      </header>
      {error && <div className="error-banner">{error}</div>}
      <main className="layout">
        <ProjectPanel
          projects={projects}
          selectedId={selectedProject?.id ?? null}
          onSelect={selectProject}
          onCreate={createProject}
        />
        <InitiativePanel
          project={selectedProject}
          initiatives={initiatives}
          selectedId={selectedInitiative?.id ?? null}
          onSelect={selectInitiative}
          onCreate={createInitiative}
        />
        <TaskPanel
          initiative={selectedInitiative}
          tasks={tasks}
          onCreate={createTask}
          onToggleDone={toggleTaskDone}
        />
      </main>
    </>
  );
}
