import { describe, expect, it } from 'vitest';
import { CONTENT_SOURCE_KINDS } from './careerContentData';
import {
  CAREER_VIDEO_CATEGORIES,
  CAREER_VIDEO_PAGE_SIZE,
  createContractCareerVideoService,
  createUnavailableCareerVideoService,
} from './careerVideoService';

function fixtureVideo(overrides = {}) {
  return {
    cd: 'fixture-video-001',
    grp: '0',
    subject: '진로 강의',
    contentsSummary: '진로 탐색 요약',
    thumbnailUrl: '',
    registrationDate: '2026-07-20',
    hit: 4,
    lectureTime: '10분',
    instructorIntroduction: '계약 목업 강사',
    lectureIntroduction: '계약 검증용 강의 소개',
    ...overrides,
  };
}

describe('careerVideoService', () => {
  it('라이브 bbs_press가 없으면 데이터를 꾸미지 않고 DB 미연결 응답을 반환한다', async () => {
    const service = createUnavailableCareerVideoService();

    const result = await service.searchVideos({ categoryId: 'all', page: 1, query: '' });

    expect(CAREER_VIDEO_CATEGORIES).toEqual([
      { id: 'all', label: '전체' },
      { id: '0', label: '진로' },
      { id: '1', label: '취업' },
      { id: '2', label: '인적성/NCS' },
      { id: '3', label: '기업분석' },
      { id: '4', label: '간호분야' },
    ]);
    expect(result).toMatchObject({
      sourceKind: CONTENT_SOURCE_KINDS.DB_UNAVAILABLE,
      items: [],
      total: 0,
      page: 1,
      pageSize: CAREER_VIDEO_PAGE_SIZE,
      totalPages: 0,
    });
    expect(result.notice).toContain('bbs_press');
    await expect(service.getVideo('fixture-video-1')).resolves.toBeNull();
    await expect(service.incrementVideoView('fixture-video-1')).resolves.toBeNull();
  });

  it('계약 목업에서 grp 분류와 subject+contents_summary 검색을 함께 적용한다', async () => {
    const service = createContractCareerVideoService([
      fixtureVideo({ cd: 'fixture-video-003', grp: '1', subject: '취업 제목 일치' }),
      fixtureVideo({
        cd: 'fixture-video-002',
        grp: '1',
        subject: '다른 제목',
        contentsSummary: '숨은 검색어가 있는 요약',
      }),
      fixtureVideo({
        cd: 'fixture-video-001',
        grp: '0',
        subject: '검색어가 있지만 다른 분류',
      }),
    ]);

    const result = await service.searchVideos({ categoryId: '1', page: 1, query: '검색어' });

    expect(result).toMatchObject({
      sourceKind: CONTENT_SOURCE_KINDS.MOCK_CONTRACT,
      total: 1,
      pageSize: 5,
    });
    expect(result.notice).toContain('계약 목업');
    expect(result.items).toEqual([
      expect.objectContaining({
        cd: 'fixture-video-002',
        grp: '1',
        sourceKind: CONTENT_SOURCE_KINDS.MOCK_CONTRACT,
      }),
    ]);
  });

  it('cd 내림차순으로 정렬해 페이지당 5건을 반환한다', async () => {
    const service = createContractCareerVideoService(Array.from({ length: 12 }, (_, index) => fixtureVideo({
      cd: `fixture-video-${String(index + 1).padStart(3, '0')}`,
      subject: `계약 강의 ${index + 1}`,
    })));

    const result = await service.searchVideos({ categoryId: 'all', page: 2, query: '' });

    expect(result).toMatchObject({ total: 12, page: 2, pageSize: 5, totalPages: 3 });
    expect(result.items.map(({ cd }) => cd)).toEqual([
      'fixture-video-007',
      'fixture-video-006',
      'fixture-video-005',
      'fixture-video-004',
      'fixture-video-003',
    ]);
  });

  it('실제 DB 행처럼 보이는 식별자는 계약 목업에 넣지 못하게 한다', () => {
    expect(() => createContractCareerVideoService([
      fixtureVideo({ cd: '42', subject: '실제 데이터처럼 보이는 행' }),
    ])).toThrow('fixture-*');
  });

  it('상세 DTO를 조회하고 상세 열기용 조회수 증가를 반영한다', async () => {
    const service = createContractCareerVideoService([fixtureVideo()]);

    const detail = await service.getVideo('fixture-video-001');
    const incremented = await service.incrementVideoView('fixture-video-001');

    expect(detail).toMatchObject({
      lectureTime: '10분',
      instructorIntroduction: '계약 목업 강사',
      lectureIntroduction: '계약 검증용 강의 소개',
      hit: 4,
    });
    expect(incremented).toMatchObject({ cd: 'fixture-video-001', hit: 5 });
    await expect(service.getVideo('fixture-video-001')).resolves.toMatchObject({ hit: 5 });
  });
});
