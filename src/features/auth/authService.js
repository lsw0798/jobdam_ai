export const AUTH_STORAGE_KEYS = Object.freeze({
  users: 'jobdam-ai.auth.users',
  session: 'jobdam-ai.auth.session',
});

let fallbackUserIdSequence = 0;

function createUserId() {
  const uuid = globalThis.crypto?.randomUUID?.();

  if (typeof uuid === 'string' && uuid) {
    return `user-${uuid}`;
  }

  fallbackUserIdSequence += 1;
  return `user-${Date.now()}-${fallbackUserIdSequence}-${Math.random().toString(36).slice(2)}`;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && Boolean(value.trim());
}

function normalizeStoredUser(user) {
  if (
    !user
    || !isNonEmptyString(user.id)
    || !isNonEmptyString(user.name)
    || !isNonEmptyString(user.email)
    || !isNonEmptyString(user.password)
  ) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email.toLowerCase(),
    password: user.password,
  };
}

function toSession(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function readStoredJson(storageKey, fallbackValue) {
  try {
    const value = window.localStorage.getItem(storageKey);
    return value ? JSON.parse(value) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function readUsers() {
  const storedUsers = readStoredJson(AUTH_STORAGE_KEYS.users, []);

  return Array.isArray(storedUsers)
    ? storedUsers.map(normalizeStoredUser).filter(Boolean)
    : [];
}

function removeCurrentSession() {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEYS.session);
  } catch {
    // Demo storage may be unavailable in a restricted browser context.
  }
}

export function validateSignupInput({ name, email, password, confirmPassword }) {
  const errors = {};
  const normalizedName = name.trim();
  const normalizedEmail = email.trim();

  if (!normalizedName) {
    errors.name = '이름을 입력해 주세요.';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = '올바른 이메일 주소를 입력해 주세요.';
  }

  if (password.length < 8) {
    errors.password = '비밀번호는 8자 이상으로 입력해 주세요.';
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
  }

  return errors;
}

export function validateSignInInput({ email, password }) {
  const errors = {};
  const normalizedEmail = email.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = '올바른 이메일 주소를 입력해 주세요.';
  }

  if (!password) {
    errors.password = '비밀번호를 입력해 주세요.';
  }

  return errors;
}

export function signUp({ name, email, password, confirmPassword }) {
  const errors = validateSignupInput({ name, email, password, confirmPassword });

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const users = readUsers();
  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((user) => user.email === normalizedEmail)) {
    return {
      success: false,
      errors: { email: '이미 가입된 이메일입니다.' },
    };
  }

  const user = {
    id: createUserId(),
    name: normalizedName,
    email: normalizedEmail,
    password,
  };
  const session = toSession(user);

  window.localStorage.setItem(AUTH_STORAGE_KEYS.users, JSON.stringify([...users, user]));
  window.localStorage.setItem(AUTH_STORAGE_KEYS.session, JSON.stringify(session));

  return { success: true, user: session };
}

export function getCurrentSession() {
  const session = readStoredJson(AUTH_STORAGE_KEYS.session, null);

  if (!session || !isNonEmptyString(session.id) || !isNonEmptyString(session.email)) {
    removeCurrentSession();
    return null;
  }

  const user = readUsers().find((candidate) => (
    candidate.id === session.id && candidate.email === session.email.toLowerCase()
  ));

  if (!user) {
    removeCurrentSession();
    return null;
  }

  return toSession(user);
}

export function signOut() {
  removeCurrentSession();
}

export function signIn({ email, password }) {
  const errors = validateSignInInput({ email, password });

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((candidate) => (
    candidate.email === normalizedEmail && candidate.password === password
  ));

  if (!user) {
    return {
      success: false,
      errors: { form: '이메일 또는 비밀번호를 확인해 주세요.' },
    };
  }

  const session = toSession(user);
  window.localStorage.setItem(AUTH_STORAGE_KEYS.session, JSON.stringify(session));

  return { success: true, user: session };
}
