import { ONBOARDING_STEPS } from "@/lib/onboarding-steps";

/**
 * 온보딩 진행 표시: 4칸 진행 바와 현재 단계 이름.
 * 칸은 장식이고 상태는 글자(현재 단계 번호와 이름)와 progressbar 역할의 값으로도 전달한다. 색에만 의존하지 않는다.
 * 구분 문자를 쓰지 않고 간격으로 나눈다. 단계 이동은 바가 아니라 이전, 다음 버튼으로만 한다.
 */
export function ProgressSteps({ current }: { current: number }) {
  const total = ONBOARDING_STEPS.length;
  const label = ONBOARDING_STEPS[current - 1].label;
  return (
    <div>
      <p className="flex flex-wrap items-baseline gap-x-3 text-caption text-fg-secondary">
        <span className="font-semibold">
          {current}/{total}
        </span>
        <span className="font-semibold text-fg">{label}</span>
      </p>
      <div
        role="progressbar"
        aria-label="온보딩 진행 단계"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={`${total}단계 중 ${current}단계, ${label}`}
        className="mt-2 grid grid-cols-4 gap-1.5"
      >
        {ONBOARDING_STEPS.map((s, i) => (
          <span
            key={s.id}
            aria-hidden="true"
            data-progress-cell={i < current ? "filled" : "empty"}
            className={`h-1 rounded-chip ${i < current ? "bg-primary" : "bg-line"}`}
          />
        ))}
      </div>
    </div>
  );
}
