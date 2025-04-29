import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './RacketComparisonTabs.css';
import reportWebVitals from './reportWebVitals';
import RacketComparisonTabs from "./view/RacketComparisonTabs";
import { RacketProvider } from './contexts/RacketContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RacketProvider>
      <RacketComparisonTabs />
    </RacketProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(//console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
