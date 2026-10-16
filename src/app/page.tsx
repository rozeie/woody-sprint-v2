import { ButtonLink } from "@/components/ui/Button";
import { PageContainer } from "@/components/PageContainer";

export default function IntroPage() {
  return (
    <PageContainer className="flex flex-1 flex-col pb-10 pt-6">
      <header className="flex min-h-14 items-center">
        <span className="text-card-title font-bold">Stack</span>
      </header>
      <main className="flex flex-1 flex-col justify-center py-10">
        <h1 className="text-page-title font-bold">
          하루 10분, 커리어에 필요한 배움을 차곡차곡 쌓아가요
        </h1>
        <p className="mt-3 text-body text-fg-secondary">
          취업을 준비하거나 주니어로 일하는 프로덕트 디자이너가, 지금 겪는 고민에서 시작해 필요한 학습을
          시작하도록 돕는 서비스예요.
        </p>
        <p className="mt-3 text-caption text-fg-muted">
          이 화면은 UI 확인용 데모예요. 실제 AI 분석이나 개인화 추천은 연결되어 있지 않아요.
        </p>
      </main>
      <ButtonLink href="/onboarding">시작하기</ButtonLink>
    </PageContainer>
  );
}
