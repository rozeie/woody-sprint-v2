import type { ConfirmedDirection } from "@/lib/direction-rules";
import { CompassGraphic } from "@/components/direction/TopicGraphic";

/**
 * 나의 학습 방향: 온보딩에서 사용자가 최종 확정한 핵심 학습 방향 한 문장과 세부 학습 주제 요약.
 * 섹션 제목은 카드 밖에 두고(다른 홈 섹션 제목과 같은 22px bold), 핵심 방향과 주제 태그를 하나의 화이트 카드로 묶는다.
 * 카드는 외곽 스트로크와 그림자 없이 흰 배경과 패딩으로만 구분한다(이 영역에만 적용). 왼쪽에는 온보딩 핵심 방향 카드의 나침반 그래픽을 원형 배경 없이 재사용한다.
 * 확정한 데이터만 보여 주며 새로 분석한 문장, 점수, 부족한 역량 진단은 만들지 않는다.
 * 주제 태그는 확정한 순서대로 전부 보여 주고(최대 5개) 공간이 모자라면 줄바꿈한다. 누를 수 없는 중립색 요약 태그라 추천 카드의 그린 고민 배지와 구분된다.
 * 카드와 태그는 누를 수 없다. 편집과 재분석은 이 영역에 두지 않는다.
 */
export function MyDirection({ direction }: { direction: ConfirmedDirection }) {
  return (
    <section aria-labelledby="my-direction-title" className="mt-6">
      <h2 id="my-direction-title" className="text-section-title font-bold">
        나의 학습 방향
      </h2>
      <div className="mt-3 flex items-start gap-3 rounded-card bg-surface p-4 min-[480px]:gap-4">
        {/* 390px에서는 40px로 줄여 텍스트 공간을 확보한다 */}
        <CompassGraphic className="size-10 shrink-0 min-[480px]:size-12" />
        <div className="min-w-0 flex-1">
          <p className="break-keep text-card-title font-bold text-fg">{direction.coreDirection.label}</p>
          <ul className="mt-3 flex list-none flex-wrap items-center gap-1.5">
            {direction.topics.map((t) => (
              <li key={t.key} className="rounded-chip bg-surface-subtle px-2.5 py-0.5 text-caption font-semibold text-fg">
                {t.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
