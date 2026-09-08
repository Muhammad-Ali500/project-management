import { useEffect, useRef, useState } from "react";
import { STATUS_COLOR, label } from "../lib/format";

interface Props {
  status: string;
  options: string[];
  onChange: (status: string) => void;
}

export function StatusPill({ status, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const color = STATUS_COLOR[status] ?? "#8b8fa3";

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="status-pill-wrap" ref={ref}>
      <button
        type="button"
        className="status-pill"
        style={{ color, borderColor: color, background: `${color}1a` }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <span className="status-dot" style={{ background: color }} />
        {label(status)}
      </button>
      {open && (
        <div className="status-menu" onClick={(e) => e.stopPropagation()}>
          {options.map((opt) => {
            const optColor = STATUS_COLOR[opt] ?? "#8b8fa3";
            return (
              <button
                key={opt}
                type="button"
                className={`status-menu-item ${opt === status ? "active" : ""}`}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
              >
                <span className="status-dot" style={{ background: optColor }} />
                {label(opt)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
