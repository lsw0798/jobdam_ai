import { Link } from 'react-router-dom';
import { PAGE_DESCRIPTIONS } from '../../routing/pageDescriptions';
import { ROUTES } from '../../routing/routes';
import './coverLetterHub.css';

export function CoverLetterHubPage() {
  return (
    <main className="cover-letter-intro-page">
      <article className="cover-letter-intro-card">
        <p className="cover-letter-intro-eyebrow">AI CORPORATE COVER LETTER</p>
        <h1>AI 기업·직무 맞춤 자소서</h1>
        <p>{PAGE_DESCRIPTIONS.coverLetters}</p>
        <nav aria-label="AI 자소서 시작 선택" className="cover-letter-actions">
          <Link className="cover-letter-action" to={ROUTES.coverLetterLibrary}>새로 작성하기</Link>
          <Link className="cover-letter-action" to={`${ROUTES.coverLetterLibrary}?view=history`}>
            지난 작성내용 불러오기
          </Link>
        </nav>
      </article>
    </main>
  );
}
