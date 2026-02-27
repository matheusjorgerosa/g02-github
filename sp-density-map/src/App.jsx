import React, { useState, useEffect, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { HexagonLayer } from 'deck.gl';
import { Map } from 'react-map-gl/maplibre';
import Papa from 'papaparse';
import 'maplibre-gl/dist/maplibre-gl.css';
import FilterPanel from './components/FilterPanel';

// Constants
const ALL_AGES = ['18-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+'];
const ALL_GENDERS = ['F', 'M'];
const ALL_CLASSES = ['A', 'B1', 'B2', 'C1', 'C2', 'DE'];

const INITIAL_VIEW_STATE = {
  longitude: -46.6333,
  latitude: -23.5505,
  zoom: 11,
  minZoom: 5,
  maxZoom: 16,
  pitch: 45,
  bearing: 0
};

// Start empty
const INITIAL_FILTERS = {
  idade: [],
  genero: [],
  classe_social: []
};

const tooltipStyle = {
  position: 'absolute',
  zIndex: 1,
  pointerEvents: 'none',
  backgroundColor: '#1f2937',
  color: '#f3f4f6',
  padding: '8px 12px',
  borderRadius: '4px',
  fontSize: '12px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  fontFamily: 'system-ui, sans-serif'
};

const parseTarget = (str) => {
  if (!str) return null;
  try {
    const jsonStr = str.replace(/'/g, '"');
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
};

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoverInfo, setHoverInfo] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    Papa.parse('/data.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validData = results.data
          .filter(d => d.longitude && d.latitude && !isNaN(Number(d.longitude)))
          .map(d => ({
            ...d,
            coordinates: [Number(d.longitude), Number(d.latitude)],
            uniques: Number(d.uniques) || 0,
            targetObj: parseTarget(d.target)
          }));
        setData(validData);
        setLoading(false);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setLoading(false);
      }
    });
  }, []);

  const filteredData = useMemo(() => {
    if (!data.length) return [];

    // Determine active filters
    const activeAges = filters.idade;
    const activeGenders = filters.genero;
    const activeClasses = filters.classe_social;

    return data.map(d => {
      let multiplier = 0;

      if (d.targetObj) {
        // 1. Calculate % of selected Ages
        let agePct = 0;
        activeAges.forEach(age => {
          if (d.targetObj.idade && d.targetObj.idade[age]) {
            agePct += d.targetObj.idade[age];
          }
        });

        // 2. Calculate % of selected Genders
        let genderPct = 0;
        activeGenders.forEach(gen => {
          if (d.targetObj.genero && d.targetObj.genero[gen]) {
            genderPct += d.targetObj.genero[gen];
          }
        });

        // 3. Calculate % of selected Classes
        let classPct = 0;
        activeClasses.forEach(cls => {
          if (d.targetObj.classe_social && d.targetObj.classe_social[cls]) {
            classPct += d.targetObj.classe_social[cls];
          }
        });

        // The user requested an additive logic across all selections (Union / "manter e somar").
        // Instead of multiplying probabilities (Intersection), we sum them and cap at 1.0 (100%).
        const combinedPct = agePct + genderPct + classPct;
        multiplier = Math.min(1.0, combinedPct);
      }

      return {
        ...d,
        displayValue: d.uniques * multiplier
      };
    }).filter(d => d.displayValue > 0);
  }, [data, filters]);

  const layers = [
    new HexagonLayer({
      id: 'heatmap',
      data: filteredData,
      pickable: true,
      extruded: true,
      radius: 200,
      
      // FIXED SCALE (Normalized)
      // Range: [0, 50000] (meters)
      // Scale: 0.05 -> Max visual height approx 2500 units
      elevationScale: 0.05, 
      elevationDomain: [0, 50000],
      elevationRange: [0, 50000],
      
      getPosition: d => d.coordinates,
      getElevationWeight: d => d.displayValue,
      aggregation: 'SUM',
      colorRange: [
        [1, 152, 189],
        [73, 227, 206],
        [216, 254, 181],
        [254, 237, 177],
        [254, 173, 84],
        [209, 55, 78]
      ],
      transitions: {
        elevationScale: 1000,
        getElevationWeight: 1000
      },
      onHover: info => setHoverInfo(info),
      updateTriggers: {
        getElevationWeight: [filters]
      }
    })
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#111', 
        color: 'white',
        fontFamily: 'sans-serif'
      }}>
        Carregando Dados...
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        getTooltip={({object}) => object && `Contagem Ponderada: ${Math.round(object.elevationValue)}`}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
          reuseMaps
        />
      </DeckGL>
      
      <FilterPanel 
        filters={filters} 
        onFilterChange={setFilters}
        isOpen={isPanelOpen}
        togglePanel={() => setIsPanelOpen(!isPanelOpen)}
      />

      {hoverInfo && hoverInfo.object && (
        <div style={{...tooltipStyle, left: hoverInfo.x, top: hoverInfo.y}}>
          <div><strong>Público Est.:</strong> {Math.round(hoverInfo.object.elevationValue).toLocaleString()}</div>
          <div><strong>Pontos:</strong> {hoverInfo.object.points?.length || 0}</div>
        </div>
      )}

      <div style={{
        position: 'absolute', 
        top: 20, 
        left: 20, 
        background: 'rgba(0,0,0,0.7)', 
        color: 'white', 
        padding: '15px', 
        borderRadius: '8px',
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        <h2 style={{margin: '0 0 10px 0', fontSize: '18px'}}>Densidade de Fluxo de São Paulo</h2>
        <p style={{margin: 0, fontSize: '14px', opacity: 0.8}}>
          Segure <strong>Ctrl</strong> + arraste para inclinar.
        </p>
      </div>
    </div>
  );
}

export default App;
