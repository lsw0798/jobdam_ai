import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { AuthProvider } from '../features/auth/AuthProvider';
import { AUTH_STORAGE_KEYS } from '../features/auth/authService';
import { AppRouter } from './AppRouter';

afterEach(() => {
  window.localStorage.clear();
});

function renderRoute(initialPath) {
  return render(
    <AuthProvider>
      <AppRouter initialPath={initialPath} />
    </AuthProvider>,
  );
}

const DEMO_USER = Object.freeze({
  id: 'mock-user',
  name: '홍길동',
  email: 'hong@example.com',
});

const DEVELOPER_UI_PATTERN = /DB|목업|localStorage|레거시|contract|fixture/i;

function expectCustomerFacingCopy() {
  expect(screen.queryAllByText(DEVELOPER_UI_PATTERN)).toHaveLength(0);
}

function restoreDemoSession() {
  window.localStorage.setItem(AUTH_STORAGE_KEYS.users, JSON.stringify([
    { ...DEMO_USER, password: 'password8' },
  ]));
  window.localStorage.setItem(AUTH_STORAGE_KEYS.session, JSON.stringify(DEMO_USER));
}

describe('protected application routes', () => {
  it('sends an unauthenticated visitor to login', () => {
    renderRoute('/experience');

    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });

  it('renders the app shell and requested page for a stored session', () => {
    restoreDemoSession();

    renderRoute('/experience');

    expect(screen.getByLabelText('취업 솔루션 메뉴')).toBeInTheDocument();
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '취업 성공자의 필수 코스 경험리스트' })).toBeInTheDocument();
  });

  it('moves the career-decision content to its own route and leaves career analysis empty', () => {
    restoreDemoSession();

    const decisionRoute = renderRoute('/career-decision');
    expect(screen.getByRole('heading', { name: '진로·직무결정 고민 한번에 해결' })).toBeInTheDocument();
    decisionRoute.unmount();

    renderRoute('/career-analysis');
    expect(screen.getByLabelText('AI로 직무·산업·기업 분석하기')).toBeEmptyDOMElement();
  });

  it('renders the four fixed legacy experience sections at the editor route', () => {
    restoreDemoSession();

    renderRoute('/experience/write');

    expect(screen.getByRole('heading', { name: /경험.*리스트.*작성/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '수상·자격증' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '직무·전공 활동' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '대내·외 활동' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '기타' })).toBeInTheDocument();
  });

  it('returns to login after logout from a protected page', async () => {
    restoreDemoSession();
    const user = userEvent.setup();

    renderRoute('/experience');
    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });

  it('renders the AI cover-letter workflow without developer notices', () => {
    restoreDemoSession();

    renderRoute('/cover-letters/library');

    expect(screen.getByRole('heading', { name: /AI.*자소서/ })).toBeInTheDocument();
    expectCustomerFacingCopy();
  });

  it('renders item intent as reference content without developer notices', () => {
    restoreDemoSession();

    renderRoute('/success-examples/workspace');

    expect(screen.getByRole('heading', { name: /직무별 합격사례/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '직무 그룹 선택' })).toBeInTheDocument();
    expectCustomerFacingCopy();
  });

  it('renders the staged interview workflow without a fixed STAR editor', () => {
    restoreDemoSession();

    renderRoute('/interview-examples/workspace');

    expect(screen.getByRole('heading', { name: /면접.*답변/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '기본정보' })).toBeInTheDocument();
    expect(screen.queryByText('STAR 기반 면접 답변 작성')).not.toBeInTheDocument();
    expectCustomerFacingCopy();
  });

  it('renders all three career-information channels without developer notices', () => {
    restoreDemoSession();

    renderRoute('/career-information/library');

    expect(screen.getByRole('tab', { name: '모든취업사이트' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '진로취업동영상' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '인사전문가 강의' })).toBeInTheDocument();
    expectCustomerFacingCopy();
  });
});
