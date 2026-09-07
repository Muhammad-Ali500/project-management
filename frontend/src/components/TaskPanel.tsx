import { FormEvent, useState } from "react";
import type { Initiative, Task } from "../types";

interface Props {
  initiative: Initiative | null;
  tasks: Task[];
  onCreate: (title: string) => Promise<void>;
  onToggleDone: (task: Task) => Promise<void>;
}

export function TaskPanel({ initiative, tasks, onCreate, onToggleDone }: Props) {
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

  if (!initiative) {
    return (
      <section className="panel">
        <h2>Tasks</h2>
        <p className="empty-hint">Select an initiative to see its tasks.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Tasks — {initiative.title}</h2>
      {tasks.length === 0 && <p className="empty-hint">No tasks yet.</p>}
      {tasks.map((task) => (
        <div key={task.id} className="item" onClick={() => onToggleDone(task)}>
          <div className="item-title">{task.title}</div>
          <span className={`badge status-${task.status}`}>{task.status}</span>
          {task.assignee && <span className="badge">{task.assignee}</span>}
        </div>
      ))}
      <form className="inline-form" onSubmit={handleSubmit}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task title"
        />
        <button type="submit" disabled={submitting}>
          Add
        </button>
      </form>
    </section>
  );
}
