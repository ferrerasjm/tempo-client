import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CafeProvider } from './state/CafeContext';
import { StudyDraftProvider } from './state/StudyDraftContext';
import './styles.css';
import './experience.css';
import './entrance.css';
import './study.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><CafeProvider><StudyDraftProvider><App /></StudyDraftProvider></CafeProvider></BrowserRouter></React.StrictMode>,
);
