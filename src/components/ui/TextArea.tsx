import { AlertIcon } from "./icons";

/** 영구 라벨 + 글자 수 + 오류 연결을 갖춘 여러 줄 입력 (DESIGN §7 입력·피드백). */
export function TextArea({
  id,
  label,
  hint,
  value,
  max,
  onChange,
  error,
  rows = 4,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  max: number;
  onChange: (next: string) => void;
  error?: string;
  rows?: number;
}) {
  const hintId = `${id}-hint`;
  const countId = `${id}-count`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, countId, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={id} className="block text-label font-semibold">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-caption text-fg-secondary">
          {hint}
        </p>
      )}
      <textarea
        id={id}
        value={value}
        rows={rows}
        maxLength={max}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`mt-2 block min-h-13 w-full resize-y rounded-btn border bg-surface px-4 py-3 text-body text-fg ${
          error ? "border-danger" : "border-line-control"
        }`}
      />
      <div className="mt-1 flex items-start justify-between gap-3">
        <div id={errorId} className="min-w-0 text-caption text-danger">
          {error && (
            <p className="flex items-start gap-1">
              <AlertIcon className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>
        <p id={countId} className="shrink-0 text-caption text-fg-muted">
          {value.length}/{max}자
        </p>
      </div>
    </div>
  );
}
