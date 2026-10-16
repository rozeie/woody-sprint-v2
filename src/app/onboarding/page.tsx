import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { PageContainer } from "@/components/PageContainer";
import { TopBar } from "@/components/TopBar";

export default function OnboardingPage() {
  return (
    <PageContainer className="pb-10">
      <TopBar backHref="/" />
      <main className="pt-4">
        <OnboardingScreen />
      </main>
    </PageContainer>
  );
}
