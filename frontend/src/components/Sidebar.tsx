import { QuickAdd } from "./QuickAdd";
import { STATUS_COLOR, colorForString, label } from "../lib/format";
import type { Project } from "../types";

interface Props {
  projects: Project[];
  selectedId: string | null;
  onSelect: (project: Project) => void;
  onCreate: (name: string) => Promise<void>;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function Sidebar({ projects, selectedId, onSelect, onCreate, onEdit, onDelete }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">PM</span>
        <span className="sidebar-brand-name">Project Manager</span>
      </div>

      <div className="sidebar-section-label">Projects</div>
      <nav className="sidebar-nav">
        {projects.map((project) => (
          <div
            key={project.id}
            className={`sidebar-item ${project.id === selectedId ? "active" : ""}`}
            onClick={() => onSelect(project)}
          >
            <span
              className="sidebar-item-icon"
              style={{ background: colorForString(project.name) }}
            >
              {project.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="sidebar-item-name">{project.name}</span>
            <span
              className="status-dot"
              style={{ background: STATUS_COLOR[project.status] ?? "#8b8fa3" }}
              title={label(project.status)}
            />
            <span className="sidebar-item-actions" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="sidebar-icon-button"
                title="Edit project"
                onClick={() => onEdit(project)}
              >
                ✎
              </button>
              <button
                type="button"
                className="sidebar-icon-button"
                title="Delete project"
                onClick={() => {
                  if (confirm(`Delete project "${project.name}" and all its data?`)) {
                    onDelete(project);
                  }
                }}
              >
                🗑
              </button>
            </span>
          </div>
        ))}
        {projects.length === 0 && <p className="sidebar-empty">No projects yet</p>}
      </nav>

      <div className="sidebar-add">
        <QuickAdd placeholder="New project" onAdd={onCreate} variant="row" />
      </div>
    </aside>
  );
}
