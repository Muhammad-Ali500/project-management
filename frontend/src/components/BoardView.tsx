import { Avatar } from "./Avatar";
import { PriorityFlag } from "./PriorityFlag";
import { QuickAdd } from "./QuickAdd";
import { STATUS_COLOR, formatDateShort, isOverdue, label } from "../lib/format";
import type { Row } from "../lib/row";

interface Props {
  rows: Row[];
  statusOptions: string[];
  doneStatus: string;
  showAssignee: boolean;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onQuickAdd: (title: string, status: string) => Promise<void>;
}

export function BoardView({
  rows,
  statusOptions,
  doneStatus,
  showAssignee,
  onOpen,
  onEdit,
  onQuickAdd,
}: Props) {
  return (
    <div className="board-view">
      {statusOptions.map((status) => {
        const items = rows.filter((r) => r.status === status);
        const color = STATUS_COLOR[status] ?? "#8b8fa3";
        return (
          <div key={status} className="board-column">
            <div className="board-column-header">
              <span className="status-dot" style={{ background: color }} />
              <span className="board-column-title">{label(status)}</span>
              <span className="list-group-count">{items.length}</span>
            </div>
            <div className="board-column-body">
              {items.map((row) => (
                <div key={row.id} className="board-card" onClick={() => onOpen(row.id)}>
                  <div className="board-card-top">
                    <div className={`board-card-title ${row.done ? "done" : ""}`}>{row.title}</div>
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
                  <div className="board-card-footer">
                    <div className="board-card-footer-left">
                      <PriorityFlag priority={row.priority} />
                      {row.dueDate && (
                        <span
                          className={`due-chip ${
                            isOverdue(row.dueDate, [doneStatus], row.status) ? "overdue" : ""
                          }`}
                        >
                          {formatDateShort(row.dueDate)}
                        </span>
                      )}
                    </div>
                    {showAssignee && row.assignee && <Avatar name={row.assignee} size={20} />}
                  </div>
                </div>
              ))}
              <QuickAdd
                placeholder="Add"
                variant="column"
                onAdd={(title) => onQuickAdd(title, status)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
