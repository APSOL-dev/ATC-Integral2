import React from 'react';

const KpiCard = ({ label, value, trend, trendUp, colorClass }) => {
  return (
    <div className={`kpi-card ${colorClass}`} style={{ borderBottomColor: `var(--${colorClass})` }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      <div className={`kpi-trend ${trendUp ? 'trend-up' : 'trend-down'}`} style={{ color: trendUp ? 'var(--green)' : 'var(--magenta)' }}>
        {trendUp ? '↑' : '↓'} {trend} vs mes ant.
      </div>
    </div>
  );
};

export default KpiCard;
