import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';

const SearchableSelect = ({ label, options, value, onChange, multiple = false, minWidth = '180px' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredOptions = options.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSelected = (option) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(option);
    }
    return value === option;
  };

  const handleSelect = (option) => {
    if (multiple) {
      const newValue = Array.isArray(value) ? [...value] : [];
      if (newValue.includes(option)) {
        onChange(newValue.filter(v => v !== option));
      } else {
        onChange([...newValue, option]);
      }
    } else {
      onChange(option);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleReset = (e) => {
    e.stopPropagation();
    onChange(multiple ? [] : '');
    setSearchTerm('');
  };

  const getDisplayValue = () => {
    if (multiple) {
      if (!Array.isArray(value) || value.length === 0) return label;
      if (value.length === 1) return value[0];
      return `${value.length} seleccionados`;
    }
    return value || label;
  };

  const hasValue = multiple ? (Array.isArray(value) && value.length > 0) : !!value;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', minWidth }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          border: isOpen ? '1px solid var(--cyan)' : '1px solid #CBD5E1',
          background: '#FFF',
          fontFamily: 'Inter',
          fontSize: '13px',
          color: hasValue ? '#334155' : '#64748B',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '0 0 0 3px rgba(0, 173, 239, 0.1)' : 'none',
          userSelect: 'none'
        }}
      >
        <span style={{ 
          flex: 1,
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          marginRight: '8px',
          fontWeight: hasValue ? '600' : '400'
        }}>
          {getDisplayValue()}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {hasValue && (
            <div className="reset-hover" onClick={handleReset} style={{ display: 'flex' }}>
               <X size={14} style={{ color: '#94A3B8', transition: 'color 0.2s' }} />
            </div>
          )}
          <ChevronDown 
            size={16} 
            style={{ 
              color: '#94A3B8', 
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }} 
          />
        </div>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          zIndex: 1000,
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
          animation: 'selectSlideIn 0.2s ease-out',
          minWidth: '220px'
        }}>
          <div style={{ 
            padding: '12px', 
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#F8FAFC'
          }}>
            <Search size={14} style={{ color: '#94A3B8' }} />
            <input 
              type="text"
              autoFocus
              placeholder="Escriba para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '13px',
                fontFamily: 'Inter',
                color: '#334155'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '4px' }} className="custom-scrollbar">
            {multiple && filteredOptions.length > 0 && (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  if (Array.isArray(value) && value.length === options.length) {
                    onChange([]);
                  } else {
                    onChange([...options]);
                  }
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: 'var(--cyan)',
                  borderRadius: '6px',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  background: (Array.isArray(value) && value.length === options.length) ? 'rgba(0, 173, 239, 0.05)' : 'transparent'
                }}
              >
                {(Array.isArray(value) && value.length === options.length) ? 'Desmarcar todos' : 'Seleccionar todos'}
              </div>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, idx) => {
                const selected = isSelected(option);
                return (
                  <div 
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); handleSelect(option); }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: selected ? '#0F172A' : '#475569',
                      background: selected ? 'rgba(0, 173, 239, 0.08)' : 'transparent',
                      transition: 'all 0.15s ease',
                      marginBottom: '2px'
                    }}
                    onMouseOver={(e) => { if (!selected) e.currentTarget.style.background = '#F1F5F9'; }}
                    onMouseOut={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {multiple && (
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: selected ? 'none' : '2px solid #CBD5E1',
                        background: selected ? 'var(--cyan)' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}>
                        {selected && <Check size={12} color="white" strokeWidth={3} />}
                      </div>
                    )}
                    <span style={{ fontWeight: selected ? '600' : '400', flexGrow: 1 }}>{option}</span>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes selectSlideIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reset-hover:hover svg {
          color: var(--magenta) !important;
          transform: scale(1.2);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}} />
    </div>
  );
};

export default SearchableSelect;
