import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

type Variant = "primary" | "secondary";

// DESIGN §7 버튼: 최소 높이 52px, 좌우 20px, 라벨 16/24 semibold, 모서리 8px.
// Primary 라벨은 사용자 지시로 흰색(on-primary)이다. 대비 측정 결과는 docs/ui-demo-decisions.md에 기록했다.
// compact: 두 버튼을 나란히 둘 때 좌우 여백만 12px로 줄인다(높이·글자 크기는 그대로).
const base =
  "inline-flex min-h-13 w-full items-center justify-center rounded-btn text-center text-label font-semibold transition-colors duration-150 select-none";
const pad = { regular: "px-5", compact: "px-3" } as const;

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-pressed " +
    // 비활성 표현(aria-disabled): 포커스는 유지하되 실행은 호출 측에서 차단
    "aria-disabled:cursor-not-allowed aria-disabled:bg-disabled-bg aria-disabled:text-disabled-fg aria-disabled:hover:bg-disabled-bg aria-disabled:active:bg-disabled-bg",
  secondary:
    "border border-line-control bg-surface text-fg hover:bg-surface-subtle active:bg-surface-subtle " +
    "aria-disabled:cursor-not-allowed aria-disabled:border-transparent aria-disabled:bg-disabled-bg aria-disabled:text-disabled-fg aria-disabled:hover:bg-disabled-bg",
};

type Common = { variant?: Variant; compact?: boolean };

export function Button({
  variant = "primary",
  compact = false,
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & Common) {
  return (
    <button
      type={type}
      className={`${base} ${compact ? pad.compact : pad.regular} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  compact = false,
  className = "",
  ...props
}: ComponentProps<typeof Link> & Common) {
  return (
    <Link
      className={`${base} ${compact ? pad.compact : pad.regular} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
