import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// GLOBAL STYLES
// Importing this here ensures the "Pixel Theme" and Fonts load 
// before anything else appears on the screen.
import './ui/PixelTheme.css'; 

// --- 1. SAFETY CHECK ---
// We try to find the <div id="root"></div> in your index.html
const rootElement = document.getElementById('root');

if (!rootElement) {
  // If missing, we stop everything and log a critical error.
  // This helps debug configuration issues immediately.
  throw new Error("🚨 CRITICAL ERROR: Could not find the 'root' element in index.html. Please ensure your HTML file has a <div id='root'></div>.");
}

// --- 2. REACT 18 BOOTSTRAP ---
// We use 'createRoot' (New in React 18) for better performance and concurrent features.
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    {/* Strict Mode helps development by double-invoking effects 
       to catch memory leaks and unsafe lifecycles. 
    */}
    <App />
  </React.StrictMode>
);