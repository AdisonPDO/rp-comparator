// hmacAuth.js
import CryptoJS from 'crypto-js';

/**
 * Service pour générer les authentifications HMAC pour les appels API
 */
class HmacAuthService {
  constructor() {
    // Ces valeurs devraient être chargées depuis des variables d'environnement
    this.apiKey = process.env.REACT_APP_API_KEY || '';
    this.apiSecret = process.env.REACT_APP_API_SECRET || '';
    
    if (!this.apiKey || !this.apiSecret) {
      console.warn('API key or secret not configured. API calls will fail authentication.');
    }
  }

  /**
   * Génère un nonce aléatoire
   * @returns {string} Nonce unique
   */
  generateNonce() {
    // Génère une chaîne aléatoire de 16 caractères
    const random = CryptoJS.lib.WordArray.random(16);
    return random.toString(CryptoJS.enc.Hex);
  }
  
  /**
   * Génère une chaîne aléatoire de longueur spécifiée
   * @param {number} length - Longueur de la chaîne
   * @returns {string} Chaîne aléatoire
   */
  generateRandomString(length) {
    return CryptoJS.lib.WordArray.random(length/2).toString(CryptoJS.enc.Hex);
  }

  /**
   * Crée une signature HMAC pour une requête
   * @param {number} timestamp - Timestamp Unix en secondes
   * @param {string} nonce - Nonce unique
   * @param {string} payload - Contenu de la requête (ou chaîne vide pour GET)
   * @returns {string} Signature HMAC en format hexadécimal
   */
  createSignature(timestamp, nonce, payload = '') {
    // D'après la documentation fournie, la signature concatène timestamp + nonce + payload
    const dataToSign = `${timestamp}${nonce}${payload}`;
    return CryptoJS.HmacSHA256(dataToSign, this.apiSecret).toString(CryptoJS.enc.Hex);
  }

  /**
   * Génère les en-têtes d'authentification pour une requête
   * @param {any} body - Corps de la requête (pour POST/PUT), ou null pour GET
   * @returns {Object} En-têtes d'authentification
   */
  getAuthHeaders(body = null) {
    const timestamp = Math.floor(Date.now() / 1000); // Timestamp en secondes
    const nonce = this.generateNonce();
    const payload = body ? JSON.stringify(body) : '';
    const signature = this.createSignature(timestamp, nonce, payload);

    return {
      'X-API-Key': this.apiKey,
      'X-API-Timestamp': timestamp.toString(),
      'X-API-Nonce': nonce,
      'X-API-Signature': signature,
      'Content-Type': 'application/json'
    };
  }
}

// Exporte une instance singleton du service
export default new HmacAuthService();