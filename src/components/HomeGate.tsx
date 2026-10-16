"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getContentService } from "@/lib/content";
import type { RecommendationCard as Card } from "@/lib/content/types";
import { getRepository } from "@/lib/data";
import type { ConfirmedDirection } from "@/lib/direction-rules";
import { continueReadingOrder, type UserContent } from "@/lib/selection-rules";
import { cycleEndMs, cycleKeyOf, cycleKeyOfIso } from "@/lib/recommendation-cycle";
import { ReplaceCountdown } from "./home/ReplaceCountdown";
import { buildStackDays, type StackDay } from "@/lib/stack-rules";
import { ContinueReading, type ContinueItem } from "./home/ContinueReading";
import { RecommendationCard } from "./home/RecommendationCard";
import { HomeHero } from "./home/HomeHero";
import { MyDirection } from "./home/MyDirection";
import { StudyStack } from "./home/StudyStack";
import { TabScreen } from "./TabScreen";

type HomeData = {
  direction: ConfirmedDirection;
  setId: string;
  cards: Card[];
  shortage: "none" | "one" | "zero";
  stackDays: StackDay[];
  userContents: UserContent[];
  continueItems: ContinueItem[];
};

const sameKeys = (a: readonly string[], b: readonly string[]) =>
  [...a].sort().join("|") === [...b].sort().join("|");

async function loadContinueItems(userContents: UserContent[]): Promise<ContinueItem[]> {
  const ordered = continueReadingOrder(userContents);
  const summaries = await getContentService().getSummaries(ordered.map((u) => u.contentId));
  return ordered.flatMap((user) => {
    const summary = summaries.find((s) => s.contentId === user.contentId);
    return summary ? [{ user, summary }] : [];
  });
}

/**
 * 홈. 방향 확정 전에는 온보딩으로 보낸다(PRD F4-01).
 * 확정 후: 상단 대표 섹션 → 학습 스택 → 나의 학습 방향 → 이어서 읽기(선택한 미완료 자료가 있을 때만) → 오늘의 추천 2개.
 * 추천 묶음은 확정 직후 만들어 저장하고, 없으면 이 화면에서 한 번 만든다. 이후에는 같은 묶음을 그대로 보여 준다.
 * 선택이 연결된 묶음·확정한 방향은 덮어쓰지 않는다.
 */
export function HomeGate() {
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);
  // 추천 회차를 판단하는 현재 시각. 주기적으로, 탭에 돌아왔을 때, 교체 시각에 맞춰 갱신한다(브라우저 시계 기준 데모). 매초 남은 시간은 ReplaceCountdown이 따로 그린다
  // (Cache Components는 렌더 중 현재 시각을 읽지 못하므로 효과 안에서 처음 채운다)
  const [nowMs, setNowMs] = useState<number | null>(null);
  const cycleKey = nowMs === null ? null : cycleKeyOf(nowMs);

  useEffect(() => {
    const refresh = () => setNowMs(Date.now());
    const first = setTimeout(refresh, 0); // 화면이 다시 보일 때(다른 화면에서 돌아옴) 바로 현재 시각으로 맞춘다
    const interval = setInterval(refresh, 15_000);
    const atBoundary = setTimeout(refresh, cycleEndMs(Date.now()) - Date.now() + 500);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
      clearTimeout(atBoundary);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
    };
  }, [cycleKey]);

  useEffect(() => {
    if (cycleKey === null) return; // 현재 시각을 아직 읽지 않았다
    let alive = true;
    (async () => {
      const repo = getRepository();
      const direction = await repo.getConfirmedDirection();
      if (!alive) return;
      if (!direction) {
        setData(null);
        router.replace("/onboarding");
        return;
      }

      const service = getContentService();
      const topicKeys = direction.topics.map((t) => t.key);
      const existingContents = await repo.getUserContents();
      let set = await repo.getRecommendationSet();
      const hasSelection = set ? existingContents.some((u) => u.setId === set!.id) : false;
      // 저장된 묶음이 이전 회차(오후 6시가 지남)면 새 회차의 묶음으로 바꾼다. 앱을 닫아 두었다가 열어도 같다.
      const stale = !!set && cycleKeyOfIso(set.createdAt) < cycleKey;
      // 묶음이 없거나, 회차가 바뀌었거나, (확정한 주제와 다르고) 선택이 연결되지 않았을 때 새로 만든다
      if (!set || stale || (!sameKeys(set.directionTopicKeys, topicKeys) && !hasSelection)) {
        const draft = await repo.getDirectionDraft();
        const input = draft?.input ?? (await repo.getOnboardingDraft());
        // 새 회차에서는 직전 추천과 이미 선택한 자료를 빼고 같은 기준으로 고른다. 남는 자료가 모자라면 부족 상태가 된다(관련 없는 자료로 채우지 않는다)
        const excludeContentIds = stale
          ? [...set!.items.map((i) => i.contentId), ...existingContents.map((u) => u.contentId)]
          : [];
        const created = await service.createRecommendation({ direction, input, excludeContentIds });
        set = (await repo.saveRecommendationSet(created)) ? created : ((await repo.getRecommendationSet()) ?? created);
      }
      const cards = await service.getCards(set);
      const readingDays = await repo.getReadingDays();
      const userContents = await repo.getUserContents();
      const continueItems = await loadContinueItems(userContents);
      if (!alive) return;
      setData({
        direction,
        setId: set.id,
        cards,
        shortage: set.shortage,
        stackDays: buildStackDays(new Date(), readingDays),
        userContents,
        continueItems,
      });
    })();
    return () => {
      alive = false;
    };
  }, [router, cycleKey]);

  if (!data) {
    return (
      <p role="status" className="px-5 py-10 text-body text-fg-secondary">
        학습 방향을 확인하는 중이에요…
      </p>
    );
  }

  const { direction, cards, shortage, stackDays, setId, userContents, continueItems } = data;
  const selectedInSet = userContents.find((u) => u.setId === setId) ?? null;

  return (
    <TabScreen>
      <HomeHero />

      <div className="mt-6">
        <StudyStack days={stackDays} />
      </div>

      <MyDirection direction={direction} />

      {/* 선택했지만 완료하지 않은 자료가 있을 때만 그려지며, 있으면 오늘의 추천보다 위에 둔다 */}
      <ContinueReading items={continueItems} />

      <section aria-labelledby="rec-title" className="mt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 id="rec-title" className="text-section-title font-bold">
            오늘의 추천
          </h2>
          <ReplaceCountdown />
        </div>

        {shortage === "zero" ? (
          <p className="mt-3 rounded-card border border-line bg-surface p-4 text-body text-fg-secondary">
            확정한 주제에 맞는 자료를 준비 중이에요. 관련 없는 자료로 채우지 않았어요.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {cards.map((card, i) => (
              <RecommendationCard
                key={card.contentId}
                card={card}
                index={i}
                previewHref={`/content/${card.contentId}/preview`}
                selected={selectedInSet?.contentId === card.contentId}
              />
            ))}
          </div>
        )}

        {shortage === "one" && (
          <p role="status" className="mt-2 text-caption text-fg-secondary">
            맞는 자료가 지금은 1개예요. 더 준비 중이에요.
          </p>
        )}
      </section>

    </TabScreen>
  );
}
