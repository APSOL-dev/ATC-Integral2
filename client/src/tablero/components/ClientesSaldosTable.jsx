import React, { useState, useEffect } from 'react';
import { Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

const ClientesSaldosTable = ({ data, total, onSearch, initialSearch = '', sortConfig, onSortChange }) => {
  const [localSearch, setLocalSearch] = useState(initialSearch);

  // Sync local state if parent reset filters
  useEffect(() => {
    setLocalSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== initialSearch) {
        onSearch(localSearch);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Find max absolute value to calibrate bars reasonably for both pos/neg
  const maxAbsSaldo = Math.max(...data.map(d => Math.abs(d.value)), 1);

  return (
    <div className="card area-saldos" style={{ height: '100%', borderLeft: '6px solid var(--cyan)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <div className="card-title" style={{ marginBottom: 0 }}>Clientes y saldos</div>
        <div style={{ position: 'relative', width: '200px' }}>
          <input 
            type="text"
            placeholder="Buscar por cliente..."
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
      </div>
      <div className="scroll-container" style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '5px' }}>
        <table className="compact-table">
          <thead>
            <tr>
              <th 
                style={{ width: '40%', fontSize: '11px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => onSortChange && onSortChange('name')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Cliente
                  {sortConfig?.sortBy === 'name' ? (
                    sortConfig.sortOrder === 'ASC' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  ) : <ArrowUpDown size={12} color="#CBD5E1" />}
                </div>
              </th>
              <th 
                style={{ textAlign: 'right', fontSize: '11px', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => onSortChange && onSortChange('value')}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  {sortConfig?.sortBy === 'value' ? (
                    sortConfig.sortOrder === 'ASC' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  ) : <ArrowUpDown size={12} color="#CBD5E1" />}
                  Saldo
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx}>
                <td style={{ fontSize: '10px', verticalAlign: 'middle', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                  {item.name}
                </td>
                <td style={{ width: '60%', padding: '4px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                     <div style={{ 
                        flexGrow: 1, 
                        height: '14px', 
                        background: '#e0f2fe', 
                        borderRadius: '2px', 
                        overflow: 'hidden'
                      }}>
                        <div style={{ 
                          width: `${(Math.abs(item.value) / maxAbsSaldo) * 100}%`, 
                          height: '100%', 
                          background: 'var(--cyan)' 
                        }} />
                     </div>
                     <span style={{ fontSize: '10px', fontWeight: '700', minWidth: '75px', textAlign: 'right', fontFamily: 'Outfit', color: '#000000' }}>
                        ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ 
        marginTop: '10px', 
        paddingTop: '10px', 
        borderTop: '2px solid #f1f5f9', 
        display: 'flex', 
        justifyContent: 'space-between',
        fontWeight: '800',
        fontSize: '12px',
        fontFamily: 'Outfit'
      }}>
        <span>TOTAL</span>
        <span style={{ color: '#000000' }}>${total}</span>
      </div>
    </div>
  );
};

export default ClientesSaldosTable;
