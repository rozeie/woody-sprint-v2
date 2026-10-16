type IconProps = { className?: string };

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} width={16} height={16} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} width={16} height={16} className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function AlertIcon({ className }: IconProps) {
  return (
    <svg {...base} width={20} height={20} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </svg>
  );
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 11l8-7 8 7v9H4z" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

export function LibraryIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 4h4v16H5zM11 4h4v16h-4z" />
      <path d="M17.5 5.5l3 .8-3.6 13.4-3-.8" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...base} width={16} height={16} strokeWidth={2.5} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/* 자료 분류(학습 방식) 아이콘: 기존 아이콘 체계(24px, 2px 선, currentColor)로 직접 그렸다. 외부 아이콘 라이브러리나 파일은 쓰지 않는다. */
export function ConceptIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
      <path d="M10 20.5h4" />
    </svg>
  );
}

export function CaseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5M9 12h7M9 16h5" />
    </svg>
  );
}

export function PracticeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z" />
      <path d="M14.5 6.5l3 3" />
    </svg>
  );
}

export function FrameworkIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <path d="M16.5 13v7M13 16.5h7" />
    </svg>
  );
}

export function TemplateIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 9h16M9 9v11" />
    </svg>
  );
}
