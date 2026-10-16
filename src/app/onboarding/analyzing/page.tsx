import { AnalyzingScreen } from "@/components/analysis/AnalyzingScreen";
import { PageContainer } from "@/components/PageContainer";
import { TopBar } from "@/components/TopBar";

export default function AnalyzingPage() {
  return (
    <PageContainer className="pb-10">
      <TopBar backHref="/onboarding" backLabel="입력 화면으로" />
      <main className="pt-4">
        <AnalyzingScreen />
      </main>
    </PageContainer>
  );
}
