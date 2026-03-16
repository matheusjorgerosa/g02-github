import React, { useRef, useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import Icons from './Icons';
import { formatNumber } from '../constants';

const MAP_STYLE_LIGHT = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const MAP_STYLE_DARK  = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

function MapView({ viewState, setViewState, layers, hoverInfo, isMapExpanded, setIsMapExpanded, is2D, setIs2D, t, language, darkMode, highContrast }) {
  const mapStyle = (darkMode || highContrast) ? MAP_STYLE_DARK : MAP_STYLE_LIGHT;

  const containerRef = useRef(null);
  const [deckDims, setDeckDims] = useState({ width: '100%', height: '100%' });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      setDeckDims({ width: container.offsetWidth, height: container.offsetHeight });
    };

    measure();

    const mainEl = container.closest('.venus-main');
    const onTransitionEnd = (e) => {
      if (e.propertyName === 'padding-left') measure();
    };
    mainEl?.addEventListener('transitionend', onTransitionEnd);
    window.addEventListener('resize', measure);

    return () => {
      mainEl?.removeEventListener('transitionend', onTransitionEnd);
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`venus-map-container ${isMapExpanded ? 'expanded' : ''}`}
      role="region"
      aria-label={language === 'pt' ? 'Mapa de densidade' : 'Density map'}
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
          width={deckDims.width}
          height={deckDims.height}
        >
          <Map mapStyle={mapStyle} reuseMaps />
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
  );
}

export default MapView;
