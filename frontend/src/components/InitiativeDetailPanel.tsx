import { FormEvent, useState } from "react";
import type { Initiative, InitiativeStatus, Priority } from "../types";
import { INITIATIVE_STATUSES, PRIORITIES, label, toDateInputValue } from "../lib/format";
import { PanelShell } from "./PanelShell";

interface Props {
  initiative: Initiative;
  onClose: () => void;
  onSave: (data: Partial<Initiative>) => Promise<void>;
  onDelete: () => void;
}

export function InitiativeDetailPanel({ initiative, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState(initiative.title);
  const [description, setDescription] = useState(initiative.description);
  const [status, setStatus] = useState<InitiativeStatus>(initiative.status);
  const [priority, setPriority] = useState<Priority>(initiative.priority);
  const [dueDate, setDueDate] = useState(toDateInputValue(initiative.due_date));
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
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PanelShell title="Initiative details" onClose={onClose} onDelete={onDelete}>
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
            <select value={status} onChange={(e) => setStatus(e.target.value as InitiativeStatus)}>
              {INITIATIVE_STATUSES.map((s) => (
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

        <label>Due date</label>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

        <button type="submit" disabled={saving || !title.trim()}>
          Save changes
        </button>
      </form>
    </PanelShell>
  );
}
