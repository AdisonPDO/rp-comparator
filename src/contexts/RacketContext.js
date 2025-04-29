// RacketContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/apiService';

// Création du contexte
const RacketContext = createContext(null);

// Hook personnalisé pour utiliser le contexte des raquettes
export const useRackets = () => {
  const context = useContext(RacketContext);
  if (!context) {
    throw new Error('useRackets doit être utilisé à l\'intérieur d\'un RacketProvider');
  }
  return context;
};

// Fournisseur de contexte pour les données de raquettes
export const RacketProvider = ({ children }) => {
  // États pour stocker les données
  const [rackets, setRackets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Charger toutes les raquettes au démarrage
  useEffect(() => {
    loadAllRackets();
  }, []);
  
  // Fonction pour charger toutes les raquettes
  const loadAllRackets = async () => {
    try {
      setLoading(true);
      setError(null);
      // Initialise un tableau vide au lieu de charger toutes les raquettes
      setRackets([]);
      setLoading(false);
      ////console.log('Chargement de raquettes désactivé, tableau initialisé vide');
    } catch (err) {
      setError('Impossible de charger les données depuis l\'API. Veuillez réessayer plus tard.');
      //console.error('Erreur lors du chargement des raquettes depuis l\'API:', err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour rechercher des raquettes
  const searchRackets = async (query, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.searchRackets(query, filters);
      return data;
    } catch (err) {
      console.error('Erreur de recherche:', err.message);
      setError('Erreur lors de la recherche de raquettes.');
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour obtenir les meilleures raquettes
  const getTopRackets = async (category, limit = 3) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getTopRackets(category, limit);
      return data;
    } catch (err) {
      console.error('Erreur top raquettes:', err.message);
      setError('Erreur lors de la récupération des meilleures raquettes.');
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour obtenir des raquettes similaires
  const getSimilarRackets = async (racketId, limit = 3) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getSimilarRackets(racketId, limit);
      
      // Vérifier que les données sont au format attendu
      if (!data || typeof data !== 'object') {
        console.error('Format de réponse inattendu pour getSimilarRackets:', data);
        return { referenceRacket: null, similarRackets: [] };
      }
      
      return data;
    } catch (err) {
      console.error('Erreur raquettes similaires:', err.message);
      setError('Erreur lors de la récupération des raquettes similaires.');
      return { referenceRacket: null, similarRackets: [] };
    } finally {
      setLoading(false);
    }
  };
  
  // Rafraîchit les données
  const refreshData = () => {
    apiService.clearCache();
    loadAllRackets();
  };
  
  // Valeur du contexte
  const value = {
    rackets,
    loading,
    error,
    searchRackets,
    getTopRackets,
    getSimilarRackets,
    refreshData
  };
  
  return (
    <RacketContext.Provider value={value}>
      {children}
    </RacketContext.Provider>
  );
};

export default RacketContext;