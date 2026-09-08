import { FormEvent, useRef, useState } from "react";

interface Props {
  placeholder: string;
  onAdd: (title: string) => Promise<void>;
  variant?: "row" | "column";
}

export function QuickAdd({ placeholder, onAdd, variant = "row" }: Props) {
  const [active, setActive] = useState(false);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) {
      setActive(false);
      return;
    }
    setSubmitting(true);
    try {
      await onAdd(value.trim());
      setValue("");
      inputRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  if (!active) {
    return (
      <button
        type="button"
        className={`quick-add-trigger quick-add-trigger-${variant}`}
        onClick={() => setActive(true)}
      >
        <span className="quick-add-plus">+</span> {placeholder}
      </button>
    );
  }

  return (
    <form className={`quick-add-form quick-add-form-${variant}`} onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (!value.trim()) setActive(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setValue("");
            setActive(false);
          }
        }}
        placeholder="Type a name, press Enter to save"
        disabled={submitting}
      />
    </form>
  );
}
