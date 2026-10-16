import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { PageContainer } from "@/components/PageContainer";

/** 온보딩 4단계. 머리글, 진행 바, 하단 고정 CTA는 OnboardingForm이 그린다(높이를 채우는 세로 배치). */
export default function OnboardingPage() {
  return (
    <PageContainer fill>
      <OnboardingScreen />
    </PageContainer>
  );
}
