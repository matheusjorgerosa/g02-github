import React, { useState, useEffect, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { HexagonLayer } from 'deck.gl';
import { Map } from 'react-map-gl/maplibre';
import Papa from 'papaparse';
import {
  XAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, AreaChart, Area, Cell, YAxis
} from 'recharts';
import 'maplibre-gl/dist/maplibre-gl.css';
import './Dashboard.css';

// ─── Translations ──────────────────────────────────────────────────────────────
const T = {
  pt: {
    dashboard: 'Dashboard', campaigns: 'Campanhas', settings: 'Ajustes', logout: 'Sair',
    hello: 'Olá, André!', dashboardTitle: 'Dashboard VENUS',
    loading: 'Carregando VENUS...',
    totalAudience: 'Público Total', flow24h: 'Fluxo 24h',
    estimatedPeak: 'Pico Estimado', districtDist: 'Distribuição por Bairro (Endereço)',
    socialClass: 'Classe Social', gender: 'Gênero', impact: 'Impacto',
    publicFilters: 'Filtros de Público', onlyRelevant: 'Apenas Bins Relevantes',
    ageRange: 'Faixa Etária:', genderLabel: 'Gênero:', socialClassLabel: 'Classe Social:', hoursLabel: 'Horários (24h):',
    male: 'Masculino', female: 'Feminino',
    settingsTitle: 'Configurações de Acessibilidade',
    colorblindMode: 'Modo Daltônico', colorblindNone: 'Desativado',
    colorblindDeutan: 'Deuteranopia (daltonismo verde)', colorblindProtan: 'Protanopia (daltonismo vermelho)', colorblindTritan: 'Tritanopia (daltonismo azul)',
    highContrast: 'Alto Contraste',
    fontSize: 'Tamanho da Fonte', fontSmall: 'Pequena', fontMedium: 'Média', fontLarge: 'Grande', fontXLarge: 'Extra Grande',
    fontFamily: 'Família de Fonte', fontInter: 'Inter (padrão)', fontOpenDys: 'OpenDyslexic', fontMono: 'Monoespaçada', fontSerif: 'Serifada',
    reducedMotion: 'Reduzir Animações', language: 'Idioma', resetSettings: 'Restaurar Padrões',
    skipToContent: 'Pular para o conteúdo',
    expandMap: 'Expandir mapa para tela cheia', minimizeMap: 'Minimizar mapa',
    view2D: 'Alternar para visão 2D', view3D: 'Alternar para visão 3D',
    navDashboard: 'Ir para Dashboard', navCampaigns: 'Ir para Campanhas (indisponível)',
    navSettings: 'Abrir Configurações', navLogout: 'Sair do sistema',
  },
  en: {
    dashboard: 'Dashboard', campaigns: 'Campaigns', settings: 'Settings', logout: 'Logout',
    hello: 'Hello, André!', dashboardTitle: 'VENUS Dashboard',
    loading: 'Loading VENUS...',
    totalAudience: 'Total Audience', flow24h: '24h Flow',
    estimatedPeak: 'Estimated Peak', districtDist: 'Distribution by District',
    socialClass: 'Social Class', gender: 'Gender', impact: 'Impact',
    publicFilters: 'Audience Filters', onlyRelevant: 'Only Relevant Bins',
    ageRange: 'Age Range:', genderLabel: 'Gender:', socialClassLabel: 'Social Class:', hoursLabel: 'Hours (24h):',
    male: 'Male', female: 'Female',
    settingsTitle: 'Accessibility Settings',
    colorblindMode: 'Colorblind Mode', colorblindNone: 'Disabled',
    colorblindDeutan: 'Deuteranopia (green blindness)', colorblindProtan: 'Protanopia (red blindness)', colorblindTritan: 'Tritanopia (blue blindness)',
    highContrast: 'High Contrast',
    fontSize: 'Font Size', fontSmall: 'Small', fontMedium: 'Medium', fontLarge: 'Large', fontXLarge: 'Extra Large',
    fontFamily: 'Font Family', fontInter: 'Inter (default)', fontOpenDys: 'OpenDyslexic', fontMono: 'Monospace', fontSerif: 'Serif',
    reducedMotion: 'Reduce Motion', language: 'Language', resetSettings: 'Reset Defaults',
    skipToContent: 'Skip to content',
    expandMap: 'Expand map to full screen', minimizeMap: 'Minimize map',
    view2D: 'Switch to 2D view', view3D: 'Switch to 3D view',
    navDashboard: 'Go to Dashboard', navCampaigns: 'Go to Campaigns (unavailable)',
    navSettings: 'Open Settings', navLogout: 'Log out',
  }
};

// ─── Default settings ──────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  colorblindMode: 'none',
  highContrast: false,
  fontSize: 'medium',
  fontFamily: 'inter',
  reducedMotion: false,
  language: 'pt',
};

// ─── Color palettes per colorblind mode ───────────────────────────────────────
const COLOR_RANGES = {
  none:   [[255,230,210],[255,180,130],[255,130,60],[255,85,0],[200,65,0],[150,45,0]],
  deutan: [[255,247,188],[254,227,145],[254,196,79],[236,112,20],[204,76,2],[140,45,4]],
  protan: [[255,255,178],[254,217,118],[254,178,76],[253,141,60],[240,59,32],[189,0,38]],
  tritan: [[237,248,251],[178,226,226],[102,194,164],[44,162,95],[0,109,44],[0,68,27]],
};

const CHART_COLORS = {
  none:   { primary: '#FF5500', secondary: '#FFBB99' },
  deutan: { primary: '#EC7014', secondary: '#FEC44F' },
  protan: { primary: '#FD8D3C', secondary: '#FED976' },
  tritan: { primary: '#2CA25F', secondary: '#99D8C9' },
};

// ─── Icons (aria-hidden – purely decorative) ──────────────────────────────────
const Icons = {
  Dashboard: () => <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Campaign: () => <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>,
  Settings: () => <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Logout: () => <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Expand: () => <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>,
  Minimize: () => <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6m0 0v6m0-6l-7 7m17-7h-6m0 0v6m0-6l7 7M20 10h-6m0 0V4m0 6l7-7M4 10h6m0 0V4m0 6l-7-7"/></svg>,
  Map2D: () => <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>,
  Map3D: () => <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16.5a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4A2 2 0 0 1 3 16.5v-9a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4A2 2 0 0 1 21 7.5z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  Check: () => <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  Globe: () => <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  Eye: () => <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Contrast: () => <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20" /><path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor" stroke="none"/></svg>,
  Type: () => <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
  Font: () => <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><text x="2" y="18" fontSize="18" fontFamily="serif" fill="currentColor" stroke="none">A</text><text x="12" y="18" fontSize="12" fontFamily="sans-serif" fill="currentColor" stroke="none">a</text></svg>,
  Zap: () => <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
};

// ─── Filter config ─────────────────────────────────────────────────────────────
const FILTER_CONFIG = {
  idade: ['18-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+'],
  genero: [{ id: 'M', label: 'Masculino' }, { id: 'F', label: 'Feminino' }],
  classe_social: ['A', 'B1', 'B2', 'C1', 'C2', 'DE'],
  horario: Array.from({ length: 24 }, (_, i) => i),
};

const INITIAL_FILTERS = {
  idade: [...FILTER_CONFIG.idade],
  genero: ['M', 'F'],
  classe_social: [...FILTER_CONFIG.classe_social],
  horario: [...FILTER_CONFIG.horario],
};

const INITIAL_VIEW_STATE = { longitude: -46.6333, latitude: -23.5505, zoom: 11, pitch: 45, bearing: 0 };

const formatNumber = (val) => Math.floor(val).toLocaleString('pt-BR');
const renderPieLabel = ({ name, percent }) => `${name} (${Math.floor(percent * 100)}%)`;
const parseTarget = (str) => { if (!str) return null; try { return JSON.parse(str.replace(/'/g, '"')); } catch { return null; } };

// ─── Settings Panel ────────────────────────────────────────────────────────────
function SettingsPanel({ settings, updateSetting, resetSettings, t }) {
  const RadioGroup = ({ label, name, options, value }) => (
    <div className="settings-row" role="radiogroup" aria-labelledby={`label-${name}`}>
      <span className="settings-label" id={`label-${name}`}>{label}</span>
      <div className="settings-options">
        {options.map(opt => (
          <label key={opt.value} className={`settings-option ${value === opt.value ? 'selected' : ''}`}>
            <input
              type="radio" name={name} value={opt.value}
              checked={value === opt.value}
              onChange={() => updateSetting(name, opt.value)}
              aria-label={opt.label}
            />
            {value === opt.value && <Icons.Check />}
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );

  const Toggle = ({ label, settingKey, value, description }) => (
    <div className="settings-toggle-row">
      <div>
        <span className="settings-label">{label}</span>
        {description && <span className="settings-desc">{description}</span>}
      </div>
      <button
        role="switch"
        aria-checked={value}
        aria-label={label}
        className={`settings-toggle ${value ? 'on' : 'off'}`}
        onClick={() => updateSetting(settingKey, !value)}
      >
        <span className="toggle-knob" />
      </button>
    </div>
  );

  return (
    <div className="settings-panel" role="main" aria-label={t.settingsTitle}>
      <div className="settings-header">
        <h1 className="settings-title">{t.settingsTitle}</h1>
        <p className="settings-subtitle">
          {settings.language === 'pt'
            ? 'Personalize a experiência visual e de acessibilidade do dashboard.'
            : 'Customize the visual and accessibility experience of the dashboard.'}
        </p>
      </div>

      <div className="settings-grid">
        {/* Language */}
        <section className="settings-section" aria-labelledby="sec-language">
          <h2 className="settings-section-title" id="sec-language">
            <span className="settings-section-icon"><Icons.Globe /></span>{t.language}
          </h2>
          <RadioGroup label={t.language} name="language" value={settings.language} options={[
            { value: 'pt', label: 'Português (BR)' },
            { value: 'en', label: 'English' },
          ]} />
        </section>

        {/* Colorblind */}
        <section className="settings-section" aria-labelledby="sec-colorblind">
          <h2 className="settings-section-title" id="sec-colorblind"><span className="settings-section-icon"><Icons.Eye /></span>{t.colorblindMode}</h2>
          <p className="settings-desc-block">
            {settings.language === 'pt'
              ? 'Ajusta a paleta de cores do mapa e gráficos para diferentes tipos de daltonismo.'
              : 'Adjusts map and chart color palettes for different types of color blindness.'}
          </p>
          <RadioGroup label={t.colorblindMode} name="colorblindMode" value={settings.colorblindMode} options={[
            { value: 'none',   label: t.colorblindNone },
            { value: 'deutan', label: t.colorblindDeutan },
            { value: 'protan', label: t.colorblindProtan },
            { value: 'tritan', label: t.colorblindTritan },
          ]} />
          <div className="colorblind-preview" aria-label={settings.language === 'pt' ? 'Prévia das cores' : 'Color preview'}>
            {COLOR_RANGES[settings.colorblindMode].map((c, i) => (
              <div key={i} className="color-swatch" style={{ background: `rgb(${c[0]},${c[1]},${c[2]})` }}
                aria-label={`Cor ${i + 1}`} />
            ))}
          </div>
        </section>

        {/* High Contrast */}
        <section className="settings-section" aria-labelledby="sec-contrast">
          <h2 className="settings-section-title" id="sec-contrast"><span className="settings-section-icon"><Icons.Contrast /></span>{t.highContrast}</h2>
          <p className="settings-desc-block">
            {settings.language === 'pt'
              ? 'Aumenta o contraste entre textos e fundos para melhor legibilidade.'
              : 'Increases contrast between text and backgrounds for better readability.'}
          </p>
          <Toggle label={t.highContrast} settingKey="highContrast" value={settings.highContrast} />
        </section>

        {/* Font Size */}
        <section className="settings-section" aria-labelledby="sec-fontsize">
          <h2 className="settings-section-title" id="sec-fontsize"><span className="settings-section-icon"><Icons.Type /></span>{t.fontSize}</h2>
          <RadioGroup label={t.fontSize} name="fontSize" value={settings.fontSize} options={[
            { value: 'small',  label: t.fontSmall },
            { value: 'medium', label: t.fontMedium },
            { value: 'large',  label: t.fontLarge },
            { value: 'xlarge', label: t.fontXLarge },
          ]} />
          <p className="font-preview" aria-label={settings.language === 'pt' ? 'Prévia do tamanho de fonte' : 'Font size preview'}>
            {settings.language === 'pt' ? 'Texto de exemplo — Dashboard VENUS' : 'Sample text — VENUS Dashboard'}
          </p>
        </section>

        {/* Font Family */}
        <section className="settings-section" aria-labelledby="sec-fontfamily">
          <h2 className="settings-section-title" id="sec-fontfamily"><span className="settings-section-icon"><Icons.Font /></span>{t.fontFamily}</h2>
          <p className="settings-desc-block">
            {settings.language === 'pt'
              ? 'OpenDyslexic foi criada para aumentar a legibilidade para leitores com dislexia.'
              : 'OpenDyslexic was designed to increase readability for readers with dyslexia.'}
          </p>
          <RadioGroup label={t.fontFamily} name="fontFamily" value={settings.fontFamily} options={[
            { value: 'inter',    label: t.fontInter },
            { value: 'dyslexic', label: t.fontOpenDys },
            { value: 'mono',     label: t.fontMono },
            { value: 'serif',    label: t.fontSerif },
          ]} />
        </section>

        {/* Reduce Motion */}
        <section className="settings-section" aria-labelledby="sec-motion">
          <h2 className="settings-section-title" id="sec-motion"><span className="settings-section-icon"><Icons.Zap /></span>{t.reducedMotion}</h2>
          <p className="settings-desc-block">
            {settings.language === 'pt'
              ? 'Desativa transições e animações para reduzir distração ou desconforto visual.'
              : 'Disables transitions and animations to reduce distraction or visual discomfort.'}
          </p>
          <Toggle label={t.reducedMotion} settingKey="reducedMotion" value={settings.reducedMotion} />
        </section>
      </div>

      <button className="settings-reset-btn" onClick={resetSettings} aria-label={t.resetSettings}>
        {t.resetSettings}
      </button>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('venus-settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });

  const updateSetting = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));
  const resetSettings = () => setSettings(DEFAULT_SETTINGS);

  useEffect(() => {
    try { localStorage.setItem('venus-settings', JSON.stringify(settings)); } catch {}
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-colorblind', settings.colorblindMode);
    root.setAttribute('data-font-size', settings.fontSize);
    root.setAttribute('data-font-family', settings.fontFamily);
    root.setAttribute('data-high-contrast', settings.highContrast ? 'true' : 'false');
    root.classList.toggle('reduced-motion', settings.reducedMotion);
  }, [settings]);

  const t = T[settings.language] || T.pt;
  const chartColors = CHART_COLORS[settings.colorblindMode] || CHART_COLORS.none;
  const colorRange  = COLOR_RANGES[settings.colorblindMode]  || COLOR_RANGES.none;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [is2D, setIs2D] = useState(false);
  const [onlyRelevant, setOnlyRelevant] = useState(false);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  useEffect(() => {
    Papa.parse('/data.csv', {
      download: true, header: true, skipEmptyLines: true,
      complete: (results) => {
        const validData = results.data
          .filter(d => d.longitude && d.latitude)
          .map(d => ({
            ...d,
            coordinates: [Number(d.longitude), Number(d.latitude)],
            uniques: Number(d.uniques) || 0,
            hour: parseInt(d.impression_hour) || 0,
            targetObj: parseTarget(d.target),
          }));
        setData(validData);
        setLoading(false);
      },
    });
  }, []);

  const { filteredData, stats } = useMemo(() => {
    if (!data.length) return {
      filteredData: [],
      stats: { totalImpressions: 0, hourlyChartData: [], peakHour: '00:00', categoryStats: { genero: { F: 0, M: 0 }, idade: {}, classe: {} }, topBairros: [] },
    };

    const activeHours   = new Set(filters.horario);
    const activeGens    = new Set(filters.genero);
    const activeClasses = new Set(filters.classe_social);
    const activeAges    = new Set(filters.idade);

    let totalImpressions = 0;
    const hourlyFullMap = Array(24).fill(0);
    const categoryStats = {
      genero: { F: 0, M: 0 },
      idade:  Object.fromEntries(FILTER_CONFIG.idade.map(k => [k, 0])),
      classe: Object.fromEntries(FILTER_CONFIG.classe_social.map(k => [k, 0])),
    };
    const bairroMap = {};

    const pointsWithFilteredVal = data.map(d => {
      if (!d.targetObj) return { ...d, val: 0 };
      const ageMult = filters.idade.reduce((s, v) => s + (d.targetObj.idade?.[v] || 0), 0);
      const genMult = filters.genero.reduce((s, v) => s + (d.targetObj.genero?.[v] || 0), 0);
      const clsMult = filters.classe_social.reduce((s, v) => s + (d.targetObj.classe_social?.[v] || 0), 0);
      const val = d.uniques * ageMult * genMult * clsMult;
      return { ...d, val, ageMult, genMult, clsMult };
    }).filter(d => d.val > 0);

    const visiblePoints = pointsWithFilteredVal.filter(d => activeHours.has(d.hour));
    const maxImpact = visiblePoints.length > 0 ? Math.max(...visiblePoints.map(p => p.val)) : 0;
    const relevancyThreshold = onlyRelevant ? maxImpact * 0.4 : 0;
    const mapItems = [];

    pointsWithFilteredVal.forEach(d => {
      hourlyFullMap[d.hour] += d.val;
      const baseForClass = d.uniques * d.ageMult * d.genMult;
      Object.entries(d.targetObj.classe_social || {}).forEach(([k, v]) => { if (activeClasses.has(k)) categoryStats.classe[k] += baseForClass * v; });
      const baseForGen = d.uniques * d.ageMult * d.clsMult;
      Object.entries(d.targetObj.genero || {}).forEach(([k, v]) => { if (activeGens.has(k)) categoryStats.genero[k] += baseForGen * v; });
      const baseForAge = d.uniques * d.genMult * d.clsMult;
      Object.entries(d.targetObj.idade || {}).forEach(([k, v]) => { if (activeAges.has(k)) categoryStats.idade[k] += baseForAge * v; });
      if (activeHours.has(d.hour) && d.val >= relevancyThreshold) {
        totalImpressions += d.val;
        mapItems.push({ ...d, displayValue: d.val });
        const bairro = d.endereco || 'Outros';
        bairroMap[bairro] = (bairroMap[bairro] || 0) + d.val;
      }
    });

    const hourlyChartData = hourlyFullMap.map((v, i) => ({ hour: `${i}h`, value: Math.floor(v) }));
    const peakHour = hourlyFullMap.indexOf(Math.max(...hourlyFullMap));
    const topBairros = Object.entries(bairroMap)
      .map(([name, value]) => ({ name: name.substring(0, 20), value: Math.floor(value) }))
      .sort((a, b) => b.value - a.value).slice(0, 5);

    return { filteredData: mapItems, stats: { totalImpressions: Math.floor(totalImpressions), hourlyChartData, peakHour: `${peakHour.toString().padStart(2, '0')}:00`, categoryStats, topBairros } };
  }, [data, filters, onlyRelevant]);

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
      updateTriggers: { getElevationWeight: [filters, onlyRelevant], colorRange: [settings.colorblindMode] },
    }),
  ];

  if (loading) return (
    <div className="venus-app" style={{ justifyContent: 'center', alignItems: 'center' }} role="status" aria-live="polite">
      <span>{t.loading}</span>
    </div>
  );

  return (
    <div className="venus-app">
      {/* Skip-to-content link for keyboard users */}
      <a href="#main-content" className="skip-link">{t.skipToContent}</a>

      <aside className="venus-sidebar" role="navigation" aria-label={settings.language === 'pt' ? 'Menu principal' : 'Main menu'}>
        <div className="venus-logo-container">
          <img
            src="/Eletromidia_logo.png"
            alt={settings.language === 'pt' ? 'Logo Eletromidia' : 'Eletromidia logo'}
            className="venus-logo-img"
          />
          <div className="venus-logo-text-wrapper" aria-hidden="true">
            <span className="venus-logo-text">VENUS</span>
            <span className="venus-logo-sub">DASHBOARD</span>
          </div>
        </div>

        <nav className="venus-nav" aria-label={settings.language === 'pt' ? 'Navegação' : 'Navigation'}>
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
            className="venus-nav-item disabled"
            disabled
            aria-label={t.navCampaigns}
            aria-disabled="true"
          >
            <span className="nav-icon"><Icons.Campaign /></span>
            <span className="nav-label">{t.campaigns}</span>
          </button>

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

        <button className="venus-logout" aria-label={t.navLogout}>
          <Icons.Logout />
          <span className="nav-label">{t.logout}</span>
        </button>
      </aside>

      <main className="venus-main" id="main-content" tabIndex="-1">
        <header className="venus-header">
          <p className="venus-greeting">{t.hello}</p>
          <h1 className="venus-title">{t.dashboardTitle}</h1>
        </header>

        {activeTab === 'settings' ? (
          <SettingsPanel settings={settings} updateSetting={updateSetting} resetSettings={resetSettings} t={t} />
        ) : (
          <div className="venus-content-layout">
            {/* ── Left column ─────────────────────────────────────── */}
            <div className="venus-left-col">
              <div className={`venus-map-container ${isMapExpanded ? 'expanded' : ''}`}
                role="region"
                aria-label={settings.language === 'pt' ? 'Mapa de densidade' : 'Density map'}
              >
                <div className="venus-map-tools" style={{ left: '20px', right: 'auto' }}>
                  <button
                    className="venus-map-btn toggle-btn"
                    onClick={() => setIsMapExpanded(!isMapExpanded)}
                    aria-label={isMapExpanded ? t.minimizeMap : t.expandMap}
                    aria-pressed={isMapExpanded}
                  >
                    {isMapExpanded ? <Icons.Minimize /> : <Icons.Expand />}
                  </button>
                  <button
                    className={`venus-map-btn ${is2D ? 'active' : ''}`}
                    onClick={() => setIs2D(!is2D)}
                    aria-label={is2D ? t.view3D : t.view2D}
                    aria-pressed={is2D}
                  >
                    {is2D ? <Icons.Map3D /> : <Icons.Map2D />}
                  </button>
                </div>

                <div className="map-inner-wrapper">
                  <DeckGL
                    viewState={viewState}
                    onViewStateChange={({ viewState }) => setViewState(viewState)}
                    controller={true}
                    layers={layers}
                    width="100%"
                    height="100%"
                  >
                    <Map mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" reuseMaps />
                  </DeckGL>
                </div>

                {hoverInfo?.object && (
                  <div
                    role="tooltip"
                    aria-live="polite"
                    style={{ position: 'absolute', zIndex: 20, left: hoverInfo.x, top: hoverInfo.y, transform: 'translate(10px,10px)', pointerEvents: 'none' }}
                  >
                    <div className="tooltip-box">{t.impact}: {formatNumber(hoverInfo.object.elevationValue)}</div>
                  </div>
                )}
              </div>

              {!isMapExpanded && (
                <div className="venus-dashboard-grid" role="region" aria-label={settings.language === 'pt' ? 'Estatísticas' : 'Statistics'}>
                  <div className="venus-card" role="article" aria-label={t.totalAudience}>
                    <div className="venus-card-title">{t.totalAudience}</div>
                    <div className="venus-card-value" aria-live="polite">{formatNumber(stats.totalImpressions)}</div>
                    <div className="venus-card-title" style={{ marginTop: '20px', fontSize: '0.75rem' }}>{t.estimatedPeak}: {stats.peakHour}</div>
                  </div>

                  <div className="venus-card" role="article" aria-label={t.flow24h}>
                    <div className="venus-card-title">{t.flow24h}</div>
                    <div style={{ height: '140px' }}>
                      <ResponsiveContainer>
                        <AreaChart data={stats.hourlyChartData}>
                          <XAxis dataKey="hour" hide />
                          <Tooltip formatter={(val) => formatNumber(val)} />
                          <Area type="monotone" dataKey="value" stroke={chartColors.primary} fill={chartColors.primary + '22'} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="venus-card" style={{ gridColumn: 'span 2' }} role="article" aria-label={t.districtDist}>
                    <div className="venus-card-title">{t.districtDist}</div>
                    <div style={{ height: '200px' }}>
                      <ResponsiveContainer>
                        <BarChart data={stats.topBairros} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={150} fontSize={10} axisLine={false} tickLine={false} />
                          <Tooltip formatter={(val) => formatNumber(val)} />
                          <Bar dataKey="value" fill={chartColors.primary} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="venus-card" role="article" aria-label={t.socialClass}>
                    <div className="venus-card-title">{t.socialClass}</div>
                    <div style={{ height: '220px' }}>
                      <ResponsiveContainer>
                        <BarChart data={Object.entries(stats.categoryStats.classe).map(([k, v]) => ({ name: k, value: Math.floor(v) }))}>
                          <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                          <Tooltip formatter={(val) => formatNumber(val)} />
                          <Bar dataKey="value" fill={chartColors.secondary} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="venus-card" role="article" aria-label={t.gender}>
                    <div className="venus-card-title">{t.gender}</div>
                    <div style={{ height: '220px' }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={Object.entries(stats.categoryStats.genero).map(([k, v]) => ({
                              name: k === 'M' ? (settings.language === 'pt' ? 'Masc' : 'Male') : (settings.language === 'pt' ? 'Fem' : 'Female'),
                              value: Math.floor(v),
                            }))}
                            innerRadius={40} outerRadius={65} dataKey="value" label={renderPieLabel}
                          >
                            <Cell fill={chartColors.primary} />
                            <Cell fill={chartColors.secondary} />
                          </Pie>
                          <Tooltip formatter={(val) => formatNumber(val)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
              <div style={{ height: '120px' }} />
            </div>

            {/* ── Right column – Filters ───────────────────────────── */}
            <aside className="venus-right-col" style={{ paddingBottom: '100px' }} aria-label={t.publicFilters}>
              <h2 className="venus-filters-title">{t.publicFilters}</h2>

              <div className="venus-filter-group" style={{ background: chartColors.primary + '11', borderColor: chartColors.primary + '44' }}>
                <label className="venus-checkbox" style={{ fontWeight: 700, color: chartColors.primary }}>
                  <input
                    type="checkbox"
                    checked={onlyRelevant}
                    onChange={(e) => setOnlyRelevant(e.target.checked)}
                    aria-label={t.onlyRelevant}
                  />
                  {t.onlyRelevant}
                </label>
              </div>

              <div className="venus-filter-group">
                <div className="venus-filter-label" id="filter-idade">{t.ageRange}</div>
                <div className="venus-checkbox-grid" role="group" aria-labelledby="filter-idade">
                  {FILTER_CONFIG.idade.map(opt => (
                    <label key={opt} className="venus-checkbox">
                      <input type="checkbox" checked={filters.idade.includes(opt)} onChange={() => toggleFilter('idade', opt)} aria-label={opt} />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div className="venus-filter-group">
                <div className="venus-filter-label" id="filter-genero">{t.genderLabel}</div>
                <div className="venus-checkbox-grid" role="group" aria-labelledby="filter-genero">
                  {FILTER_CONFIG.genero.map(opt => (
                    <label key={opt.id} className="venus-checkbox">
                      <input type="checkbox" checked={filters.genero.includes(opt.id)} onChange={() => toggleFilter('genero', opt.id)} aria-label={opt.id === 'M' ? t.male : t.female} />
                      {opt.id === 'M' ? t.male : t.female}
                    </label>
                  ))}
                </div>
              </div>

              <div className="venus-filter-group">
                <div className="venus-filter-label" id="filter-classe">{t.socialClassLabel}</div>
                <div className="venus-checkbox-grid" role="group" aria-labelledby="filter-classe">
                  {FILTER_CONFIG.classe_social.map(opt => (
                    <label key={opt} className="venus-checkbox">
                      <input type="checkbox" checked={filters.classe_social.includes(opt)} onChange={() => toggleFilter('classe_social', opt)} aria-label={`Classe ${opt}`} />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div className="venus-filter-group">
                <div className="venus-filter-label" id="filter-horario">{t.hoursLabel}</div>
                <div className="venus-hour-grid" role="group" aria-labelledby="filter-horario">
                  {FILTER_CONFIG.horario.map(h => (
                    <label key={h} className="venus-checkbox">
                      <input type="checkbox" checked={filters.horario.includes(h)} onChange={() => toggleFilter('horario', h)} aria-label={`${h}:00`} />
                      {h}h
                    </label>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
