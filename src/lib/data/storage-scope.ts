/** 키 접두어로 저장 공간을 나눠 쓰기 위한 최소 저장소 형태 */
export type KV = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/**
 * 같은 localStorage 안에서 접두어가 다른 키만 보이게 하는 저장소 덮개.
 * 개발용 리더 확인 화면이 실제 사용자 기록(접두어 없는 키)과 섞이지 않게 하는 데 쓴다.
 */
export function prefixedStorage(base: KV, prefix: string): KV {
  return {
    getItem: (k) => base.getItem(prefix + k),
    setItem: (k, v) => base.setItem(prefix + k, v),
    removeItem: (k) => base.removeItem(prefix + k),
  };
}

/** 접두어로 시작하는 키만 지운다. 접두어가 없는 키(실제 사용자 기록)는 건드리지 않는다. */
export function clearPrefixed(base: Storage, prefix: string): void {
  if (!prefix) return;
  const keys: string[] = [];
  for (let i = 0; i < base.length; i++) {
    const k = base.key(i);
    if (k !== null && k.startsWith(prefix)) keys.push(k);
  }
  for (const k of keys) base.removeItem(k);
}
