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

// Icons
const Icons = {
  Dashboard: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
  Campaign: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20v-4"></path></svg>,
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Logout: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  Expand: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>,
  Minimize: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6m0 0v6m0-6l-7 7m17-7h-6m0 0v6m0-6l7 7M20 10h-6m0 0V4m0 6l7-7M4 10h6m0 0V4m0 6l-7-7"></path></svg>,
  Map2D: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>,
  Map3D: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16.5a2 2 0 0 1-1 1.73l-7 4a2 2 0 0 1-2 0l-7-4a2 2 0 0 1-1-1.73V7.5a2 2 0 0 1 1-1.73l7-4a2 2 0 0 1 2 0l7 4a2 2 0 0 1 1 1.73z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
};

const FILTER_CONFIG = {
  idade: ['18-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+'],
  genero: [{ id: 'M', label: 'Masculino' }, { id: 'F', label: 'Feminino' }],
  classe_social: ['A', 'B1', 'B2', 'C1', 'C2', 'DE'],
  horario: Array.from({length: 24}, (_, i) => i)
};

const INITIAL_FILTERS = {
  idade: [...FILTER_CONFIG.idade],
  genero: ['M', 'F'],
  classe_social: [...FILTER_CONFIG.classe_social],
  horario: [...FILTER_CONFIG.horario]
};

const INITIAL_VIEW_STATE = {
  longitude: -46.6333,
  latitude: -23.5505,
  zoom: 11,
  pitch: 45,
  bearing: 0
};

const formatNumber = (val) => Math.floor(val).toLocaleString('pt-BR');
const renderPieLabel = ({ name, percent }) => `${name} (${Math.floor(percent * 100)}%)`;

const parseTarget = (str) => {
  if (!str) return null;
  try {
    return JSON.parse(str.replace(/'/g, '"'));
  } catch (e) {
    return null;
  }
};

const ELETROMIDIA_COLORS = [
  [255, 230, 210],
  [255, 180, 130],
  [255, 130, 60],
  [255, 85, 0], 
  [200, 65, 0],
  [150, 45, 0]
];

function App() {
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
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validData = results.data
          .filter(d => d.longitude && d.latitude)
          .map(d => ({
            ...d,
            coordinates: [Number(d.longitude), Number(d.latitude)],
            uniques: Number(d.uniques) || 0,
            hour: parseInt(d.impression_hour) || 0,
            targetObj: parseTarget(d.target)
          }));
        setData(validData);
        setLoading(false);
      }
    });
  }, []);

  const { filteredData, stats } = useMemo(() => {
    if (!data.length) return { 
      filteredData: [], 
      stats: { totalImpressions: 0, hourlyChartData: [], peakHour: '00:00', categoryStats: { genero: {F:0, M:0}, idade: {}, classe: {} }, topBairros: [] } 
    };

    const activeHours = new Set(filters.horario);
    const activeGens = new Set(filters.genero);
    const activeClasses = new Set(filters.classe_social);
    const activeAges = new Set(filters.idade);

    let totalImpressions = 0;
    const hourlyFullMap = Array(24).fill(0);
    const categoryStats = { 
      genero: { F: 0, M: 0 }, 
      idade: Object.fromEntries(FILTER_CONFIG.idade.map(k => [k, 0])), 
      classe: Object.fromEntries(FILTER_CONFIG.classe_social.map(k => [k, 0])) 
    };
    const bairroMap = {};
    
    // Step 1: Filter by demographics and calculate values
    const pointsWithFilteredVal = data.map(d => {
      if (!d.targetObj) return { ...d, val: 0 };
      const ageMult = filters.idade.reduce((s, v) => s + (d.targetObj.idade?.[v] || 0), 0);
      const genMult = filters.genero.reduce((s, v) => s + (d.targetObj.genero?.[v] || 0), 0);
      const clsMult = filters.classe_social.reduce((s, v) => s + (d.targetObj.classe_social?.[v] || 0), 0);
      const val = d.uniques * ageMult * genMult * clsMult;
      return { ...d, val, ageMult, genMult, clsMult };
    }).filter(d => d.val > 0);

    // Step 2: Calculate max value for relevancy among VISIBLE points (matching time filter)
    const visiblePoints = pointsWithFilteredVal.filter(d => activeHours.has(d.hour));
    const maxVisibleVal = visiblePoints.length > 0 ? Math.max(...visiblePoints.map(p => p.val)) : 0;
    const relevancyThreshold = onlyRelevant ? (maxVisibleVal * 0.3) : 0; // Cut bottom 30% of peak

    const mapItems = [];

    pointsWithFilteredVal.forEach(d => {
      // Always add to full hourly flow (not affected by time filter or relevancy)
      hourlyFullMap[d.hour] += d.val;
      
      // Stats for demographics (full audience matching demographics)
      const baseForClass = d.uniques * d.ageMult * d.genMult;
      Object.entries(d.targetObj.classe_social || {}).forEach(([k, v]) => {
        if (activeClasses.has(k)) categoryStats.classe[k] += (baseForClass * v);
      });

      const baseForGen = d.uniques * d.ageMult * d.clsMult;
      Object.entries(d.targetObj.genero || {}).forEach(([k, v]) => {
        if (activeGens.has(k)) categoryStats.genero[k] += (baseForGen * v);
      });

      const baseForAge = d.uniques * d.genMult * d.clsMult;
      Object.entries(d.targetObj.idade || {}).forEach(([k, v]) => {
        if (activeAges.has(k)) categoryStats.idade[k] += (baseForAge * v);
      });

      // Filter for Map and Total: must match Time AND Relevancy
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
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { 
      filteredData: mapItems, 
      stats: { 
        totalImpressions: Math.floor(totalImpressions), 
        hourlyChartData, 
        peakHour: `${peakHour.toString().padStart(2, '0')}:00`,
        categoryStats,
        topBairros
      } 
    };
  }, [data, filters, onlyRelevant]);

  const toggleFilter = (cat, val) => {
    setFilters(p => {
      const cur = p[cat];
      const next = cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val];
      return { ...p, [cat]: next };
    });
  };

  useEffect(() => {
    setViewState(prev => ({ 
      ...prev, 
      pitch: is2D ? 0 : 45,
      bearing: is2D ? 0 : prev.bearing 
    }));
  }, [is2D]);

  const layers = [
    new HexagonLayer({
      id: 'heatmap',
      data: filteredData,
      pickable: true,
      extruded: !is2D,
      radius: 200,
      elevationScale: is2D ? 0 : 10,
      getPosition: d => d.coordinates,
      getElevationWeight: d => d.displayValue,
      aggregation: 'SUM',
      colorRange: ELETROMIDIA_COLORS,
      onHover: info => setHoverInfo(info),
      updateTriggers: { 
        getElevationWeight: [filters, onlyRelevant]
      }
    })
  ];

  if (loading) return <div className="venus-app" style={{justifyContent: 'center', alignItems: 'center'}}>Carregando VENUS...</div>;

  return (
    <div className="venus-app">
      <aside className="venus-sidebar">
        <div className="venus-logo-container">
          <img src="/Eletromidia_logo.png" alt="Logo" className="venus-logo-img" />
          <div className="venus-logo-text-wrapper">
            <span className="venus-logo-text">VENUS</span>
            <span className="venus-logo-sub">DASHBOARD</span>
          </div>
        </div>
        <nav className="venus-nav">
          <div className="venus-nav-item active"><span className="nav-icon"><Icons.Dashboard/></span><span className="nav-label">Dashboard</span></div>
          <div className="venus-nav-item disabled"><span className="nav-icon"><Icons.Campaign/></span><span className="nav-label">Campanhas</span></div>
          <div className="venus-nav-item disabled"><span className="nav-icon"><Icons.Settings/></span><span className="nav-label">Ajustes</span></div>
        </nav>
        <div className="venus-logout"><Icons.Logout/><span className="nav-label">Sair</span></div>
      </aside>

      <main className="venus-main">
        <header className="venus-header">
          <p className="venus-greeting">Olá, André!</p>
          <h1 className="venus-title">Dashboard VENUS</h1>
        </header>

        <div className="venus-content-layout">
          <div className="venus-left-col">
            <div className={`venus-map-container ${isMapExpanded ? 'expanded' : ''}`}>
              <div className="venus-map-tools">
                <button className="venus-map-btn toggle-btn" onClick={() => setIsMapExpanded(!isMapExpanded)}>
                  {isMapExpanded ? <Icons.Minimize/> : <Icons.Expand/>}
                </button>
                <button className={`venus-map-btn ${is2D ? 'active' : ''}`} onClick={() => setIs2D(!is2D)}>
                  {is2D ? <Icons.Map3D/> : <Icons.Map2D/>}
                </button>
              </div>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                <DeckGL 
                  viewState={viewState}
                  onViewStateChange={({viewState}) => setViewState(viewState)}
                  controller={true} 
                  layers={layers}
                  width="100%"
                  height="100%"
                >
                  <Map mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" reuseMaps />
                </DeckGL>
              </div>
              {hoverInfo?.object && (
                <div style={{position:'absolute', zIndex:20, left:hoverInfo.x, top:hoverInfo.y, transform:'translate(10px,10px)'}}>
                  <div className="tooltip-box">Impacto: {formatNumber(hoverInfo.object.elevationValue)}</div>
                </div>
              )}
            </div>

            {!isMapExpanded && (
              <div className="venus-dashboard-grid">
                <div className="venus-card">
                  <div className="venus-card-title">Público Total</div>
                  <div className="venus-card-value">{formatNumber(stats.totalImpressions)}</div>
                  <div className="venus-card-title" style={{marginTop:'20px', fontSize:'0.75rem'}}>Pico Estimado: {stats.peakHour}</div>
                </div>
                <div className="venus-card">
                  <div className="venus-card-title">Fluxo 24h</div>
                  <div style={{height:'140px'}}><ResponsiveContainer>
                    <AreaChart data={stats.hourlyChartData}><XAxis dataKey="hour" hide/><Tooltip formatter={(val) => formatNumber(val)}/><Area type="monotone" dataKey="value" stroke="#FF5500" fill="#FF550022" strokeWidth={2}/></AreaChart>
                  </ResponsiveContainer></div>
                </div>
                <div className="venus-card" style={{gridColumn: 'span 2'}}>
                  <div className="venus-card-title">Distribuição por Bairro (Endereço)</div>
                  <div style={{height:'200px'}}><ResponsiveContainer>
                    <BarChart data={stats.topBairros} layout="vertical">
                      <XAxis type="number" hide/><YAxis dataKey="name" type="category" width={150} fontSize={10} axisLine={false} tickLine={false}/><Tooltip formatter={(val) => formatNumber(val)}/><Bar dataKey="value" fill="#FF5500" radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer></div>
                </div>
                <div className="venus-card">
                  <div className="venus-card-title">Classe Social</div>
                  <div style={{height:'220px'}}><ResponsiveContainer>
                    <BarChart data={Object.entries(stats.categoryStats.classe).map(([k,v])=>({name:k, value:Math.floor(v)}))}>
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false}/><Tooltip formatter={(val) => formatNumber(val)}/><Bar dataKey="value" fill="#FF8844" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer></div>
                </div>
                <div className="venus-card">
                  <div className="venus-card-title">Gênero</div>
                  <div style={{height:'220px'}}><ResponsiveContainer>
                    <PieChart><Pie data={Object.entries(stats.categoryStats.genero).map(([k,v])=>({name:k==='M'?'Masc':'Fem', value:Math.floor(v)}))} innerRadius={40} outerRadius={65} dataKey="value" label={renderPieLabel}><Cell fill="#FF5500"/><Cell fill="#FFBB99"/></Pie><Tooltip formatter={(val) => formatNumber(val)}/></PieChart>
                  </ResponsiveContainer></div>
                </div>
              </div>
            )}
            <div style={{ height: '120px' }}></div>
          </div>

          <aside className="venus-right-col" style={{paddingBottom: '100px'}}>
            <h2 className="venus-filters-title">Filtros de Público</h2>
            
            <div className="venus-filter-group" style={{ background: '#FF550011', borderColor: '#FF550044' }}>
              <label className="venus-checkbox" style={{ fontWeight: 700, color: '#FF5500' }}>
                <input 
                  type="checkbox" 
                  checked={onlyRelevant} 
                  onChange={(e) => setOnlyRelevant(e.target.checked)} 
                /> 
                Apenas Bins Relevantes
              </label>
            </div>

            <div className="venus-filter-group">
              <div className="venus-filter-label">Faixa Etária:</div>
              <div className="venus-checkbox-grid">
                {FILTER_CONFIG.idade.map(opt => (
                  <label key={opt} className="venus-checkbox">
                    <input type="checkbox" checked={filters.idade.includes(opt)} onChange={()=>toggleFilter('idade', opt)}/> {opt}
                  </label>
                ))}
              </div>
            </div>
            <div className="venus-filter-group">
              <div className="venus-filter-label">Gênero:</div>
              <div className="venus-checkbox-grid">
                {FILTER_CONFIG.genero.map(opt => (
                  <label key={opt.id} className="venus-checkbox">
                    <input type="checkbox" checked={filters.genero.includes(opt.id)} onChange={()=>toggleFilter('genero', opt.id)}/> {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="venus-filter-group">
              <div className="venus-filter-label">Classe Social:</div>
              <div className="venus-checkbox-grid">
                {FILTER_CONFIG.classe_social.map(opt => (
                  <label key={opt} className="venus-checkbox">
                    <input type="checkbox" checked={filters.classe_social.includes(opt)} onChange={()=>toggleFilter('classe_social', opt)}/> {opt}
                  </label>
                ))}
              </div>
            </div>
            <div className="venus-filter-group">
              <div className="venus-filter-label">Horários (24h):</div>
              <div className="venus-hour-grid">
                {FILTER_CONFIG.horario.map(h => (
                  <label key={h} className="venus-checkbox">
                    <input type="checkbox" checked={filters.horario.includes(h)} onChange={()=>toggleFilter('horario', h)}/>
                    {h}h
                  </label>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
