import React from 'react';
import {
  XAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, AreaChart, Area, Cell, YAxis
} from 'recharts';
import { formatNumber, renderPieLabel } from '../constants';

function StatsGrid({ stats, chartColors, t, language }) {
  return (
    <div className="venus-dashboard-grid" role="region" aria-label={language === 'pt' ? 'Estatísticas' : 'Statistics'}>
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
                  name: k === 'M' ? (language === 'pt' ? 'Masc' : 'Male') : (language === 'pt' ? 'Fem' : 'Female'),
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
  );
}

export default StatsGrid;
