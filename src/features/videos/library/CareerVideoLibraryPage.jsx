import { useEffect, useMemo, useState } from 'react';
import './CareerVideoLibraryPage.css';
import {
  legacyExpertLectureLibrary,
  legacyJobSiteDirectory,
} from './careerContentData';
import {
  CAREER_VIDEO_CATEGORIES,
  createUnavailableCareerVideoService,
} from './careerVideoService';

const contentTabs = [
  { id: 'sites', label: '모든취업사이트' },
  { id: 'videos', label: '진로취업동영상' },
  { id: 'lectures', label: '인사전문가 강의' },
];

function JobSitesPanel() {
  return (
    <section aria-labelledby="career-content-tab-sites" className="career-video-library__panel" id="career-content-panel-sites" role="tabpanel">
      <div className="career-video-library__panel-heading">
        <div>
          <p className="career-video-library__source">static-legacy · jobData/28.html</p>
          <h2>모든취업사이트</h2>
        </div>
        <p>레거시 정적 원본의 12분류 · 사이트 링크 103개</p>
      </div>

      <nav aria-label="취업사이트 분류 바로가기" className="career-video-library__anchor-nav">
        {legacyJobSiteDirectory.categories.map((category) => (
          <a aria-label={`${category.label} 바로가기`} href={`#${category.id}`} key={category.id}>{category.label}</a>
        ))}
      </nav>

      <div className="career-video-library__site-sections">
        {legacyJobSiteDirectory.categories.map((category) => (
          <section className="career-video-library__site-section" id={category.id} key={category.id}>
            <div className="career-video-library__section-heading">
              <h3>{category.label}</h3>
              <p>{category.sites.length}개 사이트</p>
            </div>
            <ul aria-label={`${category.label} 목록`} className="career-video-library__site-list">
              {category.sites.map((site) => (
                <li key={site.id}>
                  <a aria-label={`${site.name} 새 창에서 열기`} href={site.href} rel="noopener noreferrer" target="_blank">
                    <span>{site.name}</span>
                    <small>{site.href}</small>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}

function CareerVideosPanel({ service }) {
  const [categoryId, setCategoryId] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    service.searchVideos({ categoryId, page, query }).then((nextResult) => {
      if (active) setResult(nextResult);
    });
    return () => {
      active = false;
    };
  }, [categoryId, page, query, service]);

  function chooseCategory(nextCategoryId) {
    setCategoryId(nextCategoryId);
    setPage(1);
  }

  return (
    <section aria-labelledby="career-content-tab-videos" className="career-video-library__panel" id="career-content-panel-videos" role="tabpanel">
      <div className="career-video-library__panel-heading">
        <div>
          <p className="career-video-library__source">db-unavailable · bbs_press</p>
          <h2>진로취업동영상</h2>
        </div>
        <p>분류·검색·5건 페이징·상세·조회수 계약</p>
      </div>

      <label className="career-video-library__search">
        동영상 검색
        <input aria-label="동영상 검색" onChange={(event) => { setQuery(event.target.value); setPage(1); }} type="search" value={query} />
      </label>
      <div aria-label="동영상 분류" className="career-video-library__filter-controls">
        {CAREER_VIDEO_CATEGORIES.map((category) => (
          <button
            aria-pressed={categoryId === category.id}
            className="career-video-library__filter-button"
            key={category.id}
            onClick={() => chooseCategory(category.id)}
            type="button"
          >
            {category.label}
          </button>
        ))}
      </div>

      {!result && <p className="career-video-library__empty-state">동영상 계약을 확인하고 있습니다.</p>}
      {result?.notice && <p className="career-video-library__empty-state" role="status">{result.notice}</p>}
      {result?.items.length > 0 && (
        <ul className="career-video-library__list">
          {result.items.map((video) => (
            <li key={video.cd}>
              <article className="career-video-library__card">
                <p className="career-video-library__category">{CAREER_VIDEO_CATEGORIES.find(({ id }) => id === video.grp)?.label ?? video.grp}</p>
                <h3>{video.subject}</h3>
                <p>{video.contentsSummary}</p>
                <p>조회 {video.hit} · {video.registrationDate}</p>
                <code>{video.cd}</code>
              </article>
            </li>
          ))}
        </ul>
      )}
      {result && result.totalPages > 0 && (
        <div className="career-video-library__pagination">
          <button disabled={page <= 1} onClick={() => setPage((current) => current - 1)} type="button">이전 페이지</button>
          <span>{page} / {result.totalPages}</span>
          <button disabled={page >= result.totalPages} onClick={() => setPage((current) => current + 1)} type="button">다음 페이지</button>
        </div>
      )}
    </section>
  );
}

function ExpertLecturesPanel() {
  const lectureCount = legacyExpertLectureLibrary.categories.reduce(
    (count, category) => count + category.lectures.length,
    0,
  );

  return (
    <section aria-labelledby="career-content-tab-lectures" className="career-video-library__panel" id="career-content-panel-lectures" role="tabpanel">
      <div className="career-video-library__panel-heading">
        <div>
          <p className="career-video-library__source">static-legacy · inc_html/ndesign_section2.html</p>
          <h2>인사전문가 강의</h2>
        </div>
        <p>{legacyExpertLectureLibrary.categories.length}개 분류 · 실제 YouTube 강의 {lectureCount}개</p>
      </div>
      <div className="career-video-library__lecture-sections">
        {legacyExpertLectureLibrary.categories.map((category) => (
          <section className="career-video-library__lecture-section" key={category.id}>
            <h3>{category.label}</h3>
            <ul className="career-video-library__lecture-list">
              {category.lectures.map((lecture) => (
                <li key={lecture.id}>
                  <a aria-label={`${lecture.title} 새 창에서 열기`} href={lecture.href} rel="noopener noreferrer" target="_blank">
                    {lecture.title}<span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}

export function CareerVideoLibraryPage({ videoService }) {
  const [activeTab, setActiveTab] = useState('sites');
  const resolvedVideoService = useMemo(
    () => videoService ?? createUnavailableCareerVideoService(),
    [videoService],
  );

  return (
    <main className="career-video-library">
      <header className="career-video-library__header">
        <p className="career-video-library__eyebrow">JOBDAM LEGACY CONTENT</p>
        <h1>모든 취업 진로 정보가 여기에</h1>
        <p>취업사이트, DB 기반 진로취업동영상, 인사전문가 강의를 콘텐츠 원본별로 구분했습니다.</p>
      </header>

      <div aria-label="취업·진로 콘텐츠 유형" className="career-video-library__tabs" role="tablist">
        {contentTabs.map((tab) => (
          <button
            aria-controls={`career-content-panel-${tab.id}`}
            aria-selected={activeTab === tab.id}
            id={`career-content-tab-${tab.id}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            tabIndex={activeTab === tab.id ? 0 : -1}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'sites' && <JobSitesPanel />}
      {activeTab === 'videos' && <CareerVideosPanel service={resolvedVideoService} />}
      {activeTab === 'lectures' && <ExpertLecturesPanel />}
    </main>
  );
}