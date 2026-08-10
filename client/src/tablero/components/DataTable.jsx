import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

const DataTable = ({ title, columns, data, type, onSearch, initialSearch = '' }) => {
  const [localSearch, setLocalSearch] = useState(initialSearch);

  useEffect(() => {
    setLocalSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== initialSearch && onSearch) {
        onSearch(localSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch]);

  return (
    <div className="data-table-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div className="visual-title" style={{ marginBottom: 0 }}>{title}</div>
        {onSearch && (
          <div style={{ position: 'relative', width: '220px' }}>
            <input 
              type="text"
              placeholder="Buscar producto..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 32px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                fontSize: '12px',
                fontFamily: 'Inter',
                outline: 'none',
                transition: 'border-color 0.2s',
                background: '#F8FAFC'
              }}
            />
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '8px' }} />
          </div>
        )}
      </div>
      <table>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {type === 'clients' ? (
                <>
                  <td><strong>{row.name}</strong></td>
                  <td>{row.location}</td>
                  <td>{row.orders}</td>
                  <td>{row.total}</td>
                  <td>
                    <span className={`badge badge-${getStatusColor(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                </>
              ) : (
                <>
                  <td>{row.name}</td>
                  <td>{row.sales}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flexGrow: 1, height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: row.percent, height: '100%', background: '#00ADEF' }}></div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{row.percent}</span>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'Platinum': return 'magenta';
    case 'VIP': return 'cyan';
    default: return 'green';
  }
};

export default DataTable;
/* Note: Added some inline styles for the progress bar to keep it simple and effective */
