// src/main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/global.css'; // Global styles
import './styles/components.css'; // Component-specific styles


const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found');
}

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
