import React, { useState, useEffect, useMemo } from 'react';
import { HexagonLayer } from 'deck.gl';
import Papa from 'papaparse';
import 'maplibre-gl/dist/maplibre-gl.css';
import './Dashboard.css';

import {
  T, DEFAULT_SETTINGS, COLOR_RANGES, CHART_COLORS,
  FILTER_CONFIG, INITIAL_FILTERS, INITIAL_VIEW_STATE, parseTarget,
} from './constants';
import Sidebar from './components/Sidebar';
import SettingsPanel from './components/SettingsPanel';
import MapView from './components/MapView';
import StatsGrid from './components/StatsGrid';
import FilterPanel from './components/FilterPanel';

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
      <a href="#main-content" className="skip-link">{t.skipToContent}</a>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} t={t} language={settings.language} />

      <main className="venus-main" id="main-content" tabIndex="-1">
        <header className="venus-header">
          <p className="venus-greeting">{t.hello}</p>
          <h1 className="venus-title">{t.dashboardTitle}</h1>
        </header>

        {activeTab === 'settings' ? (
          <SettingsPanel settings={settings} updateSetting={updateSetting} resetSettings={resetSettings} t={t} />
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
