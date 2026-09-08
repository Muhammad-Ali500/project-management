import { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  onClose: () => void;
  onDelete: () => void;
  children: ReactNode;
}

export function PanelShell({ title, subtitle, onClose, onDelete, children }: Props) {
  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        <div className="detail-panel-header">
          <div>
            <h3>{title}</h3>
            {subtitle && <p className="detail-panel-subtitle">{subtitle}</p>}
          </div>
          <div className="detail-panel-header-actions">
            <button type="button" className="icon-button icon-button-danger" title="Delete" onClick={onDelete}>
              🗑
            </button>
            <button type="button" className="icon-button" title="Close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>
        <div className="detail-panel-body">{children}</div>
      </div>
    </div>
  );
}
