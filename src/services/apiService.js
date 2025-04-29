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
    //console.log('API URL configurée:', this.baseUrl);
    
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
    //this.testConnection();
  }

  // Méthode pour tester la connexion à l'API
  async testConnection() {
    try {
      //console.log('Test de connexion à l\'API:', this.baseUrl);
      
      // Obtenir les en-têtes d'authentification
      const headers = hmacAuth.getAuthHeaders();
      
      // Tente une requête au point de terminaison de rackets avec authentification
      const response = await axios.get(`${this.baseUrl}/analysis/rackets`, { 
        timeout: 5000,
        headers
      });
      
      if (response.status >= 200 && response.status < 300) {
        //console.log('✅ Connexion à l\'API réussie !');
        //console.log(`   - URL: ${this.baseUrl}`);
        //console.log(`   - Statut: ${response.status}`);
        //console.log(`   - Données: ${response.data.length} raquettes reçues`);
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
    
    // Nettoie les paramètres (supprime les valeurs undefined/null)
    const cleanParams = {};
    for (const key in params) {
      if (params[key] !== undefined && params[key] !== null) {
        cleanParams[key] = params[key];
      }
    }
    
    // Vérifie le cache si useCache est activé
    if (useCache) {
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        //console.log(`Données récupérées du cache pour ${endpoint}`);
        return cachedData;
      }
    }
    
    try {
      // Pour les requêtes GET, le payload pour la signature est vide
      // Les paramètres sont envoyés dans l'URL, pas dans le payload
      const headers = hmacAuth.getAuthHeaders();
      
      /*console.log(`Requête GET vers ${endpoint}`, {
        params: cleanParams,
        headers: {
          'X-API-Key': headers['X-API-Key'],
          'X-API-Timestamp': headers['X-API-Timestamp'],
          'X-API-Nonce': headers['X-API-Nonce']
          // Signature omise pour des raisons de sécurité
        }
      });*/
      
      // Effectue la requête
      const response = await this.axios.get(endpoint, { 
        params: cleanParams,
        headers,
        paramsSerializer: params => {
          // Convertit les paramètres en chaîne de requête
          // sans les crochets pour les tableaux, et avec encodage URI
          return Object.entries(params)
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                // Pour les tableaux, les convertir en chaîne séparée par des virgules
                return `${encodeURIComponent(key)}=${encodeURIComponent(value.join(','))}`;
              }
              return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            })
            .join('&');
        }
      });
      
      // Vérifie si la réponse est valide
      if (!response.data) {
        throw new Error('Réponse API vide');
      }
      
      // Stocke dans le cache si useCache est activé
      if (useCache) {
        const cacheDuration = parseInt(process.env.REACT_APP_CACHE_DURATION || '5', 10);
        apiCache.set(cacheKey, response.data, cacheDuration);
      }
      
      return response.data;
    } catch (error) {
      // Log de l'erreur pour le débogage
      console.error(`Erreur lors de la requête GET à ${endpoint}:`, error.message);
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
    // Nettoie les données (supprime les valeurs undefined/null)
    const cleanData = {};
    if (data && typeof data === 'object') {
      for (const key in data) {
        if (data[key] !== undefined && data[key] !== null) {
          cleanData[key] = data[key];
        }
      }
    }
    
    try {
      // Pour les requêtes POST, le payload pour la signature inclut le corps JSON
      const jsonData = JSON.stringify(cleanData);
      const headers = hmacAuth.getAuthHeaders(cleanData);
      
      /*console.log(`Requête POST vers ${endpoint}`, {
        dataSize: jsonData.length,
        headers: {
          'X-API-Key': headers['X-API-Key'],
          'X-API-Timestamp': headers['X-API-Timestamp'],
          'X-API-Nonce': headers['X-API-Nonce']
          // Signature omise pour des raisons de sécurité
        }
      });*/
      
      // Effectue la requête
      const response = await this.axios.post(endpoint, jsonData, { 
        headers,
        // S'assurer que le contenu est envoyé en tant que JSON
        transformRequest: [(data, headers) => {
          headers['Content-Type'] = 'application/json';
          return jsonData;
        }]
      });
      
      // Vérifie si la réponse est valide
      if (!response.data) {
        throw new Error('Réponse API vide');
      }
      
      return response.data;
    } catch (error) {
      // Log de l'erreur pour le débogage
      console.error(`Erreur lors de la requête POST à ${endpoint}:`, error.message);
      throw error;
    }
  }

  
  /**
   * Récupère les meilleures raquettes
   * @param {string} attribute - Attribut pour le classement (Maniability, Weight, Effect, Tolerance, Power, Control)
   * @param {number} limit - Nombre de raquettes à récupérer
   * @returns {Promise<Array>} Liste des meilleures raquettes
   */
  async getTopRackets(attribute, limit = 3) {
    // S'assurer que l'attribut est une chaîne valide avec la première lettre en majuscule
    const validAttribute = this.normalizeCategory(attribute);
    const response = await this.get('/analysis/top-rackets', { 
      attribute: validAttribute, 
      limit: parseInt(limit, 10) 
    });
    return this.formatRacketArray(response.rackets || []);
  }
  
  /**
   * Normalise un attribut pour être compatible avec l'API
   * @param {string} attribute - Attribut à normaliser
   * @returns {string} Attribut normalisé
   */
  normalizeCategory(attribute) {
    // Liste des attributs valides selon backend-rp/app/Services/RacketAnalysisService.php ligne 277
    const validAttributes = [
      'Maniability', 'Weight', 'Effect', 'Tolerance', 'Power', 'Control'
    ];
    
    // Mappings alternatifs (pour support des anciennes requêtes)
    const attributeMappings = {
      'maniability': 'Maniability',
      'weight': 'Weight',
      'effect': 'Effect',
      'tolerance': 'Tolerance',
      'power': 'Power',
      'control': 'Control',
      // Si l'API a des noms alternatifs, les ajouter ici
    };
    
    // Vérifier si l'attribut est déjà valide
    if (validAttributes.includes(attribute)) {
      return attribute;
    }
    
    // Vérifier si l'attribut existe dans les mappings
    if (attributeMappings[attribute.toLowerCase()]) {
      return attributeMappings[attribute.toLowerCase()];
    }
    
    // Sinon, essayer de convertir la première lettre en majuscule
    const normalized = attribute.charAt(0).toUpperCase() + attribute.slice(1);
    
    // Vérifier si l'attribut normalisé est valide
    if (validAttributes.includes(normalized)) {
      return normalized;
    }
    
    // Si l'attribut n'est toujours pas valide, renvoyer 'Power' par défaut
    console.warn(`Attribut invalide: ${attribute}. Utilisation de 'Power' par défaut`);
    return 'Power';
  }
  
  /**
   * Recherche des raquettes selon les critères
   * @param {string} query - Terme de recherche
   * @param {Object} filters - Filtres supplémentaires
   * @returns {Promise<Array>} Résultats de recherche
   */
  async searchRackets(query, filters = {}) {
    // S'assurer que le terme de recherche est une chaîne
    const searchTerm = String(query || '').trim();
    const response = await this.get('/analysis/search-rackets', { 
      searchTerm: searchTerm,
      limit: filters.limit || 10,
      ...filters 
    });
    return this.formatRacketArray(response.rackets || []);
  }
  
  /**
   * Récupère des raquettes similaires
   * @param {string|number} racketId - ID de la raquette de référence
   * @param {number} limit - Nombre de raquettes similaires à récupérer
   * @returns {Promise<Object>} Objet contenant la raquette de référence et les raquettes similaires
   */
  async getSimilarRackets(racketId, limit = 3) {
    // S'assurer que l'ID est une chaîne et que la limite est un nombre
    const response = await this.get('/analysis/similar-rackets', { 
      racketId: String(racketId), 
      limit: parseInt(limit, 10) 
    });
    
    //console.log('Réponse getSimilarRackets brute:', response);
    
    // S'assurer que la réponse a un format valide
    if (!response || typeof response !== 'object') {
      console.error('Format de réponse invalide pour similar-rackets:', response);
      return {
        referenceRacket: null,
        similarRackets: []
      };
    }
    
    // Formater la raquette de référence
    let referenceRacket = null;
    if (response.referenceRacket) {
      referenceRacket = this.formatRacketData(response.referenceRacket);
    }
    
    // Formater les raquettes similaires, s'assurer que c'est un tableau
    let similarRackets = [];
    if (Array.isArray(response.similarRackets)) {
      similarRackets = this.formatRacketArray(response.similarRackets);
    } else if (response.similarRackets && typeof response.similarRackets === 'object') {
      // Si ce n'est pas un tableau mais un objet, essayer de le convertir en tableau
      similarRackets = this.formatRacketArray(Object.values(response.similarRackets));
    } else {
      console.error('Le format des raquettes similaires est inattendu:', response.similarRackets);
    }
    
    /*console.log('Données formatées de getSimilarRackets:', {
      referenceRacket: referenceRacket ? referenceRacket.name : null,
      similarCount: similarRackets.length,
      similarNames: similarRackets.map(r => r.name)
    });*/
    
    return {
      referenceRacket,
      similarRackets
    };
  }
  
  /**
   * Compare plusieurs raquettes
   * @param {Array} racketIds - IDs des raquettes à comparer
   * @returns {Promise<Object>} Données de comparaison
   */
  async compareRackets(racketIds) {
    // S'assurer que racketIds est bien un tableau
    const ids = Array.isArray(racketIds) ? racketIds : [racketIds];
    const response = await this.post('/analysis/compare-rackets', { 
      racketIds: ids.map(id => String(id)) 
    });
    return this.formatRacketArray(response.rackets || []);
  }
  
  /**
   * Récupère une raquette spécifique
   * @param {string|number} id - ID de la raquette
   * @returns {Promise<Object>} Données de la raquette
   */
  async getRacket(id) {
    try {
      //console.log(`Chargement des données complètes pour la raquette ID: ${id}`);
      // S'assurer que l'ID est une chaîne
      const response = await this.get(`/analysis/racket/${String(id)}`);
      
      // Vérifier si la réponse est valide
      if (!response || typeof response !== 'object') {
        console.error('Format de réponse invalide pour getRacket:', response);
        return null;
      }
      
      const formattedRacket = this.formatRacketData(response);
      //console.log('Données formatées de la raquette:', formattedRacket);
      return formattedRacket;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données de la raquette ID ${id}:`, error.message);
      throw error; // Remonter l'erreur pour être gérée par l'appelant
    }
  }
  
  /**
   * Vide le cache API
   */
  clearCache() {
    apiCache.clear();
  }
  
  /**
   * Adapte le format des données des raquettes depuis la réponse API
   * @param {Object} racket - Raquette reçue de l'API
   * @returns {Object} Raquette avec format adapté pour le frontend
   */
  formatRacketData(racket) {
    // Mappings des noms de champs pour compatibilité
    const formattedRacket = {
      id: racket.id,
      name: racket.name,
      marque: racket.brand, // Dans le frontend on utilise marque, dans l'API c'est brand
      imageUrl: racket.url_image, // Adaptation nom de champ
      storeUrl: racket.url_shop, // Adaptation nom de champ
      
      // Extraire les valeurs des métriques pour les mettre au niveau racine
      Maniability: racket.metrics?.Maniability || 0,
      Weight: racket.metrics?.Weight || 0,
      Effect: racket.metrics?.Effect || 0,
      Tolerance: racket.metrics?.Tolerance || 0,
      Power: racket.metrics?.Power || 0,
      Control: racket.metrics?.Control || 0,
      
      // Ajouter d'autres champs si nécessaire
      balance: racket.balance,
      weight: racket.weight,
      shape: racket.shape,
      
      // Ajouter le score de similarité s'il existe
      similarityScore: racket.similarityScore !== undefined ? racket.similarityScore : undefined
    };
    
    // Déboguer le score de similarité
    if (racket.similarityScore !== undefined) {
      //console.log(`Raquette ${racket.name} a un score de similarité: ${racket.similarityScore}`);
    }
    
    return formattedRacket;
  }
  
  /**
   * Traite un tableau de raquettes pour formater les données
   * @param {Array} rackets - Tableau de raquettes depuis l'API
   * @returns {Array} Tableau de raquettes formatées pour le frontend
   */
  formatRacketArray(rackets) {
    if (!Array.isArray(rackets)) {
      console.warn('formatRacketArray a reçu un objet non-tableau:', rackets);
      return [];
    }
    
    return rackets.map(racket => this.formatRacketData(racket));
  }
}

// Exporte une instance singleton du service
export default new ApiService();