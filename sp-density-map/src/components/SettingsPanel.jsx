import React from 'react';
import Icons from './Icons';
import { COLOR_RANGES } from '../constants';

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

export default SettingsPanel;
