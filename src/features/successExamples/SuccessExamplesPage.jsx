import { Link } from 'react-router-dom';
import { PAGE_DESCRIPTIONS } from '../../routing/pageDescriptions';
import { ROUTES } from '../../routing/routes';
import { FeatureIntroPage } from '../common/FeatureIntroPage';

export function SuccessExamplesPage() {
  return (
    <FeatureIntroPage
      action={<Link className="primary-action" to={ROUTES.successExamplesWorkspace}>합격사례 기반으로 작성하기</Link>}
      description={PAGE_DESCRIPTIONS.successExamples}
      eyebrow="JOB-SPECIFIC COVER LETTER"
      title="나만의 사례로 차별화된 자기소개서 작성"
    />
  );
}
