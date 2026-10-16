/** 진행 표시. 움직임은 prefers-reduced-motion에서 전역 규칙으로 멈추므로 항상 문구와 함께 쓴다. */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-line-control border-t-transparent ${className}`}
    />
  );
}
