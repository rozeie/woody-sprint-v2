// 사용자 지시: 사용자에게 보이는 모든 문구와 메타데이터에서 가운데 점('·', 'ㆍ')과 구분용 '•'를 쓰지 않는다.
// 1) 소스에서 주석을 뺀 코드(문자열, JSX 텍스트, CSS)에 금지 문자가 없는지, 점 목록과 CSS 구분 문자가 없는지 확인한다.
// 2) 화면에 나가는 데이터(자료, 본문, 칩, 모의 분석, 추천 이유와 미리보기)를 만들어 금지 문자가 없는지 확인한다.
// 렌더된 화면과 접근성 라벨, 메타 태그, CSS 가상 요소는 브라우저 검증에서 따로 확인한다.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { DEMO_BODIES } from "../src/config/demo-content-bodies.ts";
import { CATALOG } from "../src/config/catalog.ts";
import { DEMO_CONTENTS } from "../src/config/demo-contents.ts";
import { SOURCE_CONTENTS, SOURCE_READERS } from "../src/config/source-contents.ts";
import { GROUP_FIXTURES, OTHER_ONLY_TOPICS, SITUATION_PHRASE, TOPIC_WHY } from "../src/config/mock-analysis-fixtures.ts";
import { CONCERN_CHIPS } from "../src/config/ui-provisional.ts";
import { buildMockAnalysis } from "../src/lib/analysis/mock-analysis-core.ts";
import { createDemoContentService } from "../src/lib/content/demo-content-service.ts";
import { EMPTY_DRAFT } from "../src/lib/onboarding-rules.ts";

const FORBIDDEN = /[·ㆍ•‧∙●▪◦⋅・]/u;

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.(ts|tsx|css)$/.test(e.name) ? [p] : [];
  });
}

/** 블록 주석과 줄 주석을 지운다. 줄 번호를 유지하려고 줄바꿈은 남긴다. */
function stripComments(src: string): string {
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  return noBlock
    .split("\n")
    .map((line) => line.replace(/(^|[\s;{(,])\/\/.*$/, "$1"))
    .join("\n");
}

describe("소스 코드(주석 제외)에 금지 문자와 점 목록이 없다", () => {
  const files = walk(path.resolve("src"));

  it("검사 대상 파일을 찾았다", () => {
    assert.ok(files.length > 30);
  });

  it("가운데 점, 구분용 점 문자가 없다", () => {
    const hits: string[] = [];
    for (const file of files) {
      stripComments(fs.readFileSync(file, "utf8"))
        .split("\n")
        .forEach((line, i) => {
          if (FORBIDDEN.test(line)) hits.push(`${path.relative(".", file)}:${i + 1}: ${line.trim().slice(0, 80)}`);
        });
    }
    assert.deepEqual(hits, []);
  });

  it("점 모양 목록 표시(list-disc 등)와 CSS로 넣는 구분 문자(before/after content)를 쓰지 않는다", () => {
    const hits: string[] = [];
    for (const file of files) {
      const code = stripComments(fs.readFileSync(file, "utf8"));
      for (const re of [/list-disc|list-square|list-circle/, /(before|after):content-\[/, /content:\s*["']/]) {
        if (re.test(code)) hits.push(`${path.relative(".", file)}: ${re}`);
      }
    }
    assert.deepEqual(hits, []);
  });
});

describe("화면에 나가는 데이터에 금지 문자가 없다", () => {
  const service = createDemoContentService(CATALOG, DEMO_BODIES, SOURCE_READERS);
  const check = (label: string, value: unknown) => {
    const text = JSON.stringify(value);
    const m = text.match(FORBIDDEN);
    assert.equal(m, null, `${label}: '${m?.[0]}' 주변: ${m ? text.slice(Math.max(0, (m.index ?? 0) - 25), (m.index ?? 0) + 25) : ""}`);
  };

  it("칩, 그룹, 예시 자료, 리더 본문", () => {
    check("칩", CONCERN_CHIPS);
    check("자료", DEMO_CONTENTS);
    check("본문", DEMO_BODIES);
    check("원문 기반 자료", SOURCE_CONTENTS);
    check("원문 기반 리더", SOURCE_READERS);
  });

  it("모의 분석 문구와 모든 입력 조합의 분석 결과", () => {
    check("그룹 문구", GROUP_FIXTURES);
    check("주제 설명", TOPIC_WHY);
    check("기본 주제와 상황", [OTHER_ONLY_TOPICS, SITUATION_PHRASE]);
    for (const chip of CONCERN_CHIPS) {
      for (let variant = 0; variant < 4; variant++) {
        check(`분석 ${chip.key}/${variant}`, buildMockAnalysis({ ...EMPTY_DRAFT, concernKeys: [chip.key], situation: "junior" }, variant));
      }
    }
    check(
      "분석 기타",
      buildMockAnalysis({ ...EMPTY_DRAFT, otherSelected: true, otherText: "스펙 합의가 어려워요", situation: "job_seeker" }, 0),
    );
  });

  it("추천 이유, 카드, 미리보기, 리더 응답(모든 주제 조합)", async () => {
    const keys = CONCERN_CHIPS.map((c) => c.key);
    const direction = (ks: string[]) => ({
      coreDirection: { label: "핵심 방향", description: "설명" },
      topics: ks.map((key) => ({ key, label: key })),
      edited: false,
      reanalysisCount: 0,
      confirmedAt: "t",
    });
    for (const k of keys) {
      const set = await service.createRecommendation({
        direction: direction([k, "problem-definition"]),
        input: { ...EMPTY_DRAFT, concernKeys: [k, "user-research"], otherSelected: true, otherText: "고민", situation: "junior" },
      });
      check(`추천 ${k}`, set.items);
      check(`카드 ${k}`, await service.getCards(set));
      for (const item of set.items) check(`미리보기 ${item.contentId}`, await service.getPreview(set, item.contentId));
    }
    for (const c of CATALOG) check(`리더 ${c.id}`, await service.getReaderContent(c.id));
  });
});
