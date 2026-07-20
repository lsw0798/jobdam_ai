import { useParams } from 'react-router-dom';
import { PAGE_DESCRIPTIONS } from '../../routing/pageDescriptions';
import { FeatureIntroPage } from './FeatureIntroPage';

const COMING_SOON_PAGES = Object.freeze({
  'ai-interview': {
    description: PAGE_DESCRIPTIONS.aiInterview,
    name: 'AI로 면접 답변 작성하기',
  },
  'pt-interview': {
    description: PAGE_DESCRIPTIONS.ptInterview,
    name: 'AI로 PT 면접 준비하기',
  },
  'public-interview-notes': {
    description: PAGE_DESCRIPTIONS.publicInterviewNotes,
    name: '공기업 면접 노트',
  },
});

export function ComingSoonPage({ description, featureName }) {
  const { featureId } = useParams();
  const page = COMING_SOON_PAGES[featureId];
  const resolvedName = featureName ?? page?.name ?? '이 기능';

  return (
    <FeatureIntroPage
      description={description ?? page?.description}
      eyebrow="COMING SOON"
      title={`${resolvedName} 준비 중`}
    />
  );
}
