import { useState } from 'react';
import { apiLogin } from '../services/api';

export default function LoginPage({ onLogin, onSwitchToSignup, t, language }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiLogin(email, password);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-wallpaper">
        <img src="/login-wallpaper.png" alt="Eletromidia" />
      </div>

      <div className="login-form-side">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-logo">
            <img src="/Eletromidia_logo.png" alt="Eletromidia" className="login-logo-img" />
            <div className="login-logo-text">
              <span className="login-logo-title">VENUS</span>
              <span className="login-logo-sub">ELETROMIDIA</span>
            </div>
          </div>

          <h1 className="login-welcome">{t.loginTitle}</h1>

          {error && <div className="login-error">{error}</div>}

          <div className="login-field">
            <label htmlFor="login-email">{t.loginEmail}</label>
            <input
              id="login-email"
              type="email"
              placeholder={t.loginEmailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <div className="login-field-header">
              <label htmlFor="login-password">{t.loginPassword}</label>
              <a href="#" className="login-forgot" onClick={(e) => e.preventDefault()}>
                {t.loginForgot}
              </a>
            </div>
            <input
              id="login-password"
              type="password"
              placeholder={t.loginPasswordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? t.loginLoading : t.loginButton}
          </button>

          <p className="login-signup">
            {t.loginNoAccount || 'Não possui uma conta?'}{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToSignup?.(); }}>
              {t.loginSignup || 'Cadastre-se agora'}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
