import { useEffect, useRef, useState, type ReactNode } from "react";

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  maxLength?: number;
  placeholder?: string;
  type?: "text" | "url";
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  maxLength,
  placeholder,
  type = "text",
}: FieldProps) {
  return (
    <label className="field">
      <span className="field-label-row">
        <span>{label}</span>
        {maxLength ? (
          <span className={value.length > maxLength ? "count count-alert" : "count"}>
            {value.length}/{maxLength}
          </span>
        ) : null}
      </span>
      <input
        value={value}
        type={type}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

interface TextAreaProps extends Omit<FieldProps, "type"> {
  rows?: number;
}

export function TextArea({
  label,
  value,
  onChange,
  hint,
  maxLength,
  placeholder,
  rows = 4,
}: TextAreaProps) {
  return (
    <label className="field">
      <span className="field-label-row">
        <span>{label}</span>
        {maxLength ? (
          <span className={value.length > maxLength ? "count count-alert" : "count"}>
            {value.length}/{maxLength}
          </span>
        ) : null}
      </span>
      <textarea
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

interface CommaListFieldProps {
  label: string;
  items: string[];
  onCommit: (items: string[]) => void;
  maxItems?: number;
  itemMaxLength?: number;
}

export function CommaListField({
  label,
  items,
  onCommit,
  maxItems = 12,
  itemMaxLength = 32,
}: CommaListFieldProps) {
  const serializedItems = items.join(", ");
  const [draft, setDraft] = useState(serializedItems);
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) setDraft(serializedItems);
  }, [serializedItems]);

  function commit() {
    isFocused.current = false;
    const nextItems = draft
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, maxItems)
      .map((item) => item.slice(0, itemMaxLength));
    setDraft(nextItems.join(", "));
    onCommit(nextItems);
  }

  return (
    <label className="field">
      <span className="field-label-row">
        <span>{label}</span>
        <span className="count">{items.length}/{maxItems}</span>
      </span>
      <textarea
        value={draft}
        rows={3}
        onFocus={() => {
          isFocused.current = true;
        }}
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
      />
      <small>Separate items with commas. Changes are applied when you leave this field.</small>
    </label>
  );
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorField({ label, value, onChange }: ColorFieldProps) {
  const validColor = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
  return (
    <label className="color-field">
      <span>{label}</span>
      <span className="color-control">
        <input
          className="color-swatch"
          type="color"
          value={validColor}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          aria-label={`${label} color picker`}
        />
        <input
          className="color-value"
          value={value}
          maxLength={7}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} hex value`}
        />
      </span>
    </label>
  );
}

interface EditorCardProps {
  title?: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function EditorCard({ title, eyebrow, actions, children, className = "" }: EditorCardProps) {
  return (
    <section className={`editor-card ${className}`.trim()}>
      {title || actions ? (
        <div className="editor-card-heading">
          <div>
            {eyebrow ? <span className="card-eyebrow">{eyebrow}</span> : null}
            {title ? <h3>{title}</h3> : null}
          </div>
          {actions ? <div className="card-actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

interface ItemActionsProps {
  index: number;
  length: number;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  removeLabel?: string;
}

export function ItemActions({
  index,
  length,
  onMove,
  onRemove,
  removeLabel = "Remove",
}: ItemActionsProps) {
  return (
    <div className="item-actions" aria-label="Item controls">
      <button
        className="icon-button"
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        aria-label="Move up"
        title="Move up"
      >
        ↑
      </button>
      <button
        className="icon-button"
        type="button"
        onClick={() => onMove(1)}
        disabled={index === length - 1}
        aria-label="Move down"
        title="Move down"
      >
        ↓
      </button>
      <button className="text-button danger-button" type="button" onClick={onRemove}>
        {removeLabel}
      </button>
    </div>
  );
}
