/**
 * 홈 상단 대표 섹션. Stack의 그린(#15B574) 배경에 흰 글자를 올린다(사용자 지시. 대비 한계는 docs/ui-demo-decisions.md 참조).
 * 오른쪽 위의 겹친 층 모양(스택) 그래픽은 흰색 계열 면으로 배경과 구분하는 장식이라 화면 읽기 도구에서 숨긴다. CTA와 움직임은 없다.
 * 설명은 두 문장이며 두 번째 문장은 항상 새 줄에서 시작하고, 각 문장은 좁은 폭에서 어절 단위로 줄바꿈된다.
 * 제목과 그래픽은 한 줄(flex)에 나란히 두고 설명은 그 아래 전체 폭에 둔다. 그래픽이 설명과 겹치지 않고, 높이는 고정하지 않아 내용이 길어지면 자연스럽게 늘어난다.
 * 480px 프레임에서 높이가 과하게 늘지 않도록 패딩(위아래 14px), 제목 행간(28px), 설명 행간(24px), 그래픽(40px)을 줄였다.
 */
export function HomeHero() {
  return (
    <section aria-labelledby="home-hero-title" className="rounded-card bg-primary px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <h1 id="home-hero-title" className="min-w-0 text-section-title leading-7 font-bold text-on-primary">
          오늘의 배움을 골라보세요
        </h1>
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 96 80"
          width={96}
          height={80}
          data-graphic="stack"
          className="pointer-events-none h-10 w-12 shrink-0"
        >
          <rect x="14" y="4" width="68" height="22" rx="7" className="fill-surface opacity-40" />
          <rect x="8" y="26" width="72" height="22" rx="7" className="fill-surface opacity-70" />
          <rect x="2" y="48" width="76" height="26" rx="8" className="fill-surface" />
          <path d="M14 61h28" strokeWidth={3} strokeLinecap="round" className="stroke-primary" />
        </svg>
      </div>
      <p className="mt-1 text-body leading-6 text-on-primary">
        <span className="block">매일 오후 6시, 새로운 학습 자료를 추천해요.</span>
        <span className="block">선택한 자료는 서재에 남아요.</span>
      </p>
    </section>
  );
}
