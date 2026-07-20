import { Link } from 'react-router-dom';
import { PAGE_DESCRIPTIONS } from '../../routing/pageDescriptions';
import { progressItems } from '../navigation/menuCatalog';
import './dashboard.css';

function FeatureCard({ item }) {
  return (
    <li>
      <Link className="feature-card" to={item.route}>
        <span>{item.label}</span>
        <span aria-hidden="true">→</span>
      </Link>
    </li>
  );
}

function FeatureGroup({ items, title }) {
  return (
    <section aria-label={title} className="dashboard-group">
      <div className="dashboard-group-heading">
        <h2>{title}</h2>
        <span>{items.length}개</span>
      </div>
      {items.length > 0 ? (
        <ul className="feature-card-list">
          {items.map((item) => <FeatureCard item={item} key={item.id} />)}
        </ul>
      ) : (
        <p className="empty-message">아직 해당 기능이 없습니다.</p>
      )}
    </section>
  );
}

export function DashboardPage({ progress = {} }) {
  const usedFeatures = progressItems.filter((item) => progress[item.progressKey]?.completed);
  const unusedFeatures = progressItems.filter((item) => !progress[item.progressKey]?.completed);

  return (
    <main className="dashboard-page">
      <header className="dashboard-hero">
        <p className="eyebrow">JOBDAM CAREER FLOW</p>
        <h1>대시보드</h1>
        <p>{PAGE_DESCRIPTIONS.dashboard}</p>
      </header>
      <FeatureGroup items={usedFeatures} title="사용한 기능" />
      <FeatureGroup items={unusedFeatures} title="아직 활용하지 못한 기능" />
    </main>
  );
}
