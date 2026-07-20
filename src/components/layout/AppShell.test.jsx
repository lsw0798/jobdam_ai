import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('keeps navigation, signed-in user controls, and page content in one layout', () => {
    const onLogout = vi.fn();

    render(
      <MemoryRouter>
        <AppShell
          onLogout={onLogout}
          progress={{ experience: { completed: true } }}
          user={{ name: '홍길동' }}
        >
          <h1>테스트 화면</h1>
        </AppShell>
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('취업 솔루션 메뉴')).toBeInTheDocument();
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '테스트 화면' })).toBeInTheDocument();
  });

  it('첫 키보드 이동에서 본문 건너뛰기를 제공하고 본문에 초점을 옮긴다', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AppShell progress={{}}>
          <h1>본문 화면</h1>
        </AppShell>
      </MemoryRouter>,
    );

    await user.tab();
    const skipLink = screen.getByRole('link', { name: '본문으로 건너뛰기' });
    expect(skipLink).toHaveFocus();

    await user.click(skipLink);
    expect(document.querySelector('.app-page-content')).toHaveFocus();
  });

  it('왼쪽 위 삼선 버튼으로 사이드바를 접고 본문 배치 상태를 함께 바꾼다', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AppShell progress={{}}>
          <h1>본문 화면</h1>
        </AppShell>
      </MemoryRouter>,
    );

    const toggleButton = screen.getByRole('button', { name: '사이드바 접기' });
    const sidebar = screen.getByLabelText('취업 솔루션 메뉴');
    const navigation = screen.getByRole('navigation', { name: '주요 메뉴' });

    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(sidebar).not.toHaveClass('is-collapsed');
    expect(navigation).not.toHaveAttribute('hidden');

    await user.click(toggleButton);

    expect(screen.getByRole('button', { name: '사이드바 펼치기' })).toHaveAttribute('aria-expanded', 'false');
    expect(sidebar).toHaveClass('is-collapsed');
    expect(navigation).toHaveAttribute('hidden');
    expect(document.querySelector('.app-shell')).toHaveClass('is-sidebar-collapsed');
  });
});
