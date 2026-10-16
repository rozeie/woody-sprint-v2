import type { ReactNode } from "react";
import type { RecommendationCard as Card } from "@/lib/content/types";

/**
 * 추천 카드: 빠르게 비교할 수 있는 압축형 (PRD F2-03 필수 정보 6개를 모두 유지, 말줄임 없음).
 * 제목, 유형과 주제와 예상 시간(한 묶음), 소개 한 문장, 핵심 학습 내용(짧은 구절), 추천 이유 한 문장, 하단 동작.
 * 구분 문자를 쓰지 않고 간격과 별도 요소로 나눈다. 핵심 학습 내용은 목록 구조(ul)로 두되 한 줄에 쉼표로 이어 읽히게 한다.
 * 카드에는 요약만 두고, 구체적인 설명은 상세 미리보기가 맡는다. 데모 고지는 화면 상단 한 곳에서만 한다.
 */
export function RecommendationCard({
  card,
  index,
  footer,
}: {
  card: Card;
  index: number;
  footer: ReactNode;
}) {
  const titleId = `rec-title-${index}`;
  return (
    <article aria-labelledby={titleId} className="rounded-card border border-line bg-surface p-4">
      <h3 id={titleId} className="text-card-title font-semibold">
        {card.title}
      </h3>

      <p className="mt-1 flex flex-wrap items-baseline gap-x-3 text-caption text-fg-secondary">
        <span>
          <span className="sr-only">유형 </span>
          <span className="font-semibold text-fg">{card.typeLabel}</span>
        </span>
        <span>
          <span className="sr-only">주제 </span>
          {card.topicLabels.join(", ")}
        </span>
        <span>
          <span className="sr-only">예상 시간 </span>약 {card.estMinutes}분
        </span>
      </p>

      <p className="mt-2 text-body">{card.summary}</p>

      <div className="mt-2 text-caption text-fg">
        <span className="font-semibold text-fg-secondary">핵심 학습 내용 </span>
        <ul className="inline list-none">
          {card.keyLearnings.map((k, i) => (
            <li key={k} className="inline">
              {k}
              {i < card.keyLearnings.length - 1 ? ", " : ""}
            </li>
          ))}
        </ul>
      </div>

      <p data-card-reason className="mt-2 text-caption text-fg-secondary">
        <span className="font-semibold text-fg">추천 이유 </span>
        {card.reason}
      </p>

      {footer}
    </article>
  );
}
