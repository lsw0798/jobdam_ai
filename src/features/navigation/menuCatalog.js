import { ROUTES } from '../../routing/routes';
import { PAGE_DESCRIPTIONS } from '../../routing/pageDescriptions';

export const menuSections = [
  {
    id: 'foundation',
    title: '기초공사 / 진로 / 직무·산업·기업 분석',
    items: [
      {
        id: 'dashboard',
        label: '대시보드',
        route: ROUTES.dashboard,
        tooltip: PAGE_DESCRIPTIONS.dashboard,
      },
      {
        id: 'experience',
        label: '경험 리스트 작성',
        route: ROUTES.experience,
        progressKey: 'experience',
        tooltip: PAGE_DESCRIPTIONS.experience,
      },
      {
        id: 'career-decision',
        label: 'AI로 나의 진로 결정하기',
        route: ROUTES.careerDecision,
        tooltip: PAGE_DESCRIPTIONS.careerDecision,
      },
      {
        id: 'career-analysis',
        label: 'AI로 직무·산업·기업 분석하기',
        route: ROUTES.careerAnalysis,
        tooltip: PAGE_DESCRIPTIONS.careerAnalysis,
      },
    ],
  },
  {
    id: 'resume-cover-letter',
    title: '이력서 / 자기소개서',
    items: [
      {
        id: 'resume',
        label: '이력서 작성하기',
        route: ROUTES.resume,
        progressKey: 'resume',
        tooltip: PAGE_DESCRIPTIONS.resume,
      },
      {
        id: 'cover-letters',
        label: 'AI로 나만의 자소서 작성',
        route: ROUTES.coverLetters,
        progressKey: 'coverLetterLibrary',
        tooltip: PAGE_DESCRIPTIONS.coverLetters,
      },
      {
        id: 'success-examples',
        label: '항목의도 및 직무별 합격사례 보고 직접 작성하기',
        route: ROUTES.successExamples,
        progressKey: 'successExamples',
        tooltip: PAGE_DESCRIPTIONS.successExamples,
      },
    ],
  },
  {
    id: 'interview',
    title: '면접 준비',
    items: [
      {
        id: 'speech',
        label: 'AI로 1분 스피치 만들기',
        route: ROUTES.speech,
        tooltip: PAGE_DESCRIPTIONS.speech,
      },
      {
        id: 'ai-interview',
        label: 'AI로 면접 답변 작성하기',
        route: '/coming-soon/ai-interview',
        kind: 'comingSoon',
        tooltip: PAGE_DESCRIPTIONS.aiInterview,
      },
      {
        id: 'interview-examples',
        label: '직무별 합격사례보고 면접답변 직접 작성하기',
        route: ROUTES.interviewExamples,
        progressKey: 'interviewExamples',
        tooltip: PAGE_DESCRIPTIONS.interviewExamples,
      },
      {
        id: 'pt-interview',
        label: 'AI로 PT 면접 준비하기',
        route: '/coming-soon/pt-interview',
        kind: 'comingSoon',
        tooltip: PAGE_DESCRIPTIONS.ptInterview,
      },
      {
        id: 'public-interview-notes',
        label: '공기업 면접 노트',
        route: '/coming-soon/public-interview-notes',
        kind: 'comingSoon',
        tooltip: PAGE_DESCRIPTIONS.publicInterviewNotes,
      },
    ],
  },
  {
    id: 'career-information',
    title: '진로·취업 정보',
    items: [
      {
        id: 'career-information',
        label: '모든 취업 진로 정보가 여기에',
        route: ROUTES.careerInformation,
        tooltip: PAGE_DESCRIPTIONS.careerInformation,
      },
    ],
  },
];

export const progressItems = menuSections
  .flatMap((section) => section.items)
  .filter((item) => item.progressKey);
