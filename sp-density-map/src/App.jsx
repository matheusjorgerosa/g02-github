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
  Settings: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Logout: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
  Expand: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>,
  Minimize: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6m0 0v6m0-6l-7 7m17-7h-6m0 0v6m0-6l7 7M20 10h-6m0 0V4m0 6l7-7M4 10h6m0 0V4m0 6l-7-7"></path></svg>
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

const parseTarget = (str) => {
  if (!str) return null;
  try {
    return JSON.parse(str.replace(/'/g, '"'));
  } catch (e) {
    return null;
  }
};

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [onlyRelevant, setOnlyRelevant] = useState(false);

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
    const mapItems = [];

    // Threshold for 'relevancy' - points with very low impact relative to average
    const relevancyThreshold = onlyRelevant ? 150 : 0; 

    data.forEach(d => {
      if (!d.targetObj) return;

      const ageMult = filters.idade.reduce((s, v) => s + (d.targetObj.idade?.[v] || 0), 0);
      const genMult = filters.genero.reduce((s, v) => s + (d.targetObj.genero?.[v] || 0), 0);
      const clsMult = filters.classe_social.reduce((s, v) => s + (d.targetObj.classe_social?.[v] || 0), 0);
      
      const multiplier = ageMult * genMult * clsMult;
      const baseVal = d.uniques * multiplier;

      if (baseVal > relevancyThreshold) {
        hourlyFullMap[d.hour] += baseVal;
        
        const baseForClass = d.uniques * ageMult * genMult;
        Object.entries(d.targetObj.classe_social || {}).forEach(([k, v]) => {
          if (activeClasses.has(k)) categoryStats.classe[k] += (baseForClass * v);
        });

        const baseForGen = d.uniques * ageMult * clsMult;
        Object.entries(d.targetObj.genero || {}).forEach(([k, v]) => {
          if (activeGens.has(k)) categoryStats.genero[k] += (baseForGen * v);
        });

        const baseForAge = d.uniques * genMult * clsMult;
        Object.entries(d.targetObj.idade || {}).forEach(([k, v]) => {
          if (activeAges.has(k)) categoryStats.idade[k] += (baseForAge * v);
        });

        if (activeHours.has(d.hour)) {
          totalImpressions += baseVal;
          mapItems.push({ ...d, displayValue: baseVal });
          
          const bairro = d.endereco || 'Outros';
          bairroMap[bairro] = (bairroMap[bairro] || 0) + baseVal;
        }
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
  }, [data, filters]);

  const toggleFilter = (cat, val) => {
    setFilters(p => {
      const cur = p[cat];
      const next = cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val];
      return { ...p, [cat]: next };
    });
  };

  const layers = [
    new HexagonLayer({
      id: 'heatmap',
      data: filteredData,
      pickable: true,
      extruded: true,
      radius: 160,
      elevationScale: 10,
      getPosition: d => d.coordinates,
      getElevationWeight: d => d.displayValue,
      aggregation: 'SUM',
      colorRange: [[255,255,178],[254,204,92],[253,141,60],[240,59,32],[189,0,38]],
      onHover: info => setHoverInfo(info),
      updateTriggers: { getElevationWeight: [filters] }
    })
  ];

  const renderPieLabel = ({ name, percent }) => `${name} (${Math.floor(percent * 100)}%)`;

  if (loading) return <div className="venus-app" style={{justifyContent: 'center', alignItems: 'center'}}>Carregando...</div>;

  return (
    <div className="venus-app">
      <aside className="venus-sidebar">
        <div className="venus-logo-container">
          <div className="venus-logo-icon">V</div>
          <div className="venus-logo-text-wrapper"><span className="venus-logo-text">VENUS</span></div>
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
          <h1 className="venus-title">Dashboard Vênus</h1>
        </header>

        <div className="venus-content-layout">
          <div className="venus-left-col">
            {/* Mapa com contêiner físico eDeckGL forçado */}
            <div className={`venus-map-container ${isMapExpanded ? 'expanded' : ''}`} style={{ minHeight: '480px' }}>
              <div className="venus-map-tools">
                <button className="venus-map-btn" onClick={() => setIsMapExpanded(!isMapExpanded)}>
                  {isMapExpanded ? <Icons.Minimize/> : <Icons.Expand/>}
                </button>
              </div>
              <DeckGL 
                initialViewState={INITIAL_VIEW_STATE} 
                controller={true} 
                layers={layers}
                style={{ width: '100%', height: '100%', position: 'absolute' }}
              >
                <Map mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json" reuseMaps />
              </DeckGL>
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
                  <div className="venus-card-title" style={{marginTop:'20px', fontSize:'0.75rem'}}>Pico: {stats.peakHour}</div>
                </div>
                <div className="venus-card">
                  <div className="venus-card-title">Fluxo 24h</div>
                  <div style={{height:'140px'}}><ResponsiveContainer>
                    <AreaChart data={stats.hourlyChartData}><XAxis dataKey="hour" hide/><Tooltip formatter={(val) => formatNumber(val)}/><Area type="monotone" dataKey="value" stroke="#4f46e5" fill="#4f46e522" strokeWidth={2}/></AreaChart>
                  </ResponsiveContainer></div>
                </div>
                <div className="venus-card" style={{gridColumn: 'span 2'}}>
                  <div className="venus-card-title">Distribuição por Bairro (Endereço)</div>
                  <div style={{height:'200px'}}><ResponsiveContainer>
                    <BarChart data={stats.topBairros} layout="vertical">
                      <XAxis type="number" hide/><YAxis dataKey="name" type="category" width={150} fontSize={10} axisLine={false} tickLine={false}/><Tooltip formatter={(val) => formatNumber(val)}/><Bar dataKey="value" fill="#4f46e5" radius={[0,4,4,0]}/>
                    </BarChart>
                  </ResponsiveContainer></div>
                </div>
                <div className="venus-card">
                  <div className="venus-card-title">Classe Social</div>
                  <div style={{height:'220px'}}><ResponsiveContainer>
                    <BarChart data={Object.entries(stats.categoryStats.classe).map(([k,v])=>({name:k, value:Math.floor(v)}))}>
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false}/><Tooltip formatter={(val) => formatNumber(val)}/><Bar dataKey="value" fill="#818cf8" radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer></div>
                </div>
                <div className="venus-card">
                  <div className="venus-card-title">Gênero</div>
                  <div style={{height:'220px'}}><ResponsiveContainer>
                    <PieChart><Pie data={Object.entries(stats.categoryStats.genero).map(([k,v])=>({name:k==='M'?'Masc':'Fem', value:Math.floor(v)}))} innerRadius={40} outerRadius={65} dataKey="value" label={renderPieLabel}><Cell fill="#4f46e5"/><Cell fill="#ec4899"/></Pie><Tooltip formatter={(val) => formatNumber(val)}/></PieChart>
                  </ResponsiveContainer></div>
                </div>
              </div>
            )}
            
            {/* Rodapé Físico */}
            <div style={{ height: '120px', width: '100%', flexShrink: 0 }}></div>
          </div>

          <aside className="venus-right-col">
            <h2 className="venus-filters-title">Filtros de Público</h2>
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
            {/* Rodapé Lateral */}
            <div style={{ height: '120px', width: '100%' }}></div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
