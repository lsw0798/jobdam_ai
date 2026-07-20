import { Link } from 'react-router-dom';
import { PAGE_DESCRIPTIONS } from '../../routing/pageDescriptions';
import { ROUTES } from '../../routing/routes';
import { FeatureIntroPage } from '../common/FeatureIntroPage';

export function CareerInformationPage() {
  return (
    <FeatureIntroPage
      action={<Link className="primary-action" to={ROUTES.careerInformationLibrary}>전문가 동영상 특강 보기</Link>}
      description={PAGE_DESCRIPTIONS.careerInformation}
      eyebrow="CAREER LEARNING"
      title="진로·취업 전문가 동영상 특강"
    />
  );
}
