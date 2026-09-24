import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { UiProvider } from './context/UiContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <UiProvider>
        <AuthProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              className: '!bg-ink-800 !text-ink-100 !border !border-ink-600',
              duration: 3500,
              success: { iconTheme: { primary: '#f53d3d', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </UiProvider>
    </BrowserRouter>
  </React.StrictMode>
);