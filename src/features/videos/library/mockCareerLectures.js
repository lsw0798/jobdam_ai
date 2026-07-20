export const careerVideoCategories = [
  { id: 'all', label: '전체' },
  { id: 'job-search', label: '면접·취업' },
  { id: 'career-exploration', label: '진로 탐색' },
  { id: 'workplace-skills', label: '직장 생활' },
];

export const mockCareerLectures = [
  {
    id: 'interview-strengths',
    categoryId: 'job-search',
    categoryLabel: '면접·취업',
    title: '면접에서 나의 강점 전달하기',
    summary: '짧고 분명하게 경험과 강점을 연결하는 면접 답변의 기본을 살펴봅니다.',
    duration: '12분',
    href: 'https://example.com/jobdam-ai-demo/lectures/interview-strengths',
  },
  {
    id: 'career-map',
    categoryId: 'career-exploration',
    categoryLabel: '진로 탐색',
    title: '관심 직무를 찾는 커리어 지도',
    summary: '나의 관심사와 역량을 직무 탐색의 출발점으로 정리하는 방법을 소개합니다.',
    duration: '10분',
    href: 'https://example.com/jobdam-ai-demo/lectures/career-map',
  },
  {
    id: 'workplace-communication',
    categoryId: 'workplace-skills',
    categoryLabel: '직장 생활',
    title: '신입을 위한 직장 커뮤니케이션',
    summary: '업무 요청과 진행 상황을 동료에게 명확하게 전달하는 기본 원칙을 알아봅니다.',
    duration: '9분',
    href: 'https://example.com/jobdam-ai-demo/lectures/workplace-communication',
  },
];
