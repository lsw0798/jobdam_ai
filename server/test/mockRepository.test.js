import { describe, expect, it } from 'vitest';
import { createMockRepository } from '../src/repositories/mockRepository.js';

describe('mockRepository sessions', () => {
  it('서버 기준 만료 시각을 지난 세션은 거부하고 삭제한다', async () => {
    let now = 1_000;
    const repository = createMockRepository({
      now: () => now,
      sessionTtlMs: 100,
    });
    const user = await repository.createUser({
      name: '세션 사용자',
      email: 'session@example.com',
      password: 'safe-password',
    });
    const sessionId = repository.createSession(user.id);

    expect(repository.getUserForSession(sessionId)).toMatchObject({ id: user.id });

    now = 1_101;

    expect(repository.getUserForSession(sessionId)).toBeNull();
    expect(repository.getUserForSession(sessionId)).toBeNull();
  });
});

describe('mockRepository users', () => {
  it('같은 이메일의 동시 가입 요청에서도 한 사용자만 생성한다', async () => {
    const repository = createMockRepository();
    const signup = {
      name: '동시 가입 사용자',
      email: 'race@example.com',
      password: 'safe-password',
    };

    const results = await Promise.all([
      repository.createUser(signup),
      repository.createUser({ ...signup, email: 'RACE@example.com' }),
    ]);

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(results.filter((result) => result === null)).toHaveLength(1);
  });
});

describe('mockRepository legacy document timestamps', () => {
  it('keeps reg-date semantics while advancing edit-date semantics on cover-letter updates', () => {
    let now = 1_000;
    const repository = createMockRepository({ now: () => now });
    const document = {
      masterCd: 'fixture-master-1',
      corp: '처음 기업',
      duty: { code: 'fixture-duty-1', name: '계약 직무' },
      consent: true,
      details: [],
    };

    const created = repository.saveCoverLetter('owner-1', document);

    now = 2_000;
    const updated = repository.saveCoverLetter('owner-1', { ...document, corp: '수정 기업' });

    expect(created).toMatchObject({
      createdAt: '1970-01-01T00:00:01.000Z',
      updatedAt: '1970-01-01T00:00:01.000Z',
    });
    expect(updated).toMatchObject({
      corp: '수정 기업',
      createdAt: created.createdAt,
      updatedAt: '1970-01-01T00:00:02.000Z',
    });
  });
});
