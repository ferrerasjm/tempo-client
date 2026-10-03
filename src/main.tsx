import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CafeProvider } from './state/CafeContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><CafeProvider><App /></CafeProvider></BrowserRouter></React.StrictMode>,
);
