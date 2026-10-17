"use client";

import { createContext, useContext } from "react";
import { getRepository } from "@/lib/data";
import type { StackRepository } from "@/lib/data/types";
import type { KV } from "@/lib/data/storage-scope";

/** 화면 사이를 오가는 경로. 운영 화면은 실제 경로를, 개발용 흐름은 /dev 아래 같은 구성의 경로를 쓴다. */
export type AppPaths = {
  home: string;
  library: string;
  settings: string;
  /** 개발용 흐름에는 온보딩이 없어서 개발용 홈(시나리오 선택)으로 돌려보낸다 */
  onboarding: string;
  preview: (contentId: string) => string;
  read: (contentId: string) => string;
};

export const APP_PATHS: AppPaths = {
  home: "/home",
  library: "/library",
  settings: "/settings",
  onboarding: "/onboarding",
  preview: (id) => `/content/${id}/preview`,
  read: (id) => `/read/${id}`,
};

export const DEV_APP_PATHS: AppPaths = {
  home: "/dev/home",
  library: "/dev/library",
  settings: "/settings",
  onboarding: "/dev/home",
  preview: (id) => `/dev/content/${id}/preview`,
  read: (id) => `/dev/read/${id}`,
};

/**
 * 화면이 쓰는 저장 환경과 경로. 운영 화면은 기본값(실제 사용자 저장소, 실제 경로)을 쓰고,
 * 개발용 확인 화면만 접두어로 분리한 저장소와 /dev 경로를 넣어 같은 화면 컴포넌트를 그대로 쓴다.
 * 기본값은 모듈 상수라서 참조가 바뀌지 않는다.
 */
export type ReaderEnv = {
  repo: () => StackRepository;
  readingStorage: () => KV;
  paths: AppPaths;
};

const defaultEnv: ReaderEnv = {
  repo: getRepository,
  readingStorage: () => window.localStorage,
  paths: APP_PATHS,
};

const ReaderEnvContext = createContext<ReaderEnv>(defaultEnv);

export const ReaderEnvProvider = ReaderEnvContext.Provider;
export const useReaderEnv = () => useContext(ReaderEnvContext);
