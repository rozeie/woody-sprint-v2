import { PROGRESS_STEPS } from "@/lib/onboarding-steps";

/**
 * 온보딩 진행 표시: 5칸 진행 바와 현재 단계 이름 (1 고민 영역, 2 현재 상황, 3 추가 설명, 4 시작 전 안내, 5 학습 방향 확인).
 * 지나온 칸과 현재 칸은 모두 primary, 아직 도달하지 않은 칸은 회색이다. 현재 위치는 색이 아니라 n/5와 단계 이름, aria-valuenow와 aria-valuetext, aria-current로 전달한다.
 * 칸은 장식이고 상태는 글자(현재 단계 번호와 이름)와 progressbar 역할의 값으로도 전달한다. 색에만 의존하지 않는다.
 * 구분 문자를 쓰지 않고 간격으로 나눈다. 단계 이동은 바가 아니라 이전, 다음 버튼으로만 한다.
 * 5단계 결과 화면에서는 5칸이 모두 primary지만 온보딩 완료를 뜻하지 않는다. 완료는 확정 버튼을 눌러 저장하고 홈으로 이동할 때만 처리한다.
 */
export function ProgressSteps({ current }: { current: number }) {
  const total = PROGRESS_STEPS.length;
  const label = PROGRESS_STEPS[current - 1].label;
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
        className="mt-2 grid grid-cols-5 gap-1.5"
      >
        {PROGRESS_STEPS.map((s, i) => {
          const state = i + 1 < current ? "done" : i + 1 === current ? "current" : "todo";
          return (
            <span
              key={s.id}
              aria-hidden="true"
              data-progress-cell={state}
              data-current={state === "current" ? "true" : undefined}
              className={`h-1 rounded-chip ${
                state === "todo" ? "bg-line" : "bg-primary"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
