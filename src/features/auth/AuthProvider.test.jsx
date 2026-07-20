import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { signUp } from './authService';
import { useAuth } from './useAuth';

afterEach(() => {
  window.localStorage.clear();
});

function AuthProbe() {
  const { signOut, user } = useAuth();

  return (
    <>
      <output>{user?.name ?? 'guest'}</output>
      <button onClick={signOut} type="button">로그아웃</button>
    </>
  );
}

describe('AuthProvider', () => {
  it('exposes a logout action that clears session state', async () => {
    signUp({
      name: '홍길동',
      email: 'hong@example.com',
      password: 'password8',
      confirmPassword: 'password8',
    });
    const user = userEvent.setup();

    render(<AuthProvider><AuthProbe /></AuthProvider>);

    expect(screen.getByText('홍길동')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '로그아웃' }));
    expect(screen.getByText('guest')).toBeInTheDocument();
  });
});
