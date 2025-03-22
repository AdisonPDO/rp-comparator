// LoadingOverlay.js
import React from 'react';

const LoadingOverlay = ({ loading, error, children }) => {
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }
  
  return children;
};

export default LoadingOverlay;