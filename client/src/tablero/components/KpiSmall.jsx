import React from 'react';

const KpiSmall = ({ label, value, color }) => (
  <div className="kpi-small" style={color ? { borderBottom: `4px solid ${color}` } : {}}>
    <div className="kpi-small-label">{label}</div>
    <div className="kpi-small-value">{value}</div>
  </div>
);

export default KpiSmall;
