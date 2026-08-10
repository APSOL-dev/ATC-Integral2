// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { install } from '@twind/core'
import twindConfig from './twind.config.js'
import App from './App.jsx'
import './index.css'

// Install Twind (runtime CSS-in-JS)
install(twindConfig)

// Intercept global fetch calls to automatically inject JWT Authorization header
const originalFetch = window.fetch;
window.fetch = async (url, options = {}) => {
  const storedUser = localStorage.getItem('atc_user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user?.token) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${user.token}`
        };
      }
    } catch (e) {
      console.error('Error parsing user token for fetch:', e);
    }
  }
  return originalFetch(url, options);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
