import { useRef, useState } from 'react';
import { Sidebar } from '../../features/navigation/Sidebar';
import './appShell.css';

export function AppShell({ children, onLogout, progress, user }) {
  const pageContentRef = useRef(null);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(
    () => globalThis.matchMedia?.('(max-width: 900px)').matches ?? false,
  );

  function handleSkipToContent(event) {
    event.preventDefault();
    pageContentRef.current?.focus();
  }

  return (
    <div className={`app-shell${isSidebarCollapsed ? ' is-sidebar-collapsed' : ''}`}>
      <a className="skip-to-content" href="#app-page-content" onClick={handleSkipToContent}>
        본문으로 건너뛰기
      </a>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setSidebarCollapsed((isCollapsed) => !isCollapsed)}
        progress={progress}
      />
      <div className="app-content">
        <header className="app-header">
          <div>
            <p className="app-header-label">JOBDAM CAREER SOLUTION</p>
            <strong>잡담 AI 취업 솔루션</strong>
          </div>
          {user && (
            <div className="user-actions">
              <span>{user.name}</span>
              <button onClick={onLogout} type="button">로그아웃</button>
            </div>
          )}
        </header>
        <div
          className="app-page-content"
          id="app-page-content"
          ref={pageContentRef}
          tabIndex={-1}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
