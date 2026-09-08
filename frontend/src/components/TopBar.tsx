interface Crumb {
  label: string;
  onClick?: () => void;
}

interface Props {
  crumbs: Crumb[];
  count: number;
  overdueCount: number;
  view: "list" | "board";
  onViewChange: (view: "list" | "board") => void;
}

export function TopBar({ crumbs, count, overdueCount, view, onViewChange }: Props) {
  return (
    <div className="top-bar">
      <div className="breadcrumb">
        {crumbs.map((crumb, i) => (
          <span key={i} className="breadcrumb-segment">
            {i > 0 && <span className="breadcrumb-sep">/</span>}
            {crumb.onClick ? (
              <button type="button" className="breadcrumb-link" onClick={crumb.onClick}>
                {crumb.label}
              </button>
            ) : (
              <span className="breadcrumb-current">{crumb.label}</span>
            )}
          </span>
        ))}
        <span className="count-pill">{count}</span>
        {overdueCount > 0 && <span className="count-pill count-pill-danger">{overdueCount} overdue</span>}
      </div>
      <div className="view-toggle">
        <button
          type="button"
          className={view === "list" ? "active" : ""}
          onClick={() => onViewChange("list")}
        >
          ☰ List
        </button>
        <button
          type="button"
          className={view === "board" ? "active" : ""}
          onClick={() => onViewChange("board")}
        >
          ▦ Board
        </button>
      </div>
    </div>
  );
}
