import { FormEvent, useState } from "react";
import type { Project } from "../types";

interface Props {
  projects: Project[];
  selectedId: string | null;
  onSelect: (project: Project) => void;
  onCreate: (name: string) => Promise<void>;
}

export function ProjectPanel({ projects, selectedId, onSelect, onCreate }: Props) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onCreate(name.trim());
      setName("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <h2>Projects</h2>
      {projects.length === 0 && <p className="empty-hint">No projects yet. Create one below.</p>}
      {projects.map((project) => (
        <div
          key={project.id}
          className={`item ${project.id === selectedId ? "selected" : ""}`}
          onClick={() => onSelect(project)}
        >
          <div className="item-title">{project.name}</div>
          <span className={`badge status-${project.status}`}>{project.status}</span>
        </div>
      ))}
      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New project name"
        />
        <button type="submit" disabled={submitting}>
          Add
        </button>
      </form>
    </section>
  );
}
