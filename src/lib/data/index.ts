import { demoRepository } from "./demo-repository";
import type { StackRepository } from "./types";

/** 데이터 접근 계층의 교체 지점. 실제 서버 구현이 생기면 여기서만 바꾼다. */
export function getRepository(): StackRepository {
  return demoRepository;
}

export type { StackRepository } from "./types";
