import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routing/routes';
import { useAuth } from './useAuth';
import './auth.css';

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

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

export function SignupPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const { signUp } = useAuth();
  const navigate = useNavigate();

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const result = signUp(form);

    if (result.success) {
      setErrors({});
      navigate(ROUTES.dashboard);
      return;
    }

    setErrors(result.errors);
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="signup-heading">
        <p className="auth-eyebrow">JOBDAM AI</p>
        <h1 id="signup-heading">회원가입</h1>
        <p className="auth-notice">이 화면은 데모용 로컬 인증입니다. 실제 보안 또는 개인정보 보호 기능을 제공하지 않습니다.</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="signup-name">이름</label>
            <input id="signup-name" name="name" type="text" autoComplete="name" value={form.name} onChange={handleChange} />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-email">이메일</label>
            <input id="signup-email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-password">비밀번호</label>
            <input id="signup-password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={handleChange} />
          </div>
          <div className="auth-field">
            <label htmlFor="signup-confirm-password">비밀번호 확인</label>
            <input id="signup-confirm-password" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} />
          </div>
          <AuthError errors={errors} />
          <button type="submit">회원가입</button>
        </form>

        <p className="auth-switch">
          이미 계정이 있으신가요? <Link to={ROUTES.login}>로그인</Link>
        </p>
      </section>
    </main>
  );
}
