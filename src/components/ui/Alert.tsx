import type { ReactNode } from "react";
import { AlertIcon } from "./icons";

/** 오류·주의 안내. 색만이 아니라 아이콘과 문구로도 구분한다 (DESIGN §3·§6). */
export function Alert({
  tone,
  title,
  children,
  role,
}: {
  tone: "error" | "warning";
  title?: string;
  children: ReactNode;
  role?: "alert" | "status";
}) {
  const color = tone === "error" ? "bg-danger-bg text-danger" : "bg-warning-bg text-warning";
  return (
    <div role={role ?? (tone === "error" ? "alert" : undefined)} className={`rounded-card p-4 ${color}`}>
      <div className="flex items-start gap-2">
        <AlertIcon className="mt-0.5 shrink-0" />
        <div className="min-w-0">
          {title && <p className="text-label font-semibold">{title}</p>}
          <div className={`text-body ${title ? "mt-1" : ""}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
