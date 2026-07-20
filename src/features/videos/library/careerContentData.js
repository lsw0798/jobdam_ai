export const CONTENT_SOURCE_KINDS = Object.freeze({
  STATIC_LEGACY: 'static-legacy',
  DB_UNAVAILABLE: 'db-unavailable',
  MOCK_CONTRACT: 'mock-contract',
});

const rawLegacyJobSiteCategories = [
  {
    id: 'sites-01',
    label: '취업정보제공 사이트',
    sites: [
      ['잡담(JOBDAM)', 'http://www.jobdam.net'],
      ['노동부 워크넷', 'http://www.work.go.kr'],
      ['잡영', 'http://jobyoung.work.go.kr'],
      ['금융감독원', 'http://www.fss.or.kr'],
      ['사람인', 'http://www.saramin.co.kr'],
      ['외교통상부 국제연합과', 'http://www.unrecruit.go.kr'],
      ['잡코리아', 'http://www.jobkorea.co.kr'],
      ['한국신용정보', 'http://www.nice.co.kr'],
      ['인크루트', 'http://www.incruit.com'],
      ['파인드잡', 'http://www.findjob.co.kr'],
      ['스카우트', 'http://www.scout.co.kr'],
      ['일모아', 'http://www.ilmoa.go.kr'],
      ['커리어', 'http://www.career.co.kr'],
      ['한국산업인력공단', 'http://www.hrdkorea.or.kr'],
      ['해커스잡', 'http://www.hackersjob.com'],
      ['월드잡', 'http://www.worldjob.or.kr'],
      ['KB굿잡', 'http://www.kbgoodjob.co.kr'],
      ['잡이스', 'http://www.jobis.co.kr'],
      ['기업은행 잡월드', 'http://www.ibkjob.co.kr'],
      ['서울일자리플러스센터', 'http://job.seoul.go.kr'],
      ['경기일자리센터', 'http://www.intoin.or.kr'],
    ],
  },
  {
    id: 'sites-02',
    label: '분야(직무)별 취업정보 사이트',
    sites: [
      ['공공기관 채용정보시스템', 'http://job.alio.go.kr'],
      ['한국세무사회', 'http://www.kacpta.or.kr'],
      ['총무닷컴', 'http://www.chongmu.com'],
      ['샵마넷', 'http://www.shopma.net'],
      ['널스잡', 'http://www.nursejob.co.kr'],
      ['간호잡', 'http://www.ganhojob.com'],
      ['웰페어넷', 'http://www.welfare.net'],
      ['사회복지취업마을', 'http://www.socialworker.tv'],
      ['게임잡', 'http://www.gamejob.co.kr'],
      ['eng잡', 'http://www.engjob.co.kr'],
      ['디자이너잡', 'http://www.designerjob.co.kr'],
      ['패션스카우트', 'http://www.fashionscout.co.kr'],
      ['패션워크', 'http://www.fashionwork.co.kr'],
      ['패션비즈', 'http://www.fashionbiz.co.kr'],
      ['디자인정글', 'http://www.jungle.co.kr'],
      ['한국산업디자인진흥원', 'http://www.designdb.com'],
      ['미디어잡', 'http://www.mediajob.co.kr'],
      ['광고정보센터', 'http://www.adic.co.kr'],
      ['워커', 'http://www.worker.co.kr'],
      ['콘잡', 'http://www.conjob.co.kr'],
      ['대한건설협회', 'http://www.cak.or.kr'],
    ],
  },
  {
    id: 'sites-03',
    label: '여성 특화 취업정보제공 사이트',
    sites: [
      ['경기도여성 능력개발센터', 'http://www.womenpro.or.kr'],
      ['여성인력개발센터', 'http://www.vocation.or.kr'],
      ['경기도여성 온라인경력개발센터', 'http://www.dream.go.kr'],
    ],
  },
  {
    id: 'sites-04',
    label: '기업정보(분석)제공 사이트',
    sites: [
      ['전자공시시스템', 'http://dart.fss.or.kr'],
      ['포스코경영연구소', 'http://www.posri.re.kr'],
      ['기업정보시스템', 'http://sminfo.smba.go.kr'],
      ['한국경제연구원', 'http://www.keri.org'],
      ['삼성경제연구소', 'http://www.seri.org'],
      ['현대경제연구원', 'http://www.hri.co.kr'],
      ['대신경제연구소', 'http://www.deri.co.kr'],
      ['LG경제연구원', 'http://www.lgeri.com'],
    ],
  },
  {
    id: 'sites-05',
    label: '진로(직무,직업)정보 찾기 사이트',
    sites: [
      ['한국직업능력개발원 커리어넷', 'http://www.careernet.go.kr'],
      ['한국가이던스', 'http://www.guidance.co.kr'],
      ['KNOW', 'http://know.work.go.kr'],
      ['온라인심리검사', 'http://www.career4u.net'],
      ['잡이룸', 'http://www.joberum.com'],
      ['CJ직무검색', 'http://recruit.cj.net'],
    ],
  },
  {
    id: 'sites-06',
    label: '외국어 & 자격증 정보제공 사이트',
    sites: [
      ['TOEIC', 'http://exam.ybmsisa.com'],
      ['TOFEL', 'http://www.ets.org'],
      ['JPT', 'http://exam.ybmsisa.com/jpt'],
      ['JLPT', 'http://www.jlpt.or.kr'],
      ['대한상공회의소', 'http://license.korcham.net'],
      ['한국산업인력공단', 'http://www.q-net.or.kr'],
      ['한자능력시험', 'http://www.klls.or.kr'],
      ['한자능력시험', 'http://www.hangum.re.kr'],
    ],
  },
  {
    id: 'sites-07',
    label: '자격증 및 교육정보 제공 사이트',
    sites: [
      ['큐넷', 'http://www.q-net.or.kr'],
      ['에듀월', 'http://www.eduwill.net'],
      ['크레듀', 'http://www.credu.com'],
      ['한국능률협회', 'http://www.kma.or.kr'],
      ['배움닷컴', 'http://www.baeoom.com'],
      ['현대인재개발원', 'http://www.hdlc.co.kr'],
      ['HRD-Net', 'http://hrd.go.kr'],
    ],
  },
  {
    id: 'sites-08',
    label: '자기계발(진로설정) 정보 사이트',
    sites: [
      ['크레듀', 'http://www.credu.com'],
      ['삼성미술관', 'http://www.leeum.org'],
      ['휴넷', 'http://www.hunet.co.kr'],
      ['국립현대미술관', 'http://www.moca.go.kr'],
      ['중국어능력 인증시험', 'http://www.hsk.or.kr'],
      ['독일어 능력 인증시험', 'http://www.goethe.de/seoul'],
      ['불어능력 인증시험', 'http://www.afcoree.co.kr'],
      ['요가라이프', 'http://www.yogalife.co.kr'],
      ['워킹홀리데이지원센터', 'http://www.workingholiday.co.kr'],
      ['47Kg(다이어트)', 'http://www.47kg.co.kr'],
      ['국립중앙도서권', 'http://www.nl.go.kr'],
      ['스타일닷컴', 'http://www.style.co.kr'],
      ['한국도서관협회', 'http://www.kla.kr'],
      ['지식콘서트 사람들', 'http://cafe.daum.net/ylv'],
    ],
  },
  {
    id: 'sites-09',
    label: '공사(공기업) 수험정보 및 채용정보제공 사이트',
    sites: [
      ['공공기관 채용정보시스템', 'http://job.alio.go.kr'],
      ['서울고시각', 'http://www.gosigak.co.kr'],
      ['고시넷', 'http://www.gosinet.co.kr'],
    ],
  },
  {
    id: 'sites-10',
    label: '창업관련 정보제공 사이트',
    sites: [
      ['연합창업컨설팅센터', 'http://www.jes2000.com'],
      ['비즈와이드', 'http://www.bizwide.net'],
      ['중소기업청소상공인지원센터', 'http://www.sbdc.or.kr'],
      ['창업센터', 'http://cafe.naver.com/penguin80'],
      ['창업넷', 'http://www.changupnet.go.kr'],
    ],
  },
  {
    id: 'sites-11',
    label: '공모전 정보제공 사이트',
    sites: [
      ['디자인레이스', 'http://www.designrace.com'],
      ['씽유', 'http://www.thinkuniv.com'],
      ['프로디', 'http://cafe.daum.net/design'],
      ['씽굿', 'http://www.thinkcontest.com'],
    ],
  },
  {
    id: 'sites-12',
    label: '각종 아르바이트 및 채용포털 사이트',
    sites: [
      ['알바인', 'http://www.albain.co.kr'],
      ['알바몬', 'http://www.albamon.com'],
      ['아르바이트 천국', 'http://www.alba.co.kr'],
    ],
  },
];

function createStaticLegacyDirectory(categories) {
  return Object.freeze({
    sourceKind: CONTENT_SOURCE_KINDS.STATIC_LEGACY,
    sourceReference: 'jobData/28.html',
    categories: categories.map((category) => Object.freeze({
      id: category.id,
      label: category.label,
      sourceKind: CONTENT_SOURCE_KINDS.STATIC_LEGACY,
      sites: category.sites.map(([name, href], index) => Object.freeze({
        id: `${category.id}-${index + 1}`,
        name,
        href,
        sourceKind: CONTENT_SOURCE_KINDS.STATIC_LEGACY,
      })),
    })),
  });
}

export const legacyJobSiteDirectory = createStaticLegacyDirectory(rawLegacyJobSiteCategories);

const rawLegacyExpertLectureCategories = [
  {
    id: 'expert-lecture-01',
    label: '기업분석 완전정복',
    lectures: [
      ['기업분석 1강', 'https://youtu.be/kpDTVPi6pa4'],
      ['기업분석 2강', 'https://youtu.be/CSxSSvwXNdA'],
    ],
  },
  {
    id: 'expert-lecture-02',
    label: '스토리텔링 자소서',
    lectures: [
      ['스토리텔링자소서 1강', 'https://youtu.be/1jH37oC5_lo'],
      ['스토리텔링자소서 2강', 'https://youtu.be/w6r-brxC5K0'],
    ],
  },
  {
    id: 'expert-lecture-03',
    label: '쉬운 자소서 작성법',
    lectures: [
      ['복붙 자소서 1강', 'https://youtu.be/xAtV-PadNa0'],
      ['복붙 자소서 2강', 'https://youtu.be/oDjzoBUZT-E'],
      ['복붙 자소서 3강', 'https://youtu.be/a1t9tGZsBXY'],
      ['복붙 자소서 4강', 'https://youtu.be/y7Or2DeG0Gk'],
      ['복붙 자소서 5강', 'https://youtu.be/lB0mX6QJ11g'],
    ],
  },
  {
    id: 'expert-lecture-04',
    label: '자소서 기본항목 작성',
    lectures: [
      ['성장과정', 'https://youtu.be/dWhgina9hyQ'],
      ['지원동기', 'https://youtu.be/8CG2IafnBTA'],
      ['학창시절경험', 'https://youtu.be/y1E6VnS8HUQ'],
      ['성격의 장단점', 'https://youtu.be/e-qZHGy4RBQ'],
      ['입사 후 포부', 'https://youtu.be/0f-nVs1jxCI'],
      ['창의적 경험', 'https://youtu.be/KPUBmeHehmU'],
    ],
  },
  {
    id: 'expert-lecture-05',
    label: '1분 Speech 핵심 노하우 강의',
    lectures: [
      ['1분 Speech 1강', 'https://youtu.be/fPyDrPP8Jzo'],
      ['1분 Speech 2강', 'https://youtu.be/Peu_cKnv1m0'],
      ['직무중심 1분 Speech', 'https://youtu.be/tbMPcaiM69E'],
    ],
  },
  {
    id: 'expert-lecture-06',
    label: '인성 면접 완벽 준비',
    lectures: [
      ['인성면접 1강', 'https://youtu.be/VFU58RJ_np8'],
      ['인성면접 2강', 'https://youtu.be/uvGWMa6qChY'],
      ['인성면접 3강', 'https://youtu.be/VJbSCoFZrRk'],
    ],
  },
  {
    id: 'expert-lecture-07',
    label: '역량 면접 핵심',
    lectures: [
      ['역량면접/구조화면접', 'https://youtu.be/vvoM3eRnbGU'],
    ],
  },
];

export const legacyExpertLectureLibrary = Object.freeze({
  sourceKind: CONTENT_SOURCE_KINDS.STATIC_LEGACY,
  sourceReference: 'inc_html/ndesign_section2.html',
  categories: rawLegacyExpertLectureCategories.map((category) => Object.freeze({
    id: category.id,
    label: category.label,
    sourceKind: CONTENT_SOURCE_KINDS.STATIC_LEGACY,
    lectures: category.lectures.map(([title, href], index) => Object.freeze({
      id: `${category.id}-${index + 1}`,
      title,
      href,
      categoryId: category.id,
      categoryLabel: category.label,
      sourceKind: CONTENT_SOURCE_KINDS.STATIC_LEGACY,
    })),
  })),
});
