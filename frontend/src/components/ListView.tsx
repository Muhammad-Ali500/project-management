import { Avatar } from "./Avatar";
import { PriorityFlag } from "./PriorityFlag";
import { QuickAdd } from "./QuickAdd";
import { StatusPill } from "./StatusPill";
import { STATUS_COLOR, formatDateShort, isOverdue, label } from "../lib/format";
import type { Row } from "../lib/row";

interface Props {
  rows: Row[];
  statusOptions: string[];
  doneStatus: string;
  showAssignee: boolean;
  quickAddPlaceholder: string;
  emptyLabel: string;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onToggleDone: (id: string) => void;
  onQuickAdd: (title: string) => Promise<void>;
}

export function ListView({
  rows,
  statusOptions,
  doneStatus,
  showAssignee,
  quickAddPlaceholder,
  emptyLabel,
  onOpen,
  onEdit,
  onStatusChange,
  onToggleDone,
  onQuickAdd,
}: Props) {
  const groups = statusOptions
    .map((status) => ({ status, items: rows.filter((r) => r.status === status) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="list-view">
      <div className="list-view-top-add">
        <QuickAdd placeholder={quickAddPlaceholder} onAdd={onQuickAdd} variant="row" />
      </div>

      {rows.length === 0 && <p className="empty-hint">{emptyLabel}</p>}

      {groups.map((group) => (
        <div key={group.status} className="list-group">
          <div className="list-group-header">
            <span
              className="status-dot"
              style={{ background: STATUS_COLOR[group.status] ?? "#8b8fa3" }}
            />
            <span className="list-group-title">{label(group.status)}</span>
            <span className="list-group-count">{group.items.length}</span>
          </div>
          {group.items.map((row) => (
            <div key={row.id} className="list-row" onClick={() => onOpen(row.id)}>
              <label
                className="list-row-check"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={row.done}
                  onChange={() => onToggleDone(row.id)}
                />
              </label>
              <span className={`list-row-title ${row.done ? "done" : ""}`}>{row.title}</span>
              <span className="list-row-spacer" />
              {row.dueDate && (
                <span className={`due-chip ${isOverdue(row.dueDate, [doneStatus], row.status) ? "overdue" : ""}`}>
                  {formatDateShort(row.dueDate)}
                </span>
              )}
              <PriorityFlag priority={row.priority} />
              {showAssignee && row.assignee && <Avatar name={row.assignee} />}
              <div onClick={(e) => e.stopPropagation()}>
                <StatusPill
                  status={row.status}
                  options={statusOptions}
                  onChange={(status) => onStatusChange(row.id, status)}
                />
              </div>
              <button
                type="button"
                className="icon-button"
                title="Edit"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(row.id);
                }}
              >
                ✎
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
