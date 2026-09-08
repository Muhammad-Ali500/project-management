import { FormEvent, useState } from "react";
import type { Project, ProjectStatus } from "../types";
import { PROJECT_STATUSES, label } from "../lib/format";
import { PanelShell } from "./PanelShell";

interface Props {
  project: Project;
  onClose: () => void;
  onSave: (data: Partial<Project>) => Promise<void>;
  onDelete: () => void;
}

export function ProjectDetailPanel({ project, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState(project.name);
  const [owner, setOwner] = useState(project.owner);
  const [description, setDescription] = useState(project.description);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ name: name.trim(), owner: owner.trim(), description, status });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PanelShell title="Project details" onClose={onClose} onDelete={onDelete}>
      <form className="detail-form" onSubmit={handleSubmit}>
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />

        <label>Owner</label>
        <input value={owner} onChange={(e) => setOwner(e.target.value)} />

        <label>Description</label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
          {PROJECT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>

        <button type="submit" disabled={saving || !name.trim()}>
          Save changes
        </button>
      </form>
    </PanelShell>
  );
}
