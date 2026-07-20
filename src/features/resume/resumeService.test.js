import { describe, expect, it } from 'vitest';
import {
  createResumeService,
  getResumeStorageKey,
  RESUME_STORAGE_KEY,
} from './resumeService';

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

describe('resumeService', () => {
  it('주입된 저장소에 이력서를 저장하고 다시 불러온다', () => {
    const storage = createMemoryStorage();
    const resume = {
      profileName: '홍길동',
      desiredRole: '프론트엔드 개발자',
      educations: [
        {
          id: 'education-1',
          schoolType: '대학교',
          schoolName: '잡담대학교',
          period: '2020.03 - 2024.02',
          major: '컴퓨터공학',
          status: '졸업',
        },
      ],
    };

    const service = createResumeService(storage);
    service.save(resume);

    expect(storage.getItem(RESUME_STORAGE_KEY)).toBe(JSON.stringify(resume));
    expect(createResumeService(storage).load()).toEqual(resume);
  });

  it('손상된 저장 데이터는 빈 이력서로 처리한다', () => {
    const storage = createMemoryStorage();
    storage.setItem(RESUME_STORAGE_KEY, '{손상된 데이터');

    expect(createResumeService(storage).load()).toBeNull();
  });

  it('사용자별 저장소를 분리해 다른 사용자의 이력서를 읽지 않는다', () => {
    const storage = createMemoryStorage();
    const firstUserService = createResumeService(storage, 'user-one');
    const secondUserService = createResumeService(storage, 'user-two');

    firstUserService.save({ profileName: '홍길동', educations: [] });

    expect(storage.getItem(getResumeStorageKey('user-one'))).not.toBeNull();
    expect(secondUserService.load()).toBeNull();
  });

  it('사용할 수 없는 저장소에서는 저장 성공처럼 반환하지 않는다', () => {
    const service = createResumeService(null);

    expect(service.load()).toBeNull();
    expect(() => service.save({ educations: [] })).toThrow('브라우저 저장소');
  });
});
