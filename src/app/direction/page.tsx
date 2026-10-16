import { DirectionScreen } from "@/components/direction/DirectionScreen";
import { PageContainer } from "@/components/PageContainer";
import { TopBar } from "@/components/TopBar";

export default function DirectionPage() {
  return (
    <PageContainer className="pb-10">
      <TopBar backHref="/onboarding" backLabel="입력 화면으로" />
      <main className="pt-2">
        <DirectionScreen />
      </main>
    </PageContainer>
  );
}
