import { describe, expect, it } from 'vitest';
import {
  CONTENT_SOURCE_KINDS,
  legacyExpertLectureLibrary,
  legacyJobSiteDirectory,
} from './careerContentData';

const expectedCategoryLabels = [
  '취업정보제공 사이트',
  '분야(직무)별 취업정보 사이트',
  '여성 특화 취업정보제공 사이트',
  '기업정보(분석)제공 사이트',
  '진로(직무,직업)정보 찾기 사이트',
  '외국어 & 자격증 정보제공 사이트',
  '자격증 및 교육정보 제공 사이트',
  '자기계발(진로설정) 정보 사이트',
  '공사(공기업) 수험정보 및 채용정보제공 사이트',
  '창업관련 정보제공 사이트',
  '공모전 정보제공 사이트',
  '각종 아르바이트 및 채용포털 사이트',
];

describe('careerContentData', () => {
  it('jobData/28.html의 12분류와 103개 실제 사이트 DTO를 보존한다', () => {
    const sites = legacyJobSiteDirectory.categories.flatMap((category) => category.sites);

    expect(legacyJobSiteDirectory.sourceKind).toBe(CONTENT_SOURCE_KINDS.STATIC_LEGACY);
    expect(legacyJobSiteDirectory.categories.map((category) => category.label)).toEqual(expectedCategoryLabels);
    expect(sites).toHaveLength(103);
    expect(new Set(sites.map((site) => site.href))).toHaveProperty('size', 100);
    expect(sites).toContainEqual(expect.objectContaining({
      name: '잡담(JOBDAM)',
      href: 'http://www.jobdam.net',
      sourceKind: CONTENT_SOURCE_KINDS.STATIC_LEGACY,
    }));
    expect(sites).toContainEqual(expect.objectContaining({
      name: '아르바이트 천국',
      href: 'http://www.alba.co.kr',
      sourceKind: CONTENT_SOURCE_KINDS.STATIC_LEGACY,
    }));
    expect(sites.every(({ href, name }) => name.length > 0 && /^https?:\/\//.test(href))).toBe(true);
    expect(JSON.stringify(sites)).not.toContain('example.com');
  });

  it('활성 인사전문가 영역의 7분류와 실제 YouTube 강의 22개를 보존한다', () => {
    const lectures = legacyExpertLectureLibrary.categories.flatMap((category) => category.lectures);

    expect(legacyExpertLectureLibrary).toMatchObject({
      sourceKind: CONTENT_SOURCE_KINDS.STATIC_LEGACY,
      sourceReference: 'inc_html/ndesign_section2.html',
    });
    expect(legacyExpertLectureLibrary.categories.map((category) => category.label)).toEqual([
      '기업분석 완전정복',
      '스토리텔링 자소서',
      '쉬운 자소서 작성법',
      '자소서 기본항목 작성',
      '1분 Speech 핵심 노하우 강의',
      '인성 면접 완벽 준비',
      '역량 면접 핵심',
    ]);
    expect(lectures).toHaveLength(22);
    expect(lectures).toContainEqual(expect.objectContaining({
      title: '기업분석 1강',
      href: 'https://youtu.be/kpDTVPi6pa4',
      sourceKind: CONTENT_SOURCE_KINDS.STATIC_LEGACY,
    }));
    expect(lectures).toContainEqual(expect.objectContaining({
      title: '역량면접/구조화면접',
      href: 'https://youtu.be/vvoM3eRnbGU',
      sourceKind: CONTENT_SOURCE_KINDS.STATIC_LEGACY,
    }));
    expect(lectures.every(({ href }) => /^https:\/\/youtu\.be\/[\w-]+$/.test(href))).toBe(true);
    expect(JSON.stringify(lectures)).not.toContain('example.com');
  });
});
