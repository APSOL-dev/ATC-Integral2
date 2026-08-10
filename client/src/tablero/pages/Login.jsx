import React, { useState } from 'react';
import { LogIn, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Demo Auth Logic
    setTimeout(() => {
      const lowerUser = username.trim().toLowerCase();
      const cleanPassword = password.trim();
      const validCredentials = {
        'admin': import.meta.env.VITE_TABLERO_ADMIN_PASSWORD || '',
        'eduardo': import.meta.env.VITE_TABLERO_EDUARDO_PASSWORD || '',
        'guillermo': import.meta.env.VITE_TABLERO_GUILLERMO_PASSWORD || '',
        'atc': import.meta.env.VITE_TABLERO_ATC_PASSWORD || ''
      };

      if (validCredentials[lowerUser] && cleanPassword === validCredentials[lowerUser]) {
        onLogin();
      } else {
        setError('Usuario o contraseña incorrectos.');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div style={{ marginBottom: '30px' }}>
          <img src="/logo.png" alt="A TODO COLOR" style={{ height: '60px', marginBottom: '10px' }} />
          <h2 style={{ fontSize: '24px', color: '#1E293B', fontWeight: 700 }}>Bienvenido</h2>
          <p style={{ fontSize: '14px', color: '#64748B' }}>Ingresa tus credenciales de acceso</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ position: 'relative' }}>
            <User size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                outline: 'none',
                fontSize: '14px',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#00ADEF'}
              onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 40px 12px 40px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                outline: 'none',
                fontSize: '14px',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#E6007E'}
              onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p style={{ fontSize: '12px', color: '#EF4444', margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(90deg, #00ADEF, #E6007E)',
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 10px 15px -3px rgba(230, 0, 126, 0.3)',
              transition: 'transform 0.2s, boxShadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 15px 20px -3px rgba(230, 0, 126, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(230, 0, 126, 0.3)';
            }}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <LogIn size={20} />}
            {loading ? 'Validando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ marginTop: '30px', fontSize: '10px', color: '#94A3B8' }}>
          &copy; 2026 Apsol
        </div>
      </div>
    </div>
  );
};

export default Login;
