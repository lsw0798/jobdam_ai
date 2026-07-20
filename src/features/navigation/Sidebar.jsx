import { useId, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { menuSections } from './menuCatalog';
import './navigation.css';

function getStatus(item, progress) {
  if (item.kind === 'comingSoon') {
    return { label: '준비 중', type: 'coming-soon' };
  }

  if (!item.progressKey) {
    return null;
  }

  return progress?.[item.progressKey]?.completed
    ? { label: '입력 완료', type: 'complete' }
    : { label: '미작성', type: 'incomplete' };
}

function SidebarItem({ item, progress }) {
  const [isTooltipVisible, setTooltipVisible] = useState(false);
  const tooltipId = useId();
  const status = getStatus(item, progress);
  const hasTooltip = Boolean(item.tooltip?.trim());

  return (
    <li className="sidebar-item">
      <NavLink
        aria-describedby={hasTooltip && isTooltipVisible ? tooltipId : undefined}
        className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}${status ? ` is-${status.type}` : ''}`}
        onBlur={hasTooltip ? () => setTooltipVisible(false) : undefined}
        onFocus={hasTooltip ? () => setTooltipVisible(true) : undefined}
        onMouseEnter={hasTooltip ? () => setTooltipVisible(true) : undefined}
        onMouseLeave={hasTooltip ? () => setTooltipVisible(false) : undefined}
        to={item.route}
      >
        <span>{item.label}</span>
        {status && <span className="sidebar-status">{status.label}</span>}
      </NavLink>
      {hasTooltip && isTooltipVisible && (
        <span className="sidebar-tooltip" id={tooltipId} role="tooltip">
          {item.tooltip}
        </span>
      )}
    </li>
  );
}

export function Sidebar({ isCollapsed = false, onToggle = () => {}, progress }) {
  return (
    <aside
      className={`sidebar${isCollapsed ? ' is-collapsed' : ''}`}
      aria-label="취업 솔루션 메뉴"
    >
      <button
        aria-controls="primary-sidebar-navigation"
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
        className="sidebar-toggle"
        onClick={onToggle}
        type="button"
      >
        <span aria-hidden="true">☰</span>
      </button>
      <div className="sidebar-brand" hidden={isCollapsed}>
        <span className="sidebar-brand-label">잡담</span>
        <strong>AI 취업 솔루션</strong>
      </div>
      <nav aria-label="주요 메뉴" hidden={isCollapsed} id="primary-sidebar-navigation">
        {menuSections.map((section) => (
          <section className="sidebar-section" key={section.id}>
            <h2>{section.title}</h2>
            <ul>
              {section.items.map((item) => (
                <SidebarItem item={item} key={item.id} progress={progress} />
              ))}
            </ul>
          </section>
        ))}
      </nav>
    </aside>
  );
}
