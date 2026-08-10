import React, { useState, useEffect } from 'react'
import Dashboard from './Dashboard'
import Login from './pages/Login'
import './index.css'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('atc_session');
    if (session === 'active') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('atc_session', 'active');
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Dashboard />
  )
}

export default App
