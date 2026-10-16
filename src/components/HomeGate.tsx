"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getContentService } from "@/lib/content";
import type { RecommendationCard as Card } from "@/lib/content/types";
import { getRepository } from "@/lib/data";
import type { ConfirmedDirection } from "@/lib/direction-rules";
import { continueReadingOrder, stateOf, type UserContent } from "@/lib/selection-rules";
import { buildStackDays, type StackDay } from "@/lib/stack-rules";
import { ContinueReading, type ContinueItem } from "./home/ContinueReading";
import { RecommendationCard } from "./home/RecommendationCard";
import { StudyStack } from "./home/StudyStack";
import { SelectArea } from "./selection/SelectArea";
import { useSelectAction } from "./selection/useSelectAction";
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
 * 확정 후: 학습 스택 → 오늘의 추천 2개 → 이어서 읽기(선택한 자료가 있을 때만).
 * 추천 묶음은 확정 직후 만들어 저장하고, 없으면 이 화면에서 한 번 만든다. 이후에는 같은 묶음을 그대로 보여 준다.
 * 선택이 연결된 묶음·확정한 방향은 덮어쓰지 않는다.
 */
export function HomeGate() {
  const router = useRouter();
  const [data, setData] = useState<HomeData | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ id: string; n: number } | null>(null);

  // 선택이 바뀌었을 때 서재 기록과 이어서 읽기만 다시 읽는다(추천 묶음은 그대로)
  const refreshSelections = useCallback(async (focusId?: string) => {
    const userContents = await getRepository().getUserContents();
    const continueItems = await loadContinueItems(userContents);
    setData((prev) => (prev ? { ...prev, userContents, continueItems } : prev));
    if (focusId) setFocusRequest((p) => ({ id: focusId, n: (p?.n ?? 0) + 1 }));
  }, []);

  const { pendingId, busy, notice, select } = useSelectAction(async ({ contentId, selected }) => {
    await refreshSelections(selected ? contentId : undefined);
  });

  useEffect(() => {
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
      // 묶음이 없거나(또는 확정한 주제와 다르고) 선택이 연결되지 않았을 때만 새로 만든다
      if (!set || (!sameKeys(set.directionTopicKeys, topicKeys) && !hasSelection)) {
        const draft = await repo.getDirectionDraft();
        const input = draft?.input ?? (await repo.getOnboardingDraft());
        const created = await service.createRecommendation({ direction, input });
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
  }, [router]);

  // 선택이 끝나면 새로 나타난 "바로 학습 시작" 버튼으로 포커스를 옮긴다(누른 버튼이 사라지므로)
  useEffect(() => {
    if (!focusRequest) return;
    document.querySelector<HTMLElement>(`[data-start="${focusRequest.id}"]`)?.focus();
  }, [focusRequest]);

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
      {/* 하단 탐색이 현재 위치를 알려 주므로 제목은 화면 낭독용으로만 둔다(공간 절약) */}
      <h1 className="sr-only">홈</h1>

      <StudyStack days={stackDays} />

      <section aria-labelledby="rec-title" className="mt-6">
        <h2 id="rec-title" className="text-section-title font-bold">
          오늘의 추천
        </h2>
        <p className="mt-1 text-caption text-fg-secondary">
          매일 오후 6시(KST)에 추천이 바뀌어요. 선택한 자료는 서재에서 계속 읽을 수 있어요.
        </p>
        <p className="mt-1 text-caption text-fg-muted">‘{direction.coreDirection.label}’ 방향 기준</p>

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
                footer={
                  <SelectArea
                    layout="card"
                    contentId={card.contentId}
                    title={card.title}
                    previewHref={`/content/${card.contentId}/preview`}
                    state={selectedInSet?.contentId === card.contentId ? stateOf(selectedInSet) : null}
                    otherSelected={!!selectedInSet && selectedInSet.contentId !== card.contentId}
                    pending={pendingId === card.contentId}
                    busy={busy}
                    notice={notice}
                    onSelect={() => select({ setId, contentId: card.contentId, title: card.title })}
                  />
                }
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

      <ContinueReading items={continueItems} />
    </TabScreen>
  );
}
