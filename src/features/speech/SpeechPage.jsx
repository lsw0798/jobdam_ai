import { PAGE_DESCRIPTIONS } from '../../routing/pageDescriptions';
import { ExternalLink } from '../common/ExternalLink';
import { FeatureIntroPage } from '../common/FeatureIntroPage';

const SPEECH_URL = 'https://m.site.naver.com/22Zv1';

export function SpeechPage() {
  return (
    <FeatureIntroPage
      action={<ExternalLink className="primary-action" href={SPEECH_URL}>AI로 1분 스피치 만들기 시작</ExternalLink>}
      bullets={[
        '지원 직무와 연결되는 핵심 경험을 먼저 선택하세요.',
        '성과와 배운 점을 중심으로 60초 안에 전달할 메시지를 정리하세요.',
        '완성한 내용은 실제 면접 전에 소리 내어 연습해 보세요.',
      ]}
      description={PAGE_DESCRIPTIONS.speech}
      eyebrow="ONE-MINUTE PITCH"
      title="AI로 1분 스피치 만들기"
    />
  );
}
