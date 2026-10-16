import Link from "next/link";
import type { ContentType, RecommendationCard as Card } from "@/lib/content/types";
import { CaseIcon, ConceptIcon, FrameworkIcon, PracticeIcon, TemplateIcon } from "@/components/ui/icons";

const TYPE_ICON: Record<ContentType, typeof ConceptIcon> = {
  concept: ConceptIcon,
  case: CaseIcon,
  practice: PracticeIcon,
  framework: FrameworkIcon,
  template: TemplateIcon,
};

/** 카드 상단의 학습 방식 문구. 데이터의 분류(typeLabel)와 같은 5가지 학습 방식을 자료의 실제 내용에 맞게 풀어 쓴 표현이다. */
const TYPE_PHRASE: Record<ContentType, string> = {
  concept: "개념 이해하기",
  case: "사례 탐색",
  practice: "직접 실습해보기",
  framework: "프레임워크 익히기",
  template: "템플릿 활용하기",
};

/**
 * 추천 카드: 위쪽은 콘텐츠 정보, 아래쪽은 부가 정보로 나눈다.
 * 위쪽: 왼쪽에 학습 방식 아이콘(#15B574 10% 원형 배경 위의 선명한 아이콘), 오른쪽에 그린 학습 방식 문구, 강조된 콘텐츠명, 한 문장 소개(약 30자).
 * 아래쪽(얇은 구분선 아래): 예상 학습 시간, 연결되는 학습 주제 배지(최대 2개, 누를 수 없음), 선택한 자료의 작은 "선택됨".
 * 카드 전체가 상세 미리보기로 가는 하나의 링크이며 카드 안에 다른 링크나 버튼은 없다. 누르는 것만으로 선택, 서재 저장, 리더 이동은 일어나지 않는다.
 * 주제 배지는 사용자가 확정한 학습 주제와 이 자료의 주제가 실제로 겹치는 경우에만 표시하며, 없으면 만들지 않는다.
 * 예시 자료는 Stack이 미리 쓴 가상 자료라 블로그나 논문 같은 자료 종류는 표시하지 않는다.
 */
export function RecommendationCard({
  card,
  index,
  previewHref,
  selected,
}: {
  card: Card;
  index: number;
  previewHref: string;
  selected: boolean;
}) {
  const titleId = `rec-title-${index}`;
  const Icon = TYPE_ICON[card.type];
  return (
    <article>
      <Link
        href={previewHref}
        aria-labelledby={titleId}
        aria-describedby={`rec-kind-${index} rec-summary-${index} rec-meta-${index}`}
        className="block rounded-card border border-line/70 bg-surface transition-colors duration-150 hover:border-fg-muted"
      >
        <span className="flex items-start gap-3 p-4">
          {/* 투명도는 배경 요소에만 적용하고 아이콘은 그대로 선명하게 둔다 */}
          <span aria-hidden="true" className="relative inline-flex size-12 shrink-0 items-center justify-center rounded-full">
            <span className="absolute inset-0 rounded-full bg-primary/10" />
            <Icon className="relative size-7 text-primary" />
          </span>
          <span className="min-w-0 flex-1">
            <span id={`rec-kind-${index}`} className="block text-caption font-semibold text-primary">
              <span className="sr-only">학습 방식 </span>
              {TYPE_PHRASE[card.type]}
            </span>
            <span id={titleId} className="mt-0.5 block text-card-title font-bold text-fg">
              {card.title}
            </span>
            <span id={`rec-summary-${index}`} className="mt-1 block text-body text-fg-secondary">
              {card.shortSummary}
            </span>
          </span>
        </span>
        <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line/70 px-4 py-2.5 text-caption text-fg-secondary">
          <span id={`rec-meta-${index}`} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
            <span>
              <span className="sr-only">예상 학습 시간 </span>약 {card.estMinutes}분
            </span>
            {card.linkedTopicLabels.length > 0 && (
              <span className="flex flex-wrap gap-1.5">
                <span className="sr-only">연결되는 주제 </span>
                {card.linkedTopicLabels.map((t) => (
                  <span key={t} className="rounded-chip bg-surface-subtle px-2.5 py-0.5 font-semibold text-fg">
                    {t}
                  </span>
                ))}
              </span>
            )}
          </span>
          {selected && <span className="shrink-0 font-semibold text-fg">선택됨</span>}
        </span>
      </Link>
    </article>
  );
}
