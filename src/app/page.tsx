import { ButtonLink } from "@/components/ui/Button";
import { PageContainer } from "@/components/PageContainer";

/**
 * 첫 진입 화면.
 * - 제목은 두 줄 구성("하루 10분," 다음 줄에 "필요한 배움을 차곡차곡")이며 각 줄은 블록이라 한 줄로 강제하지 않는다.
 *   좁은 폭이나 글자 확대에서는 어절 단위로 자연스럽게 줄바꿈된다(글자 크기는 줄이지 않는다).
 * - 배치는 레퍼런스의 구조만 따른다: 제목과 설명은 화면 위쪽(세로 중앙 정렬 없음, 왼쪽 정렬과 글자 크기 유지), 시작하기는 하단,
 *   둘 사이에는 남는 높이만큼 여백이 생긴다. 본문 영역의 아래 여백(pb-8)이 최소 간격이라 겹치지 않는다.
 * - 시작하기 버튼은 화면 하단에 둔다. 화면 전체 높이(dvh, 주소창 변화를 따름)를 채우는 세로 배치에서 본문 영역이 남는 공간을
 *   차지하므로 내용이 짧으면 버튼이 맨 아래에 붙고, 길어지거나 글자를 키우면 내용 끝에서 일반 스크롤로 닿는다.
 *   화면에 고정(fixed, sticky)하지 않아 어떤 경우에도 본문을 덮지 않는다. 하단 여백은 safe area를 반영한다.
 * - 데모 고지는 화면 상단 한 곳(DemoNotice)에서만 알린다.
 */
export default function IntroPage() {
  return (
    <PageContainer fill className="pt-6">
      <header className="flex min-h-14 items-center">
        <span className="text-card-title font-bold">Stack</span>
      </header>
      <main className="flex flex-1 flex-col pb-8 pt-12 md:pt-16">
        <h1 className="text-page-title font-bold">
          <span className="block">하루 10분,</span>{" "}
          <span className="block">필요한 배움을 차곡차곡</span>
        </h1>
        <p className="mt-3 text-body text-fg-secondary">
          취업 준비생과 주니어 프로덕트 디자이너의 고민을 필요한 학습으로 연결해요.
        </p>
      </main>
      <div className="pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
        <ButtonLink href="/onboarding">시작하기</ButtonLink>
      </div>
    </PageContainer>
  );
}
