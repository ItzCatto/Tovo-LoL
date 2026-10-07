import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Boots your application isolated from public metadata engines
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
