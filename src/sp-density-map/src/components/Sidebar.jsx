import React from 'react';
import Icons from './Icons';
import { isAdmin } from '../services/api';

function Sidebar({ activeTab, setActiveTab, t, language, onLogout }) {
  return (
    <aside className="venus-sidebar" role="navigation" aria-label={language === 'pt' ? 'Menu principal' : 'Main menu'}>
      <div className="venus-logo-container">
        <img
          src="/Eletromidia_logo.png"
          alt={language === 'pt' ? 'Logo Eletromidia' : 'Eletromidia logo'}
          className="venus-logo-img"
        />
        <div className="venus-logo-text-wrapper" aria-hidden="true">
          <span className="venus-logo-text">VENUS</span>
          <span className="venus-logo-sub">DASHBOARD</span>
        </div>
      </div>

      <nav className="venus-nav" aria-label={language === 'pt' ? 'Navegação' : 'Navigation'}>
        <button
          className={`venus-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          aria-label={t.navDashboard}
          aria-current={activeTab === 'dashboard' ? 'page' : undefined}
        >
          <span className="nav-icon"><Icons.Dashboard /></span>
          <span className="nav-label">{t.dashboard}</span>
        </button>

        <button
          className={`venus-nav-item ${activeTab === 'campaigns' ? 'active' : ''}`}
          onClick={() => setActiveTab('campaigns')}
          aria-label={t.navCampaigns}
          aria-current={activeTab === 'campaigns' ? 'page' : undefined}
        >
          <span className="nav-icon"><Icons.Campaign /></span>
          <span className="nav-label">{t.campaigns}</span>
        </button>

        {isAdmin() && (
          <>
            <button
              className={`venus-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
              aria-label={t.navUsers || "Usuários"}
              aria-current={activeTab === 'users' ? 'page' : undefined}
            >
              <span className="nav-icon"><Icons.Users /></span>
              <span className="nav-label">{t.users || "Usuários"}</span>
            </button>
            <button
              className={`venus-nav-item ${activeTab === 'logs' ? 'active' : ''}`}
              onClick={() => setActiveTab('logs')}
              aria-label={t.navLogs || "Logs"}
              aria-current={activeTab === 'logs' ? 'page' : undefined}
            >
              <span className="nav-icon"><Icons.Logs /></span>
              <span className="nav-label">{t.logs || "Logs"}</span>
            </button>

          </>
        )}

        <button
          className={`venus-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          aria-label={t.navSettings}
          aria-current={activeTab === 'settings' ? 'page' : undefined}
        >
          <span className="nav-icon"><Icons.Settings /></span>
          <span className="nav-label">{t.settings}</span>
        </button>
      </nav>

      <button className="venus-logout" aria-label={t.navLogout} onClick={onLogout}>
        <span className="nav-icon"><Icons.Logout /></span>
        <span className="nav-label">{t.logout}</span>
      </button>
    </aside>
  );
}

export default Sidebar;
