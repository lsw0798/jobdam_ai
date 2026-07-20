import { describe, expect, it } from 'vitest';
import {
  readStorageValue,
  resolveBrowserStorage,
  writeStorageValue,
} from './browserStorage';

describe('browserStorage', () => {
  it('저장소 읽기 권한이 없으면 빈 값으로 처리한다', () => {
    const inaccessibleStorage = {
      getItem() {
        throw new Error('storage access denied');
      },
    };

    expect(readStorageValue(inaccessibleStorage, 'draft')).toBeNull();
  });

  it('저장소가 없으면 저장 성공처럼 처리하지 않는다', () => {
    expect(() => writeStorageValue(null, 'draft', '{}'))
      .toThrow('브라우저 저장소를 사용할 수 없습니다.');
  });

  it('브라우저가 localStorage 접근을 차단하면 저장소가 없는 것으로 처리한다', () => {
    const globalRef = Object.defineProperty({}, 'localStorage', {
      get() {
        throw new Error('storage access denied');
      },
    });

    expect(resolveBrowserStorage(globalRef)).toBeNull();
  });
});
