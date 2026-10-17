import { CATALOG } from "@/config/catalog";
import { DEMO_BODIES } from "@/config/demo-content-bodies";
import { SOURCE_READERS } from "@/config/source-contents";
import { createDemoContentService, type ContentService } from "./demo-content-service";

const service = createDemoContentService(CATALOG, DEMO_BODIES, SOURCE_READERS);

/** 콘텐츠 서비스의 교체 지점. 실제 콘텐츠 DB가 생기면 여기서만 바꾼다. */
export function getContentService(): ContentService {
  return service;
}

/** 정적 경로 생성용 */
export const DEMO_CONTENT_IDS = CATALOG.map((c) => c.id);

export type { ContentService, ContentSummary } from "./demo-content-service";
