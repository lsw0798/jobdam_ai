import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import { SignupPage } from './SignupPage';

afterEach(() => {
  window.localStorage.clear();
});

function renderSignupPage() {
  render(
    <MemoryRouter initialEntries={['/signup']}>
      <AuthProvider>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<h1>대시보드</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('SignupPage', () => {
  it('signs up a valid user and navigates to the dashboard', async () => {
    const user = userEvent.setup();
    renderSignupPage();

    await user.type(screen.getByLabelText('이름'), '홍길동');
    await user.type(screen.getByLabelText('이메일'), 'hong@example.com');
    await user.type(screen.getByLabelText('비밀번호', { exact: true }), 'password8');
    await user.type(screen.getByLabelText('비밀번호 확인'), 'password8');
    await user.click(screen.getByRole('button', { name: '회원가입' }));

    expect(await screen.findByRole('heading', { name: '대시보드' })).toBeInTheDocument();
  });

  it('shows inline validation feedback without creating a session', async () => {
    const user = userEvent.setup();
    renderSignupPage();

    await user.click(screen.getByRole('button', { name: '회원가입' }));

    expect(screen.getByRole('alert')).toHaveTextContent('이름을 입력해 주세요.');
    expect(window.localStorage.getItem('jobdam-ai.auth.session')).toBeNull();
  });
});
