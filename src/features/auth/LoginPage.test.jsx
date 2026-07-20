import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import { LoginPage } from './LoginPage';
import { signOut, signUp } from './authService';

afterEach(() => {
  window.localStorage.clear();
});

describe('LoginPage', () => {
  it('signs an existing demo user in and navigates to the dashboard', async () => {
    signUp({
      name: '홍길동',
      email: 'hong@example.com',
      password: 'password8',
      confirmPassword: 'password8',
    });
    signOut();
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<h1>대시보드</h1>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('이메일'), 'hong@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password8');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(await screen.findByRole('heading', { name: '대시보드' })).toBeInTheDocument();
  });
});
