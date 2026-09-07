import { FormEvent, useState } from "react";
import type { Initiative, Project } from "../types";

interface Props {
  project: Project | null;
  initiatives: Initiative[];
  selectedId: string | null;
  onSelect: (initiative: Initiative) => void;
  onCreate: (title: string) => Promise<void>;
}

export function InitiativePanel({ project, initiatives, selectedId, onSelect, onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onCreate(title.trim());
      setTitle("");
    } finally {
      setSubmitting(false);
    }
  }

  if (!project) {
    return (
      <section className="panel">
        <h2>Initiatives</h2>
        <p className="empty-hint">Select a project to see its initiatives.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Initiatives — {project.name}</h2>
      {initiatives.length === 0 && <p className="empty-hint">No initiatives yet.</p>}
      {initiatives.map((initiative) => (
        <div
          key={initiative.id}
          className={`item ${initiative.id === selectedId ? "selected" : ""}`}
          onClick={() => onSelect(initiative)}
        >
          <div className="item-title">{initiative.title}</div>
          <span className={`badge status-${initiative.status}`}>{initiative.status}</span>
          <span className={`badge priority-${initiative.priority}`}>{initiative.priority}</span>
        </div>
      ))}
      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New initiative title"
        />
        <button type="submit" disabled={submitting}>
          Add
        </button>
      </form>
    </section>
  );
}
