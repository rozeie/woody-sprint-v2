/**
 * 이전 화면이 같은 앱(같은 출처)의 화면인지 판단한다. 새 탭·외부 링크로 들어온 경우에는 false여서
 * 이전 버튼이 앱 밖(빈 페이지·다른 사이트)으로 나가지 않게 한다. 클라이언트 전용.
 * Navigation API를 쓸 수 있으면 직전 기록의 출처를 확인하고, 없으면 기록 개수로 추정한다.
 */
export function canGoBackInApp(): boolean {
  if (typeof window === "undefined") return false;
  const nav = (
    window as unknown as {
      navigation?: {
        currentEntry?: { index: number } | null;
        entries(): { url?: string | null }[];
      };
    }
  ).navigation;
  if (nav?.currentEntry && typeof nav.entries === "function") {
    const prev = nav.entries()[nav.currentEntry.index - 1];
    if (!prev?.url) return false;
    try {
      return new URL(prev.url).origin === window.location.origin;
    } catch {
      return false;
    }
  }
  return window.history.length > 1;
}
