import { describe, expect, it } from 'vitest';
import {
  createExperienceService,
  createLegacyExperienceRequest,
  EXPERIENCE_LEGACY_SECTION_IDS,
  EXPERIENCE_STORAGE_KEY,
  getExperienceStorageKey,
} from './experienceService';

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

function createDocument() {
  return {
    profile: {
      userName: '홍길동',
      schoolId: 'school-1',
      schoolName: '잡담대학교',
      homepage: 'https://portfolio.example',
      grade: '4',
      hp1: '010-0000-0000',
      email: 'user@example.com',
      snsHomepage: 'https://sns.example/user',
    },
    application: {
      subject: '컴퓨터공학',
      applyCompany: '잡담 AI',
      dutyCompany: '프론트엔드 개발자',
      myscore: '4.0',
      subjectscore: '4.1',
      graduationTerm: '2026-02',
    },
    jobModeling: {
      jobModeling1: '웹 표준',
      jobModeling2: 'React',
      jobModeling3: '사용자 문제 해결',
      jobModeling4: '협업',
    },
    competencyRecords: {
      foreignLanguage: { activity: '영어 발표', knowledge: '어휘', skill: '발표', attitude: '자신감' },
      schoolRecord: { activity: '전체성적', knowledge: 'CS', skill: '학습', attitude: '성실' },
      subjectRecord: { activity: '전공성적', knowledge: '전공', skill: '실습', attitude: '탐구' },
    },
    sections: {
      certificates: [{ clientId: 'certificate-local-1', activity: '정보처리기사', date: '2026-01-01', knowledge: '', skill: '', attitude: '' }],
      dutyActivities: [{ clientId: 'duty-local-1', activity: '캡스톤', dateFrom: '2025-03-01', dateTo: '2025-12-01', knowledge: '', skill: '', attitude: '' }],
      activities: [{ clientId: 'activity-local-1', activity: '학생회', date: '2024-06-01', knowledge: '', skill: '', attitude: '' }],
      others: [{ clientId: 'other-local-1', activity: '기타 경험', date: '2024-07-01', knowledge: '', skill: '', attitude: '' }],
    },
  };
}

describe('experienceService legacy adapter', () => {
  it('owner-scoped local mock에 고정 섹션 ID와 레거시 요청 키를 포함해 저장한다', () => {
    const storage = createMemoryStorage();
    const service = createExperienceService(
      storage,
      () => '2026-07-20T09:00:00.000Z',
      'owner/one',
    );

    const saved = service.save(createDocument());

    expect(service.adapterInfo).toEqual({
      kind: 'owner-scoped-local-mock',
      ownerId: 'owner/one',
      serverConnected: false,
    });
    expect(saved.legacyContract).toEqual({
      adapter: 'owner-scoped-local-mock',
      batchKind: 'EXPERIENCE',
      batchStatus: 'Y',
      fieldColumns: {
        applyCompany: 'attribute11',
        dutyCompany: 'attribute12',
        myscore: 'attribute13',
        subjectscore: 'attribute14',
        graduationTerm: 'attribute15',
      },
      sectionIds: EXPERIENCE_LEGACY_SECTION_IDS,
    });
    expect(saved.legacyRequest).toMatchObject({
      grade: '4',
      myscore: '4.0',
      subjectscore: '4.1',
      apply_conpany: '잡담 AI',
      duty_company: '프론트엔드 개발자',
      job_modeling1: '웹 표준',
      certificate_activities_1: '정보처리기사',
      certificate_date_1: '2026-01-01',
      duty_activitie_activities_1: '캡스톤',
      duty_date_from_1: '2025-03-01',
      duty_date_to_1: '2025-12-01',
      activitie_activities_1: '학생회',
      activitie_date_1: '2024-06-01',
      etc_activities_1: '기타 경험',
      etc_date_1: '2024-07-01',
    });
    expect(saved.createdAt).toBe('2026-07-20T09:00:00.000Z');
    expect(saved.updatedAt).toBe('2026-07-20T09:00:00.000Z');
    expect(storage.getItem(getExperienceStorageKey('owner/one'))).toBe(JSON.stringify(saved));
    expect(service.load()).toEqual(saved);
  });

  it('고정 영역을 평탄화할 때 최대 29행과 직무활동의 시작·종료일을 보존한다', () => {
    const document = createDocument();
    document.sections.dutyActivities = Array.from({ length: 31 }, (_, index) => ({
      activity: `활동 ${index + 1}`,
      dateFrom: `2025-01-${String((index % 28) + 1).padStart(2, '0')}`,
      dateTo: `2025-02-${String((index % 28) + 1).padStart(2, '0')}`,
      knowledge: '',
      skill: '',
      attitude: '',
    }));

    const request = createLegacyExperienceRequest(document);

    expect(request.duty_activitie_activities_29).toBe('활동 29');
    expect(request.duty_date_from_29).toBeTruthy();
    expect(request.duty_date_to_29).toBeTruthy();
    expect(request).not.toHaveProperty('duty_activitie_activities_30');
  });

  it('같은 브라우저에서도 소유자별 저장소를 분리한다', () => {
    const storage = createMemoryStorage();
    const first = createExperienceService(storage, undefined, 'owner-one');
    const second = createExperienceService(storage, undefined, 'owner-two');

    first.save(createDocument());

    expect(storage.getItem(getExperienceStorageKey('owner-one'))).not.toBeNull();
    expect(second.load()).toBeNull();
    expect(EXPERIENCE_STORAGE_KEY).toContain('v2');
  });

  it('유효한 JSON의 손상된 중첩 값과 알 수 없는 속성을 허용목록 shape로 정규화한다', () => {
    const storage = createMemoryStorage();
    const service = createExperienceService(storage);
    storage.setItem(EXPERIENCE_STORAGE_KEY, JSON.stringify({
      profile: { grade: { wrong: true }, dangerous: 'drop me' },
      application: null,
      jobModeling: { jobModeling1: 42 },
      competencyRecords: { foreignLanguage: null },
      sections: { certificates: null, dutyActivities: [{ activity: '복원 활동', dateFrom: 10 }] },
      unexpected: 'drop me',
    }));

    const loaded = service.load();

    expect(loaded.profile.grade).toBe('');
    expect(loaded.profile).not.toHaveProperty('dangerous');
    expect(loaded.application.myscore).toBe('');
    expect(loaded.jobModeling.jobModeling1).toBe('');
    expect(loaded.competencyRecords.foreignLanguage.activity).toBe('');
    expect(loaded.sections.certificates).toEqual([]);
    expect(loaded.sections.dutyActivities[0]).toMatchObject({ activity: '복원 활동', dateFrom: '', dateTo: '' });
    expect(loaded).not.toHaveProperty('unexpected');
  });

  it('사용할 수 없는 저장소에서는 저장 성공처럼 반환하지 않는다', () => {
    const service = createExperienceService(null, undefined, 'owner-one');

    expect(service.load()).toBeNull();
    expect(() => service.save(createDocument())).toThrow('브라우저 저장소');
  });
});
