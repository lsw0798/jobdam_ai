import { Link } from 'react-router-dom';
import { PAGE_DESCRIPTIONS } from '../../routing/pageDescriptions';
import { FeatureIntroPage } from '../common/FeatureIntroPage';

export function ExperiencePage() {
  return (
    <FeatureIntroPage
      action={<Link className="primary-action" to="/experience/write">경험 리스트 작성하기</Link>}
      bullets={[
        '취업 상담 시 경험리스트 분석을 통한 취업 전략 수립',
        "자기소개서 작성 시 활용(경험리스트에 작성한 ‘활동내용, 역량’을 ‘AI로 자소서 작성’에 활용)",
        "면접질문 준비 시 활용(경험리스트에 작성한 ‘활동내용, 역량’을 ‘AI로 면접답변 준비하기’에 활용)",
      ]}
      description={PAGE_DESCRIPTIONS.experience}
      eyebrow="EXPERIENCE FOUNDATION"
      title="취업 성공자의 필수 코스 경험리스트"
    />
  );
}
