import { ExternalLink } from '../common/ExternalLink';
import { FeatureIntroPage } from '../common/FeatureIntroPage';

const OTHER_ITEM_URL = 'https://m.site.naver.com/24l2E';

export function OtherItemGuidePage() {
  return (
    <FeatureIntroPage
      action={<ExternalLink className="primary-action" href={OTHER_ITEM_URL}>AI로 기타 항목 작성하기</ExternalLink>}
      description="기타 모든 항목 작성하기에서는 원하는 주제(역량) 키워드와 글자수를 입력하고 내용을 간략히 입력하면 핵심결론(성과포함)과 STAR 기반 사례로 구조화하여 작성해 줍니다."
      eyebrow="STRUCTURED WRITING"
      title="AI로 인사담당자가 원하는 구조화된 내용 작성"
    />
  );
}
