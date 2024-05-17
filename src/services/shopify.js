
import _ from 'lodash';
import axios from 'axios';

class ShopifyService {
    constructor() {
        this.domain = "padeleurope.myshopify.com";
        this.storefrontAccessToken = "1107bafc5c59b4c892898cd546e95ca8";
    }

    async getProducts(searchTerm) {
        try {
            const response = await axios.post(`https://padeleurope.myshopify.com/api/2023-04/graphql.json`, {
                query: `
                {
                    products(first: 20, query: "${searchTerm}") {
                        edges {
                            node {
                                title
                                images(first: 1) {
                                    edges {
                                        node {
                                            originalSrc
                                        }
                                    }
                                }
                                horizontalFlexion: metafield(namespace: "custom", key: "horizontal_flexion") {
                                    value
                                  }
                                  inertia: metafield(namespace: "custom", key: "inertia") {
                                    value
                                  }
                                  weightAcc: metafield(namespace: "custom", key: "weight_acc") {
                                    value
                                  }
                                  balanceAcc: metafield(namespace: "custom", key: "balance_acc") {
                                    value
                                  }
                                  deflexion: metafield(namespace: "custom", key: "deflexion") {
                                    value
                                  }
                                onlineStoreUrl
                            }
                        }
                    }
                }
                    `,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Storefront-Access-Token': "1107bafc5c59b4c892898cd546e95ca8",
                },
            });
    
            // Assurez-vous de retourner la réponse attendue
            return response.data.data.products.edges;
        } catch (error) {
            console.error("Erreur lors de la récupération des produits :", error);
            // Gérez l'erreur et retournez une valeur par défaut ou rejetez la promesse
            throw error; // Ou retournez une valeur par défaut si nécessaire
        }
    }
    
}

export default ShopifyService;
