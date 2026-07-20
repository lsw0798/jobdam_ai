import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routing/routes';
import { useAuth } from './useAuth';
import './auth.css';

const INITIAL_FORM = Object.freeze({
  email: '',
  password: '',
});

function AuthError({ errors }) {
  const messages = Object.values(errors);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="auth-errors" role="alert">
      <ul>{messages.map((message) => <li key={message}>{message}</li>)}</ul>
    </div>
  );
}

export function LoginPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const { signIn } = useAuth();
  const navigate = useNavigate();

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const result = signIn(form);

    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    navigate(ROUTES.dashboard);
  }

  return (
    <main className="auth-page">
      <section aria-labelledby="login-heading" className="auth-card">
        <p className="auth-eyebrow">JOBDAM AI</p>
        <h1 id="login-heading">로그인</h1>
        <p className="auth-notice">데모 버전에서는 브라우저에만 로그인 정보가 저장됩니다.</p>
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-email">이메일</label>
            <input autoComplete="email" id="login-email" name="email" onChange={handleChange} type="email" value={form.email} />
          </div>
          <div className="auth-field">
            <label htmlFor="login-password">비밀번호</label>
            <input autoComplete="current-password" id="login-password" name="password" onChange={handleChange} type="password" value={form.password} />
          </div>
          <AuthError errors={errors} />
          <button type="submit">로그인</button>
        </form>
        <p className="auth-switch">
          아직 계정이 없으신가요? <Link to={ROUTES.signup}>회원가입</Link>
        </p>
      </section>
    </main>
  );
}
