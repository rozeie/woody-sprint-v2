/**
 * 홈 상단 대표 섹션. Stack의 그린(#15B574) 배경에 흰 글자를 올린다(사용자 지시. 대비 한계는 docs/ui-demo-decisions.md 참조).
 * 오른쪽 위의 겹친 층 모양(스택) 그래픽은 흰색 계열 면으로 배경과 구분하는 장식이라 화면 읽기 도구에서 숨긴다. CTA와 움직임은 없다.
 * 설명은 두 문장이며 두 번째 문장은 항상 새 줄에서 시작하고, 각 문장은 좁은 폭에서 어절 단위로 줄바꿈된다.
 * 그래픽 높이(48px)는 제목 최소 높이(40px)와 위 여백(12px) 안쪽 안쪽에 들어가 설명 글자와 겹치지 않는다.
 */
export function HomeHero() {
  return (
    <section aria-labelledby="home-hero-title" className="relative overflow-hidden rounded-card bg-primary p-4">
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 96 80"
        width={96}
        height={80}
        data-graphic="stack"
        className="pointer-events-none absolute top-3 right-4 h-12 w-[3.6rem]"
      >
        <rect x="14" y="4" width="68" height="22" rx="7" className="fill-surface opacity-40" />
        <rect x="8" y="26" width="72" height="22" rx="7" className="fill-surface opacity-70" />
        <rect x="2" y="48" width="76" height="26" rx="8" className="fill-surface" />
        <path d="M14 61h28" strokeWidth={3} strokeLinecap="round" className="stroke-primary" />
      </svg>
      <h1 id="home-hero-title" className="relative min-h-10 pr-24 text-section-title font-bold text-on-primary">
        오늘의 배움을 골라보세요
      </h1>
      <p className="relative mt-1 text-body text-on-primary">
        <span className="block">매일 오후 6시, 새로운 학습 자료를 추천해요.</span>
        <span className="block">선택한 자료는 서재에 남아요.</span>
      </p>
    </section>
  );
}
