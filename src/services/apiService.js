// apiService.js
import axios from 'axios';
import hmacAuth from './hmacAuth';

// Cache simple pour stocker les résultats des requêtes fréquentes
const apiCache = {
  data: new Map(),
  
  // Ajoute ou met à jour un élément dans le cache avec TTL (expiration)
  set(key, value, ttlMinutes = 5) {
    const expiresAt = Date.now() + (ttlMinutes * 60 * 1000);
    this.data.set(key, {
      value,
      expiresAt
    });
  },
  
  // Récupère un élément du cache s'il existe et n'est pas expiré
  get(key) {
    if (!this.data.has(key)) return null;
    
    const cachedItem = this.data.get(key);
    if (cachedItem.expiresAt < Date.now()) {
      this.data.delete(key);
      return null;
    }
    
    return cachedItem.value;
  },
  
  // Vide le cache
  clear() {
    this.data.clear();
  },
  
  // Supprime une clé spécifique
  remove(key) {
    this.data.delete(key);
  }
};

/**
 * Service API pour les raquettes de padel
 */
class ApiService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
    console.log('API URL configurée:', this.baseUrl);
    
    this.axios = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      // Accepter tous les codes de statut pour pouvoir gérer les erreurs
      validateStatus: () => true,
      // Configuration CORS
      withCredentials: false,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    // Intercepte les réponses pour gérer les erreurs globalement
    this.axios.interceptors.response.use(
      response => {
        // Si le statut n'est pas 2xx, on rejette la promesse
        if (response.status < 200 || response.status >= 300) {
          return Promise.reject(response);
        }
        return response;
      },
      error => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );

    // Test de connexion à l'API
    this.testConnection();
  }

  // Méthode pour tester la connexion à l'API
  async testConnection() {
    try {
      console.log('Test de connexion à l\'API:', this.baseUrl);
      
      // Obtenir les en-têtes d'authentification
      const headers = hmacAuth.getAuthHeaders();
      
      // Tente une requête au point de terminaison de rackets avec authentification
      const response = await axios.get(`${this.baseUrl}/analysis/rackets`, { 
        timeout: 5000,
        headers
      });
      
      if (response.status >= 200 && response.status < 300) {
        console.log('✅ Connexion à l\'API réussie !');
        console.log(`   - URL: ${this.baseUrl}`);
        console.log(`   - Statut: ${response.status}`);
        console.log(`   - Données: ${response.data.length} raquettes reçues`);
      } else {
        console.warn('⚠️ Connexion à l\'API réussie mais avec un statut non-2xx:', response.status);
        console.warn('Réponse:', response.data);
      }
    } catch (error) {
      console.error('❌ Échec de la connexion à l\'API:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.error('   Le serveur API ne répond pas à', this.baseUrl);
        console.error('   Vérifiez que l\'URL est correcte et que le backend API est accessible.');
      } else if (error.response) {
        // La requête a été effectuée, mais le serveur a répondu avec un statut d'erreur
        console.error(`   Statut: ${error.response.status}`);
        console.error(`   Message: ${error.response.data?.message || 'Non spécifié'}`);
        
        if (error.response.status === 401 || error.response.status === 403) {
          console.error('   Problème d\'authentification. Vérifiez votre clé API et votre secret.');
          console.error('   Clé API configurée:', hmacAuth.apiKey.substring(0, 5) + '...');
          console.error('   Secret configuré:', hmacAuth.apiSecret ? 'Oui (longueur: ' + hmacAuth.apiSecret.length + ')' : 'Non');
        }
      }
    }
  }
  
  /**
   * Gestion des erreurs d'API
   * @param {Error} error - Erreur Axios
   */
  handleApiError(error) {
    if (error.response) {
      // La requête a été effectuée et le serveur a répondu avec un statut non 2xx
      const status = error.response.status;
      
      switch (status) {
        case 401:
          console.error('Erreur d\'authentification: clé API invalide ou expirée');
          break;
        case 403:
          console.error('Accès refusé: signature HMAC invalide ou expirée');
          break;
        case 429:
          console.error('Trop de requêtes: limite de taux dépassée');
          break;
        default:
          console.error(`Erreur API: ${error.response.status} - ${error.response.data.message || 'Erreur inconnue'}`);
          console.error('Données complètes:', error.response.data);
      }
    } else if (error.request) {
      // La requête a été effectuée mais aucune réponse n'a été reçue
      console.error('Aucune réponse du serveur. Détails:', {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      console.error('Erreur lors de la configuration de la requête:', error.message);
    }
  }
  
  /**
   * Effectue une requête GET avec authentification HMAC
   * @param {string} endpoint - Point de terminaison API
   * @param {Object} params - Paramètres de requête
   * @param {boolean} useCache - Si true, utilise le cache
   * @returns {Promise<any>} Données de réponse
   */
  async get(endpoint, params = {}, useCache = true) {
    // Crée une clé de cache à partir de l'endpoint et des paramètres
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    
    // Vérifie le cache si useCache est activé
    if (useCache) {
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) return cachedData;
    }
    
    try {
      // Obtient les en-têtes d'authentification
      const headers = hmacAuth.getAuthHeaders();
      
      // Effectue la requête
      const response = await this.axios.get(endpoint, { 
        params,
        headers
      });
      
      // Stocke dans le cache si useCache est activé
      if (useCache) {
        apiCache.set(cacheKey, response.data);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Effectue une requête POST avec authentification HMAC
   * @param {string} endpoint - Point de terminaison API
   * @param {Object} data - Données à envoyer
   * @returns {Promise<any>} Données de réponse
   */
  async post(endpoint, data) {
    try {
      // Obtient les en-têtes d'authentification avec le corps inclus pour la signature
      const headers = hmacAuth.getAuthHeaders(data);
      
      // Effectue la requête
      const response = await this.axios.post(endpoint, data, { headers });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Récupère toutes les raquettes
   * @param {boolean} useCache - Si true, utilise le cache
   * @returns {Promise<Array>} Liste des raquettes
   */
  getAllRackets(useCache = true) {
    return this.get('/analysis/rackets', {}, useCache);
  }
  
  /**
   * Récupère les meilleures raquettes
   * @param {string} category - Catégorie pour le classement
   * @param {number} limit - Nombre de raquettes à récupérer
   * @returns {Promise<Array>} Liste des meilleures raquettes
   */
  getTopRackets(category, limit = 3) {
    return this.get('/analysis/top-rackets', { category, limit });
  }
  
  /**
   * Recherche des raquettes selon les critères
   * @param {string} query - Terme de recherche
   * @param {Object} filters - Filtres supplémentaires
   * @returns {Promise<Array>} Résultats de recherche
   */
  searchRackets(query, filters = {}) {
    return this.get('/analysis/search-rackets', { query, ...filters });
  }
  
  /**
   * Récupère des raquettes similaires
   * @param {string} racketId - ID de la raquette de référence
   * @param {number} limit - Nombre de raquettes similaires à récupérer
   * @returns {Promise<Array>} Liste des raquettes similaires
   */
  getSimilarRackets(racketId, limit = 3) {
    return this.get(`/analysis/similar-rackets`, { racketId, limit });
  }
  
  /**
   * Compare plusieurs raquettes
   * @param {Array} racketIds - IDs des raquettes à comparer
   * @returns {Promise<Object>} Données de comparaison
   */
  compareRackets(racketIds) {
    return this.post('/analysis/compare-rackets', { racketIds });
  }
  
  /**
   * Récupère une raquette spécifique
   * @param {string} id - ID de la raquette
   * @returns {Promise<Object>} Données de la raquette
   */
  getRacket(id) {
    return this.get(`/analysis/racket/${id}`);
  }
  
  /**
   * Vide le cache API
   */
  clearCache() {
    apiCache.clear();
  }
}

// Exporte une instance singleton du service
export default new ApiService();