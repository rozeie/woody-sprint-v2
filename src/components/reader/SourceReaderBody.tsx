"use client";

import type { ContentSource, SourceReader } from "@/lib/content/types";
import { ButtonLink } from "@/components/ui/Button";
import { READ } from "./ExampleReaderBody";
import { NoteField, useReaderNotes } from "./ReaderNotesFields";

const H2 = "mb-2 mt-10 text-section-title font-bold";
const H3 = "mb-2 mt-7 text-card-title font-semibold";

function dateText(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

/** 상단 출처와 원문 보기. 원문은 새 탭에서 열려 이 리더의 상태가 그대로 유지된다. */
export function SourceHeader({ source }: { source: ContentSource }) {
  return (
    <section aria-labelledby="source-title" className="mt-4">
      <h2 id="source-title" className="text-caption font-semibold text-fg-secondary">
        출처
      </h2>
      <p className="mt-1 text-body leading-[1.75] text-fg">
        {source.author ? `${source.author}, ` : ""}
        {source.publisher}
        {source.publishedAt ? `, ${dateText(source.publishedAt)}` : ""}
      </p>
      <p lang="en" className="text-caption text-fg-secondary">
        {source.title}
      </p>
      <div className="mt-3">
        <ButtonLink
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
          compact
          data-source-link
        >
          원문 보기<span className="sr-only">, 새 탭에서 열려요</span>
        </ButtonLink>
      </div>
      <p className="mt-2 text-caption text-fg-muted">
        원문은 새 탭에서 열려요. 원문 탭에서 보낸 시간은 학습 시간에 포함되지 않아요.
      </p>
    </section>
  );
}

/**
 * 원문 기반 리더 본문: 원문 요약, 내 고민과 연결해 보기, 미니미션(선택), 짧은 회고(선택).
 * 원문의 내용(요약)과 Stack이 덧붙인 해석(연결)을 구분해 보여 준다. 미션과 회고는 데이터가 있을 때만 그린다.
 */
export function SourceReaderBody({
  contentId,
  reader,
  confirmedTopics,
}: {
  contentId: string;
  reader: SourceReader;
  confirmedTopics: { key: string; label: string }[];
}) {
  const hasMission = !!reader.miniMission;
  const hasReflection = !!reader.reflection;
  const notes = useReaderNotes(contentId, hasMission, hasReflection);
  const linked = reader.connections
    .map((c) => ({ ...c, label: confirmedTopics.find((t) => t.key === c.topicKey)?.label }))
    .filter((c): c is typeof c & { label: string } => !!c.label);

  return (
    <>
      <h2 className={H2}>원문 요약</h2>
      <p className="text-caption text-fg-secondary">
        원문을 읽고 Stack이 직접 정리한 요약이에요. 원문 전체나 번역이 아니에요.
      </p>
      {reader.summary.map((s) => (
        <section key={s.heading}>
          <h3 className={H3}>{s.heading}</h3>
          {s.paragraphs.map((p, i) => (
            <p key={p} className={i === 0 ? READ : `${READ} mt-4`}>
              {p}
            </p>
          ))}
          {s.points && (
            <ul className="mt-4 list-none space-y-2">
              {s.points.map((pt) => (
                <li key={pt} className={READ}>
                  {pt}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {linked.length > 0 && (
        <section aria-labelledby="connect-title" data-reader-connect>
          <h3 id="connect-title" className={H3}>
            내 고민과 연결해 보기
          </h3>
          <p className="text-caption text-fg-secondary">여기부터는 원문이 아니라 Stack이 덧붙인 해석이에요.</p>
          {linked.map((c) => (
            <div key={c.topicKey} className="mt-3">
              <p className="text-body font-semibold text-fg">내가 정한 학습 주제: {c.label}</p>
              <p className={`${READ} mt-1`}>{c.text}</p>
            </div>
          ))}
        </section>
      )}

      {reader.miniMission && (
        <section aria-labelledby="mission-title" data-reader-mission>
          <h2 id="mission-title" className={H2}>
            미니미션 <span className="text-caption font-semibold text-fg-secondary">선택</span>
          </h2>
          <p className="text-caption text-fg-secondary">
            약 {reader.miniMission.estMinutes}분, 하지 않아도 학습을 완료할 수 있어요.
          </p>
          <h3 className={H3}>{reader.miniMission.title}</h3>
          <p className={READ}>{reader.miniMission.instruction}</p>
          <ol className={`${READ} mt-3 list-decimal space-y-2 pl-5`}>
            {reader.miniMission.steps.map((st) => (
              <li key={st}>{st}</li>
            ))}
          </ol>
          <div className="mt-4">
            <NoteField
              id="note-mission"
              label="미니미션 작성"
              example={reader.miniMission.placeholder}
              value={notes.mission}
              onChange={notes.setMission}
            />
          </div>
        </section>
      )}

      {reader.reflection && (
        <section aria-labelledby="reflection-title" data-reader-reflection>
          <h2 id="reflection-title" className={H2}>
            짧은 회고 <span className="text-caption font-semibold text-fg-secondary">선택</span>
          </h2>
          <p className={READ}>{reader.reflection.question}</p>
          <div className="mt-4">
            <NoteField
              id="note-reflection"
              label="짧은 회고 작성"
              example={reader.reflection.placeholder}
              value={notes.reflection}
              onChange={notes.setReflection}
            />
          </div>
        </section>
      )}

      {(hasMission || hasReflection) && (
        <p className="mt-2 text-caption text-fg-muted">
          작성한 내용은 이 브라우저에만 자동으로 저장돼요. 평가하거나 서버로 보내지 않아요.
        </p>
      )}
    </>
  );
}
