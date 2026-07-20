import { describe, expect, it } from 'vitest';
import {
  COVER_LETTER_FIXTURE_REFERENCES,
  COVER_LETTER_LIBRARY_STORAGE_KEY,
  createCoverLetterLegacyDto,
  createCoverLetterLibraryService,
  getCoverLetterLibraryStorageKey,
} from './coverLetterLibraryService';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

function createRecord(overrides = {}) {
  return {
    masterCd: 'fixture-master-1',
    applicationCompany: '잡담 AI',
    applicationRole: COVER_LETTER_FIXTURE_REFERENCES.duties[0].name,
    dutyCode: COVER_LETTER_FIXTURE_REFERENCES.duties[0].dutyCode,
    consent: true,
    items: [{
      detailCd: 1,
      title: '지원 동기',
      content: '사용자 문제를 해결합니다.',
      keywordCode: COVER_LETTER_FIXTURE_REFERENCES.keywords[0].keywordCode,
      exampleCd: COVER_LETTER_FIXTURE_REFERENCES.examples[0].exampleCd,
      sentenceType: 'content',
    }],
    ...overrides,
  };
}

describe('coverLetterLibraryService legacy contract adapter', () => {
  it('기본 reference DTO의 모든 식별자를 fixture-*로 표시하고 DB 미연결을 명시한다', () => {
    const service = createCoverLetterLibraryService(createMemoryStorage(), 'owner-one');
    const references = service.getReferences();

    expect(references.source).toBe('fixture');
    expect(references.banner).toContain('DB 미연결 계약 목업');
    expect(references.duties[0]).toMatchObject({
      masterCd: expect.stringMatching(/^fixture-/),
      detailCd: expect.stringMatching(/^fixture-/),
      dutyCode: expect.stringMatching(/^fixture-/),
    });
    expect(references.keywords[0].keywordCode).toMatch(/^fixture-/);
    expect(references.examples[0].exampleCd).toMatch(/^fixture-/);
    expect(service.adapterInfo).toEqual({
      kind: 'owner-scoped-local-mock',
      ownerId: 'owner-one',
      serverConnected: false,
    });
  });

  it('applicationCompany/applicationRole/items 의미와 식별자·동의를 저장하고 legacy master/detail DTO를 만든다', () => {
    const storage = createMemoryStorage();
    const service = createCoverLetterLibraryService(storage, 'owner-one', {
      now: () => '2026-07-20T09:00:00.000Z',
    });

    const saved = service.save(createRecord());

    expect(saved).toMatchObject({
      masterCd: 'fixture-master-1',
      applicationCompany: '잡담 AI',
      applicationRole: expect.any(String),
      dutyCode: expect.stringMatching(/^fixture-/),
      consent: true,
      items: [{
        detailCd: 1,
        title: '지원 동기',
        content: '사용자 문제를 해결합니다.',
        keywordCode: expect.stringMatching(/^fixture-/),
        exampleCd: expect.stringMatching(/^fixture-/),
        sentenceType: 'content',
      }],
      createdAt: '2026-07-20T09:00:00.000Z',
      updatedAt: '2026-07-20T09:00:00.000Z',
    });
    expect(saved.legacyDto).toEqual(createCoverLetterLegacyDto(saved));
    expect(saved.legacyDto).toMatchObject({
      masterCd: 'fixture-master-1',
      corp: '잡담 AI',
      consent: true,
      attribute5: 'Y',
      isApprove: true,
      duty: { code: saved.dutyCode, name: saved.applicationRole },
      details: [{
        cd: 1,
        detailCd: 1,
        subject: '지원 동기',
        contents: '사용자 문제를 해결합니다.',
        selectKeyword: saved.items[0].keywordCode,
        selectMyQuestion: saved.items[0].exampleCd,
        txt_result: '사용자 문제를 해결합니다.',
      }],
    });
    expect(storage.getItem(getCoverLetterLibraryStorageKey('owner-one'))).toBe(JSON.stringify([saved]));
    expect(service.load()).toEqual([saved]);
  });

  it('detail 식별자의 numeric/string 타입을 유지하고 6개 초과 저장은 거부한다', () => {
    const service = createCoverLetterLibraryService(createMemoryStorage(), 'owner-one');
    const mixedIds = createRecord({
      masterCd: 91,
      items: [
        { ...createRecord().items[0], detailCd: 1 },
        { ...createRecord().items[0], detailCd: 'fixture-detail-2' },
      ],
    });

    const saved = service.save(mixedIds);
    expect(saved.masterCd).toBe(91);
    expect(saved.items.map((item) => item.detailCd)).toEqual([1, 'fixture-detail-2']);

    expect(() => service.save(createRecord({
      masterCd: 'fixture-too-many',
      items: Array.from({ length: 7 }, (_, index) => ({
        ...createRecord().items[0],
        detailCd: index + 1,
      })),
    }))).toThrow('최대 6개');
  });

  it('소유자별 이력을 분리하고 같은 masterCd는 수정하며 삭제한다', () => {
    const storage = createMemoryStorage();
    const first = createCoverLetterLibraryService(storage, 'owner-one');
    const second = createCoverLetterLibraryService(storage, 'owner-two');

    first.save(createRecord());
    first.save(createRecord({ applicationCompany: '수정 기업' }));

    expect(first.load()).toHaveLength(1);
    expect(first.load()[0].applicationCompany).toBe('수정 기업');
    expect(second.load()).toEqual([]);
    expect(first.remove('fixture-master-1')).toBe(true);
    expect(first.load()).toEqual([]);
    expect(COVER_LETTER_LIBRARY_STORAGE_KEY).toContain('v2');
  });

  it('손상된 저장값은 허용목록 shape로 정규화하고 저장소가 없으면 성공처럼 반환하지 않는다', () => {
    const storage = createMemoryStorage();
    const service = createCoverLetterLibraryService(storage);
    storage.setItem(COVER_LETTER_LIBRARY_STORAGE_KEY, JSON.stringify([{
      masterCd: 'fixture-master-damaged',
      applicationCompany: { wrong: true },
      applicationRole: '직무',
      dutyCode: 17,
      consent: 'yes',
      items: [{ detailCd: 'fixture-detail-1', title: 3, content: '답변', unexpected: true }],
      unexpected: true,
    }]));

    const [loaded] = service.load();
    expect(loaded.applicationCompany).toBe('');
    expect(loaded.dutyCode).toBe(17);
    expect(loaded.consent).toBe(false);
    expect(loaded.items[0]).toMatchObject({ detailCd: 'fixture-detail-1', title: '', content: '답변' });
    expect(loaded.items[0]).not.toHaveProperty('unexpected');
    expect(loaded).not.toHaveProperty('unexpected');

    const unavailable = createCoverLetterLibraryService(null, 'owner-one');
    expect(unavailable.load()).toEqual([]);
    expect(() => unavailable.save(createRecord())).toThrow('브라우저 저장소');
    expect(() => unavailable.remove('fixture-master-1')).toThrow('브라우저 저장소');
  });
});
