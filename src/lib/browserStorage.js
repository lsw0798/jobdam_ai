export function readStorageValue(storage, key) {
  try {
    return storage?.getItem?.(key) ?? null;
  } catch {
    return null;
  }
}

export function resolveBrowserStorage(globalRef = globalThis) {
  try {
    return globalRef.localStorage ?? null;
  } catch {
    return null;
  }
}

export function writeStorageValue(storage, key, value) {
  if (!storage?.setItem) {
    throw new Error('브라우저 저장소를 사용할 수 없습니다.');
  }

  storage.setItem(key, value);
}
