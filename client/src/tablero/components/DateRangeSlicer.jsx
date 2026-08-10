import React, { useState, useEffect, useMemo } from 'react';
import { Calendar } from 'lucide-react';

const DateRangeSlicer = ({ value, onChange, compact = false }) => {
  const { start, end } = value || { start: '', end: '' };

  const [localStart, setLocalStart] = useState(start);
  const [localEnd, setLocalEnd] = useState(end);

  // Sync local state when props change
  useEffect(() => {
    setLocalStart(start);
  }, [start]);

  useEffect(() => {
    setLocalEnd(end);
  }, [end]);

  const bounds = useMemo(() => {
    try {
      const today = new Date();
      const minDate = new Date(today.getFullYear() - 1, today.getMonth(), 1); 
      const maxDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      return { min: minDate.getTime(), max: maxDate.getTime() };
    } catch (e) {
      return { min: Date.now() - 31536000000, max: Date.now() + 86400000 };
    }
  }, []);

  const range = bounds.max - bounds.min;

  const safeParse = (dateStr, fallback) => {
    if (!dateStr || typeof dateStr !== 'string' || dateStr.length < 1) return fallback;
    try {
      const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'));
      return isNaN(d.getTime()) ? fallback : d.getTime();
    } catch (e) { return fallback; }
  };

  const startVal = useMemo(() => safeParse(localStart, bounds.min), [localStart, bounds.min]);
  const endVal = useMemo(() => safeParse(localEnd, bounds.max), [localEnd, bounds.max]);

  const toStr = (ts) => {
    if (!ts || isNaN(ts)) return '';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) { return ''; }
  };

  // Debounce global update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localStart !== start || localEnd !== end) {
        onChange({ start: localStart, end: localEnd });
      }
    }, 400); // Slightly faster debounce
    return () => clearTimeout(timer);
  }, [localStart, localEnd, onChange, start, end]);

  const handleStartChange = (e) => setLocalStart(e.target.value);
  const handleEndChange = (e) => setLocalEnd(e.target.value);

  const handleStartSlider = (e) => {
    const newVal = parseInt(e.target.value);
    if (!isNaN(newVal)) {
      const clampedVal = Math.min(newVal, endVal - 86400000);
      setLocalStart(toStr(clampedVal));
    }
  };

  const handleEndSlider = (e) => {
    const newVal = parseInt(e.target.value);
    if (!isNaN(newVal)) {
      const clampedVal = Math.max(newVal, startVal + 86400000);
      setLocalEnd(toStr(clampedVal));
    }
  };

  const getPct = (val) => {
    if (range <= 0) return 0;
    return Math.max(0, Math.min(100, ((val - bounds.min) / range) * 100));
  };

  const startPct = getPct(startVal);
  const endPct = getPct(endVal);

  if (compact) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
        background: '#FFF',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        padding: '2px 8px',
        height: '35px',
        boxSizing: 'border-box',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
      }}>
        <Calendar size={13} color="var(--magenta)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', marginRight: '2px', whiteSpace: 'nowrap' }}>Rango:</span>
        <input 
          type="date" 
          value={localStart || ''} 
          onChange={handleStartChange}
          style={{ 
            fontSize: '11px', padding: '2px', borderRadius: '4px', border: 'none', outline: 'none', 
            color: '#1E293B', width: '105px', height: '24px', background: 'transparent', fontFamily: 'Inter'
          }}
        />
        <span style={{ color: '#94A3B8', fontSize: '11px' }}>-</span>
        <input 
          type="date" 
          value={localEnd || ''} 
          onChange={handleEndChange}
          style={{ 
            fontSize: '11px', padding: '2px', borderRadius: '4px', border: 'none', outline: 'none', 
            color: '#1E293B', width: '105px', height: '24px', background: 'transparent', fontFamily: 'Inter'
          }}
        />
      </div>
    );
  }

  return (
    <div className="card" style={{ 
      padding: '8px 12px', 
      background: 'white', 
      borderRadius: '10px',
      border: '1px solid #E2E8F0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      width: '100%',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '8px', fontWeight: 800, color: '#64748B', letterSpacing: '0.05em' }}>RANGO DE FECHA</span>
        <Calendar size={10} color="#E6007E" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
        <input 
          type="date" 
          value={localStart || ''} 
          onChange={handleStartChange}
          style={{ 
            fontSize: '10px', padding: '3px 5px', borderRadius: '4px', border: '1px solid #E2E8F0', outline: 'none', 
            color: '#1E293B', flex: 1, height: '22px'
          }}
        />
        <span style={{ color: '#94A3B8', fontSize: '10px' }}>-</span>
        <input 
          type="date" 
          value={localEnd || ''} 
          onChange={handleEndChange}
          style={{ 
            fontSize: '10px', padding: '3px 5px', borderRadius: '4px', border: '1px solid #E2E8F0', outline: 'none', 
            color: '#1E293B', flex: 1, height: '22px'
          }}
        />
      </div>

      <div style={{ position: 'relative', height: '16px', padding: '0 4px', marginBottom: '2px' }}>
        <div style={{ position: 'absolute', top: '7px', left: '4px', right: '4px', height: '3px', background: '#F1F5F9', borderRadius: '2px' }} />
        <div style={{ position: 'absolute', top: '7px', left: `calc(${startPct}% + 4px)`, right: `calc(${100 - endPct}% + 4px)`, height: '3px', background: 'var(--magenta)', borderRadius: '2px' }} />
        <input type="range" min={bounds.min} max={bounds.max} value={startVal} onChange={handleStartSlider}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '16px', appearance: 'none', background: 'transparent', pointerEvents: 'none', zIndex: 3 }}
          className="dual-range-thumb-small"
        />
        <input type="range" min={bounds.min} max={bounds.max} value={endVal} onChange={handleEndSlider}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '16px', appearance: 'none', background: 'transparent', pointerEvents: 'none', zIndex: 4 }}
          className="dual-range-thumb-small"
        />
      </div>

      <style>{`
        .dual-range-thumb-small::-webkit-slider-thumb {
          appearance: none;
          pointer-events: auto;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          border: 2px solid var(--magenta);
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .dual-range-thumb-small::-moz-range-thumb {
          appearance: none;
          pointer-events: auto;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          border: 2px solid var(--magenta);
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

export default DateRangeSlicer;
