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
  softBorder = false,
  hideLabel = false,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  max: number;
  onChange: (next: string) => void;
  error?: string;
  rows?: number;
  /** 기본 테두리를 연하게 한다(키보드 포커스 윤곽선은 그대로). 3단계 추가 설명에서 쓴다. */
  softBorder?: boolean;
  /** 라벨을 화면에서만 숨긴다(보조 기술에는 그대로 전달). 헤더나 설명이 이미 같은 내용을 보여 줄 때 쓴다. */
  hideLabel?: boolean;
}) {
  const hintId = `${id}-hint`;
  const countId = `${id}-count`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, countId, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "block text-label font-semibold"}>
        {label}
      </label>
      {hint && (
        <p id={hintId} className={`${hideLabel ? "" : "mt-1 "}text-caption text-fg-secondary`}>
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
          error ? "border-danger" : softBorder ? "border-line" : "border-line-control"
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
