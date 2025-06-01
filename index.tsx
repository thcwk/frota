
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import { HashRouter } from 'react-router-dom';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter> {/* HashRouter needs to be an ancestor for useNavigate to work within AuthProvider */}
      <App />
    </HashRouter>
  </React.StrictMode>
);