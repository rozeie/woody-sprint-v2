/**
 * 앱이 쓰는 전체 자료 목록. 가상 예시 자료(demo-contents.ts)와 외부 원문 기반 자료(source-contents.ts)를 합친다.
 * 추천 규칙은 둘을 구분하지 않고 같은 관련성 기준(확정 주제와 겹침)으로 고른다. 의존성이 없다(테스트가 직접 import).
 */
import type { ContentFull } from "../lib/content/types.ts";
import { DEMO_CONTENTS } from "./demo-contents.ts";
import { SOURCE_CONTENTS } from "./source-contents.ts";

export const CATALOG: readonly ContentFull[] = [...DEMO_CONTENTS, ...SOURCE_CONTENTS];
