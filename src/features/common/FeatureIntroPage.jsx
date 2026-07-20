import './page.css';

export function FeatureIntroPage({ action, bullets = [], description, eyebrow, title }) {
  return (
    <main className="intro-page">
      <article className="intro-card">
        {eyebrow && <p className="intro-eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="intro-description">{description}</p>}
        {bullets.length > 0 && (
          <ul className="intro-bullets">
            {bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
          </ul>
        )}
        {action && <div className="intro-action">{action}</div>}
      </article>
    </main>
  );
}
