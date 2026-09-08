import { FormEvent, useState } from "react";
import type { Priority, Task, TaskStatus } from "../types";
import { PRIORITIES, TASK_STATUSES, label, toDateInputValue } from "../lib/format";
import { PanelShell } from "./PanelShell";

interface Props {
  task: Task;
  onClose: () => void;
  onSave: (data: Partial<Task>) => Promise<void>;
  onDelete: () => void;
}

export function TaskDetailPanel({ task, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [assignee, setAssignee] = useState(task.assignee ?? "");
  const [dueDate, setDueDate] = useState(toDateInputValue(task.due_date));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description,
        status,
        priority,
        assignee: assignee.trim() || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PanelShell title="Task details" onClose={onClose} onDelete={onDelete}>
      <form className="detail-form" onSubmit={handleSubmit}>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />

        <label>Description</label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="field-row">
          <div>
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {label(p)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field-row">
          <div>
            <label>Assignee</label>
            <input value={assignee} onChange={(e) => setAssignee(e.target.value)} />
          </div>
          <div>
            <label>Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <button type="submit" disabled={saving || !title.trim()}>
          Save changes
        </button>
      </form>
    </PanelShell>
  );
}
