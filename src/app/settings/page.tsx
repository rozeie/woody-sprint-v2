import { TabScreen } from "@/components/TabScreen";

export default function SettingsPage() {
  return (
    <TabScreen>
      <h1 className="text-page-title font-bold">설정</h1>
      <p className="mt-3 text-body text-fg-secondary">
        설정은 아직 준비 중이에요. 이후 단계에서 학습 방향 확인, 기본 데이터 관리, 서비스 정보가 이곳에
        들어올 예정이에요.
      </p>
      <p className="mt-3 text-caption text-fg-muted">이 데모에서는 아직 구현되지 않았어요.</p>
    </TabScreen>
  );
}
