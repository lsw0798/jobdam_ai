import { Link } from 'react-router-dom';
import { PAGE_DESCRIPTIONS } from '../../routing/pageDescriptions';
import { ROUTES } from '../../routing/routes';
import { FeatureIntroPage } from '../common/FeatureIntroPage';

export function InterviewExamplesPage() {
  return (
    <FeatureIntroPage
      action={<Link className="primary-action" to={ROUTES.interviewWorkspace}>면접답변 직접 작성하기</Link>}
      description={PAGE_DESCRIPTIONS.interviewExamples}
      eyebrow="INTERVIEW PRACTICE"
      title="직무별 합격사례보고 면접답변 직접 작성하기"
    />
  );
}
