import type { ReaderBody } from "@/lib/content/types";

export const READ = "text-body leading-[1.75] text-fg";
const H2 = "mb-3 mt-8 text-section-title font-bold";

/**
 * 가상 예시 자료의 본문(원문 출처가 없는 자료). 구성과 내용은 그대로이고 글자만 리더 기본(16px, 행간 1.75)에 맞췄다.
 * 미션과 회고 데이터가 없어서 그 영역은 만들지 않는다.
 */
export function ExampleReaderBody({ body }: { body: ReaderBody }) {
  return (
    <>
      <h2 className={H2}>학습 목표</h2>
      <p className={READ}>{body.goal}</p>

      <h2 className={H2}>핵심 개념과 원리</h2>
      <dl>
        {body.concepts.map((c) => (
          <div key={c.term} className="mt-5 first:mt-0">
            <dt className={`${READ} font-semibold`}>{c.term}</dt>
            <dd className={`${READ} mt-1`}>{c.explanation}</dd>
          </div>
        ))}
      </dl>

      <h2 className={H2}>상세 설명</h2>
      {body.detail.map((para, i) => (
        <p key={para} className={i === 0 ? READ : `${READ} mt-5`}>
          {para}
        </p>
      ))}

      <h2 className={H2}>실무 사례</h2>
      <h3 className="text-card-title font-semibold">{body.caseStudy.title}</h3>
      <dl className="mt-3">
        {(
          [
            ["상황", body.caseStudy.situation],
            ["접근", body.caseStudy.approach],
            ["결과", body.caseStudy.result],
          ] as const
        ).map(([label, text]) => (
          <div key={label} className="mt-4 first:mt-0">
            <dt className="text-body font-semibold text-fg-secondary">{label}</dt>
            <dd className={`${READ} mt-1`}>{text}</dd>
          </div>
        ))}
      </dl>

      <h2 className={H2}>실제 적용 방법</h2>
      <ol className={`${READ} list-decimal space-y-4 pl-5`}>
        {body.steps.map((s) => (
          <li key={s.step}>
            <p>{s.step}</p>
            <p className="mt-1 text-body leading-[1.75] text-fg-secondary">{s.tip}</p>
          </li>
        ))}
      </ol>

      <h2 className={H2}>이해 점검</h2>
      <p className="text-body text-fg-secondary">정답이나 점수는 없어요. 스스로 떠올려 보는 질문이에요.</p>
      <ol className={`${READ} mt-3 list-decimal space-y-3 pl-5`}>
        {body.checks.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ol>

      <h2 className={H2}>참고 자료</h2>
      <p className="text-body text-fg-secondary">더 공부하고 싶을 때 살펴볼 자료예요. 읽지 않아도 학습은 끝낼 수 있어요.</p>
      <ol className={`${READ} mt-3 list-decimal space-y-3 pl-5`}>
        {body.references.map((r) => (
          <li key={r.title}>
            <p>{r.title}</p>
            <p className="mt-1 text-body leading-[1.75] text-fg-secondary">{r.note}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
