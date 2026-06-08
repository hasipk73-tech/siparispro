import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { TenantProvider } from './tenant/TenantContext';
import SuperAdminPanel from './superadmin/SuperAdminPanel';
import reportWebVitals from './reportWebVitals';

const isSuperAdmin = window.location.pathname.startsWith('/superadmin');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {isSuperAdmin ? (
      <SuperAdminPanel />
    ) : (
      <TenantProvider>
        <App />
      </TenantProvider>
    )}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
