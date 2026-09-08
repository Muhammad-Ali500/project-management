import { useEffect, useState } from "react";
import { api } from "./api/client";
import { BoardView } from "./components/BoardView";
import { InitiativeDetailPanel } from "./components/InitiativeDetailPanel";
import { ListView } from "./components/ListView";
import { ProjectDetailPanel } from "./components/ProjectDetailPanel";
import { Sidebar } from "./components/Sidebar";
import { TaskDetailPanel } from "./components/TaskDetailPanel";
import { TopBar } from "./components/TopBar";
import { INITIATIVE_STATUSES, TASK_STATUSES, isOverdue } from "./lib/format";
import type { Row } from "./lib/row";
import type { Initiative, Project, Task } from "./types";

type Detail =
  | { kind: "project"; item: Project }
  | { kind: "initiative"; item: Initiative }
  | { kind: "task"; item: Task };

type View = "list" | "board";

function initiativeToRow(i: Initiative): Row {
  return {
    id: i.id,
    title: i.title,
    status: i.status,
    priority: i.priority,
    dueDate: i.due_date,
    done: i.status === "completed",
  };
}

function taskToRow(t: Task): Row {
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    dueDate: t.due_date,
    assignee: t.assignee,
    done: t.status === "done",
  };
}

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);
  const [initiativeView, setInitiativeView] = useState<View>("list");
  const [taskView, setTaskView] = useState<View>("list");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;
  const selectedInitiative = initiatives.find((i) => i.id === selectedInitiativeId) ?? null;

  useEffect(() => {
    (async () => {
      await refreshProjects();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function withErrorHandling(fn: () => Promise<void>) {
    try {
      setError(null);
      await fn();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function refreshProjects() {
    await withErrorHandling(async () => {
      setProjects(await api.listProjects());
    });
  }

  async function selectProject(project: Project) {
    setSelectedProjectId(project.id);
    setSelectedInitiativeId(null);
    setTasks([]);
    await withErrorHandling(async () => {
      setInitiatives(await api.listInitiatives(project.id));
    });
  }

  async function openInitiative(id: string) {
    setSelectedInitiativeId(id);
    await withErrorHandling(async () => {
      setTasks(await api.listTasks(id));
    });
  }

  async function createProject(name: string) {
    await withErrorHandling(async () => {
      await api.createProject({ name, owner: "unassigned", description: "" });
      await refreshProjects();
    });
  }

  async function updateProject(id: string, data: Partial<Project>) {
    await withErrorHandling(async () => {
      const updated = await api.updateProject(id, data);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    });
  }

  async function deleteProject(id: string) {
    await withErrorHandling(async () => {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
        setSelectedInitiativeId(null);
        setInitiatives([]);
        setTasks([]);
      }
    });
  }

  async function createInitiative(title: string, status?: string) {
    if (!selectedProject) return;
    await withErrorHandling(async () => {
      await api.createInitiative(selectedProject.id, {
        title,
        description: "",
        priority: "medium",
        due_date: null,
        ...(status ? { status: status as Initiative["status"] } : {}),
      });
      setInitiatives(await api.listInitiatives(selectedProject.id));
    });
  }

  async function updateInitiative(id: string, data: Partial<Initiative>) {
    await withErrorHandling(async () => {
      const updated = await api.updateInitiative(id, data);
      setInitiatives((prev) => prev.map((i) => (i.id === id ? updated : i)));
    });
  }

  async function deleteInitiative(id: string) {
    await withErrorHandling(async () => {
      await api.deleteInitiative(id);
      setInitiatives((prev) => prev.filter((i) => i.id !== id));
      if (selectedInitiativeId === id) {
        setSelectedInitiativeId(null);
        setTasks([]);
      }
    });
  }

  async function createTask(title: string, status?: string) {
    if (!selectedInitiative) return;
    await withErrorHandling(async () => {
      await api.createTask(selectedInitiative.id, {
        title,
        description: "",
        priority: "medium",
        assignee: null,
        due_date: null,
        ...(status ? { status: status as Task["status"] } : {}),
      });
      setTasks(await api.listTasks(selectedInitiative.id));
    });
  }

  async function updateTask(id: string, data: Partial<Task>) {
    await withErrorHandling(async () => {
      const updated = await api.updateTask(id, data);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    });
  }

  async function deleteTask(id: string) {
    await withErrorHandling(async () => {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    });
  }

  const initiativeRows = initiatives.map(initiativeToRow);
  const taskRows = tasks.map(taskToRow);
  const overdueInitiatives = initiativeRows.filter((r) =>
    isOverdue(r.dueDate, ["completed"], r.status),
  ).length;
  const overdueTasks = taskRows.filter((r) => isOverdue(r.dueDate, ["done"], r.status)).length;

  return (
    <div className="app-shell">
      <Sidebar
        projects={projects}
        selectedId={selectedProjectId}
        onSelect={selectProject}
        onCreate={createProject}
        onEdit={(project) => setDetail({ kind: "project", item: project })}
        onDelete={(project) => deleteProject(project.id)}
      />

      <div className="main-area">
        {error && (
          <div className="error-banner">
            {error}
            <button className="error-dismiss" onClick={() => setError(null)}>
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">Loading…</div>
        ) : !selectedProject ? (
          <div className="loading-state">
            {projects.length === 0
              ? "Create your first project from the sidebar to get started."
              : "Select a project from the sidebar."}
          </div>
        ) : !selectedInitiative ? (
          <>
            <TopBar
              crumbs={[{ label: selectedProject.name }]}
              count={initiatives.length}
              overdueCount={overdueInitiatives}
              view={initiativeView}
              onViewChange={setInitiativeView}
            />
            {initiativeView === "list" ? (
              <ListView
                rows={initiativeRows}
                statusOptions={INITIATIVE_STATUSES}
                doneStatus="completed"
                showAssignee={false}
                quickAddPlaceholder="New initiative"
                emptyLabel="No initiatives yet. Add one above."
                onOpen={(id) => openInitiative(id)}
                onEdit={(id) => setDetail({ kind: "initiative", item: initiatives.find((i) => i.id === id)! })}
                onStatusChange={(id, status) => updateInitiative(id, { status: status as Initiative["status"] })}
                onToggleDone={(id) => {
                  const row = initiativeRows.find((r) => r.id === id)!;
                  updateInitiative(id, { status: row.done ? "not_started" : "completed" });
                }}
                onQuickAdd={(title) => createInitiative(title)}
              />
            ) : (
              <BoardView
                rows={initiativeRows}
                statusOptions={INITIATIVE_STATUSES}
                doneStatus="completed"
                showAssignee={false}
                onOpen={(id) => openInitiative(id)}
                onEdit={(id) => setDetail({ kind: "initiative", item: initiatives.find((i) => i.id === id)! })}
                onQuickAdd={(title, status) => createInitiative(title, status)}
              />
            )}
          </>
        ) : (
          <>
            <TopBar
              crumbs={[
                { label: selectedProject.name, onClick: () => setSelectedInitiativeId(null) },
                { label: selectedInitiative.title },
              ]}
              count={tasks.length}
              overdueCount={overdueTasks}
              view={taskView}
              onViewChange={setTaskView}
            />
            {taskView === "list" ? (
              <ListView
                rows={taskRows}
                statusOptions={TASK_STATUSES}
                doneStatus="done"
                showAssignee
                quickAddPlaceholder="New task"
                emptyLabel="No tasks yet. Add one above."
                onOpen={(id) => setDetail({ kind: "task", item: tasks.find((t) => t.id === id)! })}
                onEdit={(id) => setDetail({ kind: "task", item: tasks.find((t) => t.id === id)! })}
                onStatusChange={(id, status) => updateTask(id, { status: status as Task["status"] })}
                onToggleDone={(id) => {
                  const row = taskRows.find((r) => r.id === id)!;
                  updateTask(id, { status: row.done ? "todo" : "done" });
                }}
                onQuickAdd={(title) => createTask(title)}
              />
            ) : (
              <BoardView
                rows={taskRows}
                statusOptions={TASK_STATUSES}
                doneStatus="done"
                showAssignee
                onOpen={(id) => setDetail({ kind: "task", item: tasks.find((t) => t.id === id)! })}
                onEdit={(id) => setDetail({ kind: "task", item: tasks.find((t) => t.id === id)! })}
                onQuickAdd={(title, status) => createTask(title, status)}
              />
            )}
          </>
        )}
      </div>

      {detail?.kind === "project" && (
        <ProjectDetailPanel
          project={detail.item}
          onClose={() => setDetail(null)}
          onSave={async (data) => {
            await updateProject(detail.item.id, data);
            setDetail(null);
          }}
          onDelete={() => {
            if (confirm(`Delete project "${detail.item.name}" and all its data?`)) {
              deleteProject(detail.item.id);
              setDetail(null);
            }
          }}
        />
      )}

      {detail?.kind === "initiative" && (
        <InitiativeDetailPanel
          initiative={detail.item}
          onClose={() => setDetail(null)}
          onSave={async (data) => {
            await updateInitiative(detail.item.id, data);
            setDetail(null);
          }}
          onDelete={() => {
            if (confirm(`Delete initiative "${detail.item.title}" and its tasks?`)) {
              deleteInitiative(detail.item.id);
              setDetail(null);
            }
          }}
        />
      )}

      {detail?.kind === "task" && (
        <TaskDetailPanel
          task={detail.item}
          onClose={() => setDetail(null)}
          onSave={async (data) => {
            await updateTask(detail.item.id, data);
            setDetail(null);
          }}
          onDelete={() => {
            if (confirm(`Delete task "${detail.item.title}"?`)) {
              deleteTask(detail.item.id);
              setDetail(null);
            }
          }}
        />
      )}
    </div>
  );
}
