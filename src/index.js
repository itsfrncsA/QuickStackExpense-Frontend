import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Additional DevTools protection
if (typeof window !== 'undefined') {
  // Prevent console.log from being used in production
  if (process.env.NODE_ENV === 'production') {
    console.log = function() {};
    console.info = function() {};
    console.warn = function() {};
    console.error = function() {};
    console.debug = function() {};
  }
  
  // Detect DevTools via window size
  const element = new Image();
  Object.defineProperty(element, 'id', {
    get: function() {
      document.body.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #1a1a2e; color: white; font-family: Arial, sans-serif; text-align: center; padding: 20px;"><div><h1>Access Denied</h1><p>Developer tools are not allowed on this website.</p><p>Please close DevTools to continue.</p><button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">Retry</button></div></div>';
    }
  });
  
  setInterval(() => {
    console.log(element);
  }, 1000);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
