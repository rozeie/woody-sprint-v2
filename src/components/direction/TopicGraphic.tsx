import { CONCERN_CHIPS } from "@/config/ui-provisional";

/**
 * 세부 학습 주제 카드의 미니 그래픽. 주제의 특징을 도형 조합으로 보여 주는 장식이며
 * 실제 분석 수치나 평가 결과가 아니다(막대 높이와 기준선에는 의미 있는 값이 없다).
 * 색은 Stack의 그린과 중립색 토큰만 쓰고, 화면 읽기 도구에서는 숨긴다.
 */
type Kind = "flow" | "bars" | "cards" | "research" | "chat" | "grid";

const KIND_BY_KEY: Record<string, Kind> = {
  "ia-flow": "flow",
  "interaction-prototype": "flow",
  "data-metrics": "bars",
  portfolio: "cards",
  resume: "cards",
  "design-task": "cards",
  "design-system": "grid",
  "ui-design": "grid",
  accessibility: "grid",
};

const KIND_BY_GROUP: Record<string, Kind> = {
  "문제 정의와 리서치": "research",
  설계: "flow",
  "협업과 소통": "chat",
  커리어: "cards",
};

const groupByKey = new Map(CONCERN_CHIPS.map((c) => [c.key, c.group]));

export function graphicKind(topicKey: string): Kind {
  const byKey = KIND_BY_KEY[topicKey];
  if (byKey) return byKey;
  const group = groupByKey.get(topicKey);
  return (group && KIND_BY_GROUP[group]) || "grid";
}

export function TopicGraphic({ topicKey, className }: { topicKey: string; className?: string }) {
  const kind = graphicKind(topicKey);
  return (
    <svg
      viewBox="0 0 96 72"
      width={96}
      height={72}
      aria-hidden="true"
      focusable="false"
      data-graphic={kind}
      className={className}
    >
      {kind === "flow" && (
        <g strokeWidth={2} strokeLinecap="round">
          <path d="M26 38 C32 38 32 22 38 22" className="fill-none stroke-primary" strokeDasharray="3 3" />
          <path d="M60 22 C66 22 66 46 72 46" className="fill-none stroke-primary" strokeDasharray="3 3" />
          <rect x="3" y="24" width="23" height="30" rx="5" className="fill-surface stroke-line" />
          <rect x="37" y="6" width="23" height="30" rx="5" className="fill-surface stroke-primary" />
          <rect x="71" y="32" width="23" height="30" rx="5" className="fill-surface stroke-line" />
          <path d="M8 33h13M8 40h9" className="stroke-line" />
          <path d="M42 15h13M42 22h9" className="stroke-primary" />
          <path d="M76 41h13M76 48h9" className="stroke-line" />
        </g>
      )}
      {kind === "bars" && (
        <g>
          <rect x="10" y="38" width="12" height="24" rx="3" className="fill-line" />
          <rect x="29" y="20" width="12" height="42" rx="3" className="fill-primary" />
          <rect x="48" y="30" width="12" height="32" rx="3" className="fill-line" />
          <rect x="67" y="12" width="12" height="50" rx="3" className="fill-primary-tint stroke-primary" strokeWidth={2} />
          <path d="M4 28h88" strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" className="stroke-primary-ink" />
          <path d="M4 63h88" strokeWidth={2} strokeLinecap="round" className="stroke-line" />
        </g>
      )}
      {kind === "cards" && (
        <g strokeWidth={2}>
          {/* 가장 뒤 사각형: 성장 계획 세우기만 연한 그린(#15B574 10%). 같은 그래픽을 쓰는 다른 주제는 회색 그대로 */}
          <rect
            x="30"
            y="4"
            width="58"
            height="40"
            rx="6"
            className={topicKey === "growth-plan" ? "fill-primary/10 stroke-primary/10" : "fill-line stroke-line"}
          />
          <rect x="19" y="14" width="58" height="40" rx="6" className="fill-primary-tint stroke-primary" />
          <rect x="8" y="24" width="58" height="40" rx="6" className="fill-surface stroke-primary" />
          <path d="M16 36h26M16 44h18" strokeLinecap="round" className="stroke-primary" />
          <rect x="48" y="34" width="10" height="20" rx="3" className="fill-primary stroke-primary" />
        </g>
      )}
      {kind === "research" && (
        <g strokeWidth={2}>
          <path d="M48 36 20 18M48 36l30-14M48 36l-6 28M48 36l34 22" strokeLinecap="round" className="stroke-line" />
          <circle cx="20" cy="18" r="7" className="fill-surface stroke-primary" />
          <circle cx="78" cy="22" r="6" className="fill-primary-tint stroke-primary" />
          <circle cx="42" cy="64" r="5" className="fill-surface stroke-line" />
          <circle cx="82" cy="58" r="6" className="fill-surface stroke-line" />
          <circle cx="48" cy="36" r="12" className="fill-primary stroke-primary" />
          <circle cx="48" cy="36" r="4" className="fill-surface stroke-surface" />
        </g>
      )}
      {kind === "chat" && (
        <g strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
          <path d="M10 8h48a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H26l-9 8v-8h-7a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6z" className="fill-primary-tint stroke-primary" />
          <path d="M42 40h38a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6h-3v7l-9-7H42a6 6 0 0 1-6-6V46a6 6 0 0 1 6-6z" className="fill-surface stroke-line" />
          <path d="M16 20h26M16 28h16" className="stroke-primary" />
          <path d="M44 51h10M58 51h10" className="stroke-line" />
        </g>
      )}
      {kind === "grid" && (
        <g strokeWidth={2}>
          <rect x="10" y="8" width="32" height="26" rx="6" className="fill-primary stroke-primary" />
          <rect x="50" y="8" width="32" height="26" rx="6" className="fill-surface stroke-line" />
          <rect x="10" y="42" width="32" height="22" rx="6" className="fill-surface stroke-line" />
          <circle cx="66" cy="53" r="11" className="fill-primary-tint stroke-primary" />
        </g>
      )}
    </svg>
  );
}

/** 핵심 학습 방향 카드의 나침반 그래픽. 원형 배경 없이 눈금 고리와 바늘만 그린 장식이다. */
export function CompassGraphic({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={56} height={56} aria-hidden="true" focusable="false" data-graphic="compass" className={className}>
      <circle cx="32" cy="32" r="26" strokeWidth={2.5} className="fill-none stroke-line" />
      <path d="M32 4v6M32 54v6M4 32h6M54 32h6" strokeWidth={2.5} strokeLinecap="round" className="stroke-line" />
      <path d="M32 14l9 18H23z" strokeWidth={2} strokeLinejoin="round" className="fill-primary stroke-primary" />
      <path d="M32 50l-9-18h18z" strokeWidth={2} strokeLinejoin="round" className="fill-surface stroke-line" />
      <circle cx="32" cy="32" r="3" className="fill-surface stroke-primary" strokeWidth={2} />
    </svg>
  );
}

export function MoreIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden="true" focusable="false" className={className}>
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}
