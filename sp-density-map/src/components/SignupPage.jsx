import { useState } from 'react';
import { apiSignup, apiLogin } from '../services/api';

export default function SignupPage({ onLogin, onSwitchToLogin, t, language }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiSignup(name, email, password);
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

          <h1 className="login-welcome">{t.signupTitle}</h1>

          {error && <div className="login-error">{error}</div>}

          <div className="login-field">
            <label htmlFor="signup-name">{t.signupName}</label>
            <input
              id="signup-name"
              type="text"
              placeholder={t.signupNamePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="login-field">
            <label htmlFor="signup-email">{t.signupEmail}</label>
            <input
              id="signup-email"
              type="email"
              placeholder={t.signupEmailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label htmlFor="signup-password">{t.signupPassword}</label>
            <input
              id="signup-password"
              type="password"
              placeholder={t.signupPasswordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? t.signupLoading : t.signupButton}
          </button>

          <p className="login-signup">
            {t.signupHasAccount}{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin?.(); }}>
              {t.signupLogin}
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
