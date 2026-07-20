import { PAGE_DESCRIPTIONS } from '../../routing/pageDescriptions';
import { ExternalLink } from '../common/ExternalLink';
import { FeatureIntroPage } from '../common/FeatureIntroPage';

const CAREER_DECISION_URL = 'https://chatgpt.com/g/g-69726feb34888191863db9e65f238c80-jagibunseog-prediger-v6-0-jinro-cwieob';

export function CareerDecisionPage() {
  return (
    <FeatureIntroPage
      action={<ExternalLink className="primary-action" href={CAREER_DECISION_URL}>AI로 나의 진로 결정하기</ExternalLink>}
      description={PAGE_DESCRIPTIONS.careerDecision}
      eyebrow="CAREER EXPLORATION"
      title="진로·직무결정 고민 한번에 해결"
    />
  );
}
