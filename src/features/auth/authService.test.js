import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_STORAGE_KEYS,
  getCurrentSession,
  signIn,
  signOut,
  signUp,
  validateSignInInput,
  validateSignupInput,
} from './authService';

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('authService', () => {
  it('creates a session and persists a new user after a valid signup', () => {
    const result = signUp({
      name: '홍길동',
      email: 'hong@example.com',
      password: 'password8',
      confirmPassword: 'password8',
    });

    expect(result.success).toBe(true);
    expect(result.user).toMatchObject({
      name: '홍길동',
      email: 'hong@example.com',
    });
    expect(result.user.password).toBeUndefined();
    expect(getCurrentSession()).toEqual(result.user);
    expect(JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEYS.users))).toHaveLength(1);
    expect(AUTH_STORAGE_KEYS.users).toMatch(/^jobdam-ai\.auth\./);
    expect(AUTH_STORAGE_KEYS.session).toMatch(/^jobdam-ai\.auth\./);
  });

  it('같은 밀리초에 가입해도 저장소 소유자 ID를 고유하게 만든다', () => {
    vi.spyOn(Date, 'now').mockReturnValue(777);

    const first = signUp({
      name: '첫 번째 사용자',
      email: 'first@example.com',
      password: 'password8',
      confirmPassword: 'password8',
    });
    const second = signUp({
      name: '두 번째 사용자',
      email: 'second@example.com',
      password: 'password8',
      confirmPassword: 'password8',
    });

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(first.user.id).not.toBe(second.user.id);
  });

  it('returns field errors for an invalid signup request', () => {
    expect(validateSignupInput({
      name: '홍길동',
      email: 'not-an-email',
      password: 'short',
      confirmPassword: 'different',
    })).toEqual({
      email: '올바른 이메일 주소를 입력해 주세요.',
      password: '비밀번호는 8자 이상으로 입력해 주세요.',
      confirmPassword: '비밀번호가 일치하지 않습니다.',
    });
  });

  it('rejects a duplicate email address without creating another account', () => {
    signUp({
      name: '홍길동',
      email: 'hong@example.com',
      password: 'password8',
      confirmPassword: 'password8',
    });

    const result = signUp({
      name: '임꺽정',
      email: 'HONG@example.com',
      password: 'password8',
      confirmPassword: 'password8',
    });

    expect(result).toEqual({
      success: false,
      errors: { email: '이미 가입된 이메일입니다.' },
    });
    expect(JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEYS.users))).toHaveLength(1);
  });

  it('does not persist an account when signup validation fails', () => {
    const result = signUp({
      name: ' ',
      email: 'not-an-email',
      password: 'short',
      confirmPassword: 'different',
    });

    expect(result).toEqual({
      success: false,
      errors: {
        name: '이름을 입력해 주세요.',
        email: '올바른 이메일 주소를 입력해 주세요.',
        password: '비밀번호는 8자 이상으로 입력해 주세요.',
        confirmPassword: '비밀번호가 일치하지 않습니다.',
      },
    });
    expect(window.localStorage.getItem(AUTH_STORAGE_KEYS.users)).toBeNull();
    expect(getCurrentSession()).toBeNull();
  });

  it('creates a session when registered credentials are used to sign in', () => {
    signUp({
      name: '홍길동',
      email: 'hong@example.com',
      password: 'password8',
      confirmPassword: 'password8',
    });
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.session);

    const result = signIn({
      email: 'HONG@example.com',
      password: 'password8',
    });

    expect(result).toEqual({
      success: true,
      user: {
        id: expect.any(String),
        name: '홍길동',
        email: 'hong@example.com',
      },
    });
    expect(getCurrentSession()).toEqual(result.user);
  });

  it('returns field errors for invalid sign-in input', () => {
    expect(validateSignInInput({
      email: 'not-an-email',
      password: '',
    })).toEqual({
      email: '올바른 이메일 주소를 입력해 주세요.',
      password: '비밀번호를 입력해 주세요.',
    });
  });

  it('rejects unknown sign-in credentials without creating a session', () => {
    signUp({
      name: '홍길동',
      email: 'hong@example.com',
      password: 'password8',
      confirmPassword: 'password8',
    });
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.session);

    expect(signIn({
      email: 'hong@example.com',
      password: 'incorrect-password',
    })).toEqual({
      success: false,
      errors: { form: '이메일 또는 비밀번호를 확인해 주세요.' },
    });
    expect(getCurrentSession()).toBeNull();
  });

  it('returns validation errors before attempting an invalid sign-in', () => {
    expect(signIn({
      email: 'not-an-email',
      password: '',
    })).toEqual({
      success: false,
      errors: {
        email: '올바른 이메일 주소를 입력해 주세요.',
        password: '비밀번호를 입력해 주세요.',
      },
    });
  });

  it('손상되거나 사용자와 일치하지 않는 세션을 로그인으로 복원하지 않는다', () => {
    window.localStorage.setItem(AUTH_STORAGE_KEYS.session, JSON.stringify({
      id: 'unknown-user',
      name: '알 수 없음',
      email: 'unknown@example.com',
    }));

    expect(getCurrentSession()).toBeNull();
    expect(window.localStorage.getItem(AUTH_STORAGE_KEYS.session)).toBeNull();

    window.localStorage.setItem(AUTH_STORAGE_KEYS.session, '{');

    expect(getCurrentSession()).toBeNull();
    expect(window.localStorage.getItem(AUTH_STORAGE_KEYS.session)).toBeNull();
  });

  it('손상된 사용자 저장소는 빈 데모 계정 목록으로 안전하게 복구한다', () => {
    window.localStorage.setItem(AUTH_STORAGE_KEYS.users, '{');

    const result = signUp({
      name: '홍길동',
      email: 'hong@example.com',
      password: 'password8',
      confirmPassword: 'password8',
    });

    expect(result.success).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEYS.users))).toHaveLength(1);
  });

  it('clears only the current session when signing out', () => {
    signUp({
      name: '홍길동',
      email: 'hong@example.com',
      password: 'password8',
      confirmPassword: 'password8',
    });

    signOut();

    expect(getCurrentSession()).toBeNull();
    expect(JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEYS.users))).toHaveLength(1);
  });
});
