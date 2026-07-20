import { CONTENT_SOURCE_KINDS } from './careerContentData';

export const CAREER_VIDEO_PAGE_SIZE = 5;

export const CAREER_VIDEO_CATEGORIES = Object.freeze([
  { id: 'all', label: '전체' },
  { id: '0', label: '진로' },
  { id: '1', label: '취업' },
  { id: '2', label: '인적성/NCS' },
  { id: '3', label: '기업분석' },
  { id: '4', label: '간호분야' },
]);

const unavailableNotice = '레거시 bbs_press 데이터베이스에 연결할 수 없어 현재 동영상 목록을 표시하지 않습니다.';

export function createUnavailableCareerVideoService() {
  return {
    sourceKind: CONTENT_SOURCE_KINDS.DB_UNAVAILABLE,
    async searchVideos({ page = 1 } = {}) {
      return {
        sourceKind: CONTENT_SOURCE_KINDS.DB_UNAVAILABLE,
        notice: unavailableNotice,
        items: [],
        total: 0,
        page,
        pageSize: CAREER_VIDEO_PAGE_SIZE,
        totalPages: 0,
      };
    },
    async getVideo() {
      return null;
    },
    async incrementVideoView() {
      return null;
    },
  };
}

function toContractVideoDto(row) {
  return {
    cd: String(row.cd),
    grp: String(row.grp),
    subject: String(row.subject ?? ''),
    contentsSummary: String(row.contentsSummary ?? ''),
    thumbnailUrl: String(row.thumbnailUrl ?? ''),
    registrationDate: String(row.registrationDate ?? ''),
    hit: Number(row.hit) || 0,
    lectureTime: String(row.lectureTime ?? ''),
    instructorIntroduction: String(row.instructorIntroduction ?? ''),
    lectureIntroduction: String(row.lectureIntroduction ?? ''),
    sourceKind: CONTENT_SOURCE_KINDS.MOCK_CONTRACT,
  };
}

export function createContractCareerVideoService(fixtureRows = []) {
  if (fixtureRows.some(({ cd }) => !String(cd).startsWith('fixture-'))) {
    throw new Error('계약 목업 동영상 식별자는 fixture-* 형식이어야 합니다.');
  }

  const videos = fixtureRows.map(toContractVideoDto);

  return {
    sourceKind: CONTENT_SOURCE_KINDS.MOCK_CONTRACT,
    async searchVideos({ categoryId = 'all', page = 1, query = '' } = {}) {
      const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
      const matchingVideos = videos.filter((video) => {
        const matchesCategory = categoryId === 'all' || video.grp === categoryId;
        const searchableText = `${video.subject} ${video.contentsSummary}`.toLocaleLowerCase('ko-KR');
        return matchesCategory && searchableText.includes(normalizedQuery);
      }).sort((first, second) => second.cd.localeCompare(first.cd, 'ko-KR', { numeric: true }));
      const totalPages = Math.ceil(matchingVideos.length / CAREER_VIDEO_PAGE_SIZE);
      const offset = (page - 1) * CAREER_VIDEO_PAGE_SIZE;
      const items = matchingVideos.slice(offset, offset + CAREER_VIDEO_PAGE_SIZE);

      return {
        sourceKind: CONTENT_SOURCE_KINDS.MOCK_CONTRACT,
        notice: '라이브 DB 대신 fixture-* 식별자를 사용하는 bbs_press 계약 목업입니다.',
        items,
        total: matchingVideos.length,
        page,
        pageSize: CAREER_VIDEO_PAGE_SIZE,
        totalPages,
      };
    },
    async getVideo(cd) {
      const video = videos.find((candidate) => candidate.cd === String(cd));
      return video ? { ...video } : null;
    },
    async incrementVideoView(cd) {
      const video = videos.find((candidate) => candidate.cd === String(cd));
      if (!video) return null;
      video.hit += 1;
      return { ...video };
    },
  };
}
