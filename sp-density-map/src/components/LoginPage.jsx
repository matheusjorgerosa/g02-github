import { useState } from 'react';
import { apiLogin } from '../services/api';

export default function LoginPage({ onLogin, t, language }) {
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

          <div className="login-divider">
            <span>{t.loginOr || 'ou'}</span>
          </div>

          <button type="button" className="login-google" disabled>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {t.loginGoogle || 'Entrar com Google'}
          </button>

          <p className="login-signup">
            {t.loginNoAccount || 'Não possui uma conta?'}{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>
              {t.loginSignup || 'Cadastre-se agora'}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
