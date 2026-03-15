import React, { useState, useEffect, useMemo } from 'react';
import { HexagonLayer } from 'deck.gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import './Dashboard.css';

import {
  T, DEFAULT_SETTINGS, COLOR_RANGES, CHART_COLORS,
  FILTER_CONFIG, INITIAL_FILTERS, INITIAL_VIEW_STATE,
} from './constants';
import { isAuthenticated, removeToken, apiPost } from './services/api';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import Sidebar from './components/Sidebar';
import SettingsPanel from './components/SettingsPanel';
import MapView from './components/MapView';
import StatsGrid from './components/StatsGrid';
import FilterPanel from './components/FilterPanel';
import CampaignsPage from './components/CampaignsPage';

const COOKIE_KEY = 'venus-settings';

function getCookie() {
  try {
    const match = document.cookie.split('; ').find(r => r.startsWith(COOKIE_KEY + '='));
    return match ? JSON.parse(decodeURIComponent(match.split('=').slice(1).join('='))) : null;
  } catch { return null; }
}

function setCookie(value) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(value))};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function App() {
  const [settings, setSettings] = useState(() => {
    const saved = getCookie();
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
  });

  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [authPage, setAuthPage] = useState('login');

  const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));
  const resetSettings = () => setSettings(DEFAULT_SETTINGS);

  useEffect(() => {
    setCookie(settings);
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-colorblind', settings.colorblindMode);
    root.setAttribute('data-font-size', settings.fontSize);
    root.setAttribute('data-font-family', settings.fontFamily);
    root.setAttribute('data-high-contrast', settings.highContrast ? 'true' : 'false');
    root.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
    root.classList.toggle('reduced-motion', settings.reducedMotion);
  }, [settings]);

  const t = T[settings.language] || T.pt;
  const chartColors = CHART_COLORS[settings.colorblindMode] || CHART_COLORS.none;
  const colorRange  = COLOR_RANGES[settings.colorblindMode]  || COLOR_RANGES.none;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [is2D, setIs2D] = useState(false);
  const [onlyRelevant, setOnlyRelevant] = useState(false);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  const filterKey = JSON.stringify({ i: filters.idade, g: filters.genero, c: filters.classe_social });

  useEffect(() => {
    if (!loggedIn) return;
    const payload = {
      filters: {
        ageGroups: filters.idade,
        genders: filters.genero,
        socialClasses: filters.classe_social,
      },
    };

    Promise.all([
      apiPost('/api/v1/flow/spatial', payload).then(r => r.json()),
      apiPost('/api/v1/flow/metrics', payload).then(r => r.json()),
      apiPost('/api/v1/flow/ranking/neighborhoods', payload).then(r => r.json()),
      apiPost('/api/v1/flow/distribution/demographics', payload).then(r => r.json()),
    ])
      .then(([spatial, metrics, ranking, demographics]) => {
        setApiData({ spatial, metrics, ranking, demographics });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao carregar dados:', err);
        setLoading(false);
      });
  }, [loggedIn, filterKey]);

  const { filteredData, stats } = useMemo(() => {
    const empty = {
      filteredData: [],
      stats: { totalImpressions: 0, hourlyChartData: [], peakHour: '00:00', categoryStats: { genero: { F: 0, M: 0 }, idade: {}, classe: {} }, topBairros: [] },
    };
    if (!apiData) return empty;

    const { spatial, metrics, ranking, demographics } = apiData;

    // Spatial → pontos para o HexagonLayer
    const points = (spatial?.data || []).map(d => ({
      coordinates: [d.longitude, d.latitude],
      displayValue: d.weighted_uniques,
    }));
    const maxVal = points.length ? Math.max(...points.map(p => p.displayValue)) : 0;
    const threshold = onlyRelevant ? maxVal * 0.4 : 0;
    const filteredData = points.filter(d => d.displayValue >= threshold);

    // Metrics → gráfico horário + total
    const hourlyFull = Array(24).fill(0);
    (metrics?.flow24h || []).forEach(h => { hourlyFull[h.hour] = h.volume; });
    const activeHours = new Set(filters.horario);
    const totalImpressions = hourlyFull.reduce((sum, v, i) => activeHours.has(i) ? sum + v : sum, 0);
    const hourlyChartData = hourlyFull.map((v, i) => ({ hour: `${i}h`, value: v }));
    const peakIdx = hourlyFull.indexOf(Math.max(...hourlyFull));

    // Ranking → topBairros
    const topBairros = (ranking?.ranking || []).map(r => ({
      name: r.name.length > 30 ? r.name.substring(0, 30) + '…' : r.name,
      value: r.volume,
    })).slice(0, 5);

    // Demographics → gênero e classe social
    const genero = { F: 0, M: 0 };
    (demographics?.gender || []).forEach(g => { genero[g.category] = g.volume; });
    const classe = {};
    FILTER_CONFIG.classe_social.forEach(k => { classe[k] = 0; });
    (demographics?.socialClass || []).forEach(c => { classe[c.category] = c.volume; });

    return {
      filteredData,
      stats: {
        totalImpressions,
        hourlyChartData,
        peakHour: `${peakIdx.toString().padStart(2, '0')}:00`,
        categoryStats: { genero, idade: {}, classe },
        topBairros,
      },
    };
  }, [apiData, filters.horario, onlyRelevant]);

  const toggleFilter = (cat, val) =>
    setFilters(p => { const cur = p[cat]; const next = cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val]; return { ...p, [cat]: next }; });

  useEffect(() => {
    setViewState(prev => ({ ...prev, pitch: is2D ? 0 : 45, bearing: is2D ? 0 : prev.bearing }));
  }, [is2D]);

  const layers = [
    new HexagonLayer({
      id: 'heatmap', data: filteredData,
      pickable: true, extruded: !is2D,
      radius: 200, elevationScale: is2D ? 0 : 10,
      getPosition: d => d.coordinates,
      getElevationWeight: d => d.displayValue,
      aggregation: 'SUM',
      colorRange,
      onHover: info => setHoverInfo(info),
      updateTriggers: { getElevationWeight: [apiData, onlyRelevant], colorRange: [settings.colorblindMode] },
    }),
  ];

  const handleLogout = () => {
    removeToken();
    setLoggedIn(false);
  };

  if (!loggedIn) {
    const t = T[settings.language] || T.pt;
    return (
      <div className="venus-app">
        {authPage === 'signup' ? (
          <SignupPage
            onLogin={() => setLoggedIn(true)}
            onSwitchToLogin={() => setAuthPage('login')}
            t={t}
            language={settings.language}
          />
        ) : (
          <LoginPage
            onLogin={() => setLoggedIn(true)}
            onSwitchToSignup={() => setAuthPage('signup')}
            t={t}
            language={settings.language}
          />
        )}
      </div>
    );
  }

  if (loading) return (
    <div className="venus-app" style={{ justifyContent: 'center', alignItems: 'center' }} role="status" aria-live="polite">
      <span>{t.loading}</span>
    </div>
  );

  return (
    <div className="venus-app">
      <a href="#main-content" className="skip-link">{t.skipToContent}</a>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} t={t} language={settings.language} onLogout={handleLogout} />

      <main className="venus-main" id="main-content" tabIndex="-1">
        {activeTab === 'dashboard' && (
          <header className="venus-header">
            <p className="venus-greeting">{t.hello}</p>
            <h1 className="venus-title">{t.dashboardTitle}</h1>
          </header>
        )}

        {activeTab === 'settings' ? (
          <SettingsPanel settings={settings} updateSetting={updateSetting} resetSettings={resetSettings} t={t} />
        ) : activeTab === 'campaigns' ? (
          <CampaignsPage t={t} language={settings.language} />
        ) : (
          <div className="venus-content-layout">
            <div className="venus-left-col">
              <MapView
                viewState={viewState}
                setViewState={setViewState}
                layers={layers}
                hoverInfo={hoverInfo}
                isMapExpanded={isMapExpanded}
                setIsMapExpanded={setIsMapExpanded}
                is2D={is2D}
                setIs2D={setIs2D}
                t={t}
                language={settings.language}
                darkMode={settings.darkMode}
                highContrast={settings.highContrast}
              />

              {!isMapExpanded && (
                <StatsGrid stats={stats} chartColors={chartColors} t={t} language={settings.language} />
              )}
              <div style={{ height: '120px' }} />
            </div>

            <FilterPanel
              filters={filters}
              toggleFilter={toggleFilter}
              onlyRelevant={onlyRelevant}
              setOnlyRelevant={setOnlyRelevant}
              chartColors={chartColors}
              t={t}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
