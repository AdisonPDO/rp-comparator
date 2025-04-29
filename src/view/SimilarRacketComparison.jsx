import React, { useState, useEffect } from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { useRackets } from '../contexts/RacketContext';
import LoadingOverlay from '../components/LoadingOverlay';
import RacketImage from '../components/RacketImage';
import apiService from '../services/apiService';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const colors = [
    {
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 99, 132, 1)'
    },
    {
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
    },
    {
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(75, 192, 192, 1)'
    },
    {
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderColor: 'rgba(255, 159, 64, 1)',
        pointBackgroundColor: 'rgba(255, 159, 64, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 159, 64, 1)'
    }
];

const SimilarRacketsComparison = () => {
    // Utilisation du contexte pour les données de raquettes
    const { rackets, loading, error, searchRackets, getSimilarRackets } = useRackets();
    
    // États locaux
    const [selectedRacket, setSelectedRacket] = useState(null);
    const [similarRackets, setSimilarRackets] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [similarLoading, setSimilarLoading] = useState(false);

    // Chercher des raquettes similaires quand une raquette est sélectionnée
    useEffect(() => {
        if (selectedRacket && selectedRacket.id) {
            // Éviter de chercher à nouveau si la référence existe déjà dans les données similaires
            if (!similarRackets.some(r => r.id === selectedRacket.id)) {
                fetchSimilarRackets(selectedRacket.id);
            }
        }
    }, [selectedRacket?.id]); // Dépendre uniquement de l'ID, pas de l'objet entier

    // Rechercher des produits quand le terme de recherche change
    useEffect(() => {
        if (searchTerm) {
            searchProducts(searchTerm);
        } else {
            setSearchResults([]);
        }
    }, [searchTerm]);

    // Rechercher des produits
    const searchProducts = async (term) => {
        if (!term.trim()) return;
        
        try {
            setSearchLoading(true);
            const results = await searchRackets(term);
            setSearchResults(results.slice(0, 10));
        } catch (error) {
            console.error('Erreur lors de la recherche de raquettes:', error);
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    // Sélectionner une raquette et charger ses données complètes
    const selectRacket = async (racketId) => {
        try {
            setSearchLoading(true);
            // Récupérer les données complètes de la raquette depuis l'API
            const racketData = await apiService.getRacket(racketId);
            
            if (racketData) {
                //console.log('Données complètes de la raquette chargées:', racketData);
                setSelectedRacket(racketData);
                setSearchTerm('');
                setSearchResults([]);
            } else {
                console.error('Impossible de charger les données complètes de la raquette ID:', racketId);
                // Fallback sur les données de recherche si l'API échoue
                const racket = searchResults.find(r => r.id === racketId);
                if (racket) {
                    setSelectedRacket(racket);
                    setSearchTerm('');
                    setSearchResults([]);
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données de la raquette:', error);
            // Fallback sur les données de recherche si l'API échoue
            const racket = searchResults.find(r => r.id === racketId);
            if (racket) {
                setSelectedRacket(racket);
                setSearchTerm('');
                setSearchResults([]);
            }
        } finally {
            setSearchLoading(false);
        }
    };

    // Récupérer les raquettes similaires depuis l'API
    const fetchSimilarRackets = async (racketId) => {
        try {
            setSimilarLoading(true);
            const response = await getSimilarRackets(racketId, 3);
            
            // Le service API retourne un objet avec referenceRacket et similarRackets
            if (response && response.similarRackets) {
                //console.log('Raquettes similaires reçues:', response);
                
                // Éviter de mettre à jour la raquette sélectionnée si elle a le même ID
                // pour éviter de déclencher à nouveau le useEffect
                if (response.referenceRacket && 
                    response.referenceRacket.id === racketId &&
                    Object.keys(response.referenceRacket).length > 0 &&
                    (!selectedRacket || JSON.stringify(selectedRacket) !== JSON.stringify(response.referenceRacket))) {
                    //console.log('Mise à jour de la raquette sélectionnée avec données complètes');
                    setSelectedRacket(response.referenceRacket);
                }
                
                // On met à jour le tableau des raquettes similaires
                setSimilarRackets(response.similarRackets);
            } else {
                console.error('Format de réponse inattendu pour les raquettes similaires:', response);
                setSimilarRackets([]);
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des raquettes similaires:', error);
            setSimilarRackets([]);
        } finally {
            setSimilarLoading(false);
        }
    };

    // Mise à jour des données pour le graphique
    const updateChart = () => {
        const labels = ['Maniabilité', 'Poids', 'Effet', 'Tolérance', 'Puissance', 'Contrôle'];
        
        // Assurer que similarRackets est un tableau avant de faire ...similarRackets
        const safeRackets = Array.isArray(similarRackets) ? similarRackets : [];
        const allRackets = [selectedRacket, ...safeRackets].filter(Boolean);
        
        // Ajouter la vérification de données et de logs supplémentaires
        /*console.log('Données du graphique:', {
            selectedRacket: selectedRacket ? selectedRacket.name : null,
            similarCount: safeRackets.length,
            allRackets: allRackets.map(r => r.name)
        });*/
        
        const datasets = allRackets.map((racket, index) => {
            // Vérifier que les métriques existent, sinon utiliser des valeurs par défaut
            const metrics = {
                Maniability: racket.Maniability ?? 0,
                Weight: racket.Weight ?? 0,
                Effect: racket.Effect ?? 0,
                Tolerance: racket.Tolerance ?? 0,
                Power: racket.Power ?? 0,
                Control: racket.Control ?? 0
            };
            
            return {
                label: racket.name,
                data: [
                    metrics.Maniability,
                    metrics.Weight,
                    metrics.Effect,
                    metrics.Tolerance,
                    metrics.Power,
                    metrics.Control
                ],
                fill: true,
                pointRadius: 2.5,
                borderWidth: 1,
                ...colors[index]
            };
        });

        return { labels, datasets };
    };

    // Ouvrir le lien du magasin
    const openStoreLink = (racket) => {
        if (racket.storeUrl) {
            window.open(racket.storeUrl, '_blank');
        }
    };

    return (
        <div className="racket-comparison">
            <LoadingOverlay loading={loading && !searchLoading && !similarLoading} error={error}>
                <h1>Trouvez des raquettes similaires en <span className='boldr'>TEMPS RÉEL</span></h1>
                <p className='boldst'>Algorithme basé sur des milliers de raquettes actuellement</p>

                <p className='center'>Un outil innovant pour découvrir des <span className='bp'>raquettes similaires</span> à votre modèle préféré. Notre <span className='bp'>algorithme avancé</span> analyse les caractéristiques détaillées de chaque raquette pour vous proposer les <span className='bp'>options les plus proches</span>. Idéal pour explorer de nouvelles raquettes correspondant à votre style de jeu.</p>

                <div className="search-container">
                    <input
                        type="text"
                        id="searchInput"
                        placeholder="Rechercher une raquette..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchLoading && (
                        <div className="search-loading">Recherche en cours...</div>
                    )}
                </div>
                
                <div id="suggestions" hidden={searchResults.length === 0}>
                    {searchTerm && searchResults.length > 0 && (
                        <ul>
                            {searchResults.map((racket) => (
                                <li key={racket.id} onClick={() => selectRacket(racket.id)}>
                                    {racket.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                
                <div id="chart-container">
                    {similarLoading ? (
                        <div className="loading-spinner-container">
                            <div className="loading-spinner"></div>
                            <p>Recherche des raquettes similaires...</p>
                        </div>
                    ) : (
                        <Radar data={updateChart()} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                r: {
                                    min: 0,
                                    max: 10,
                                    ticks: { stepSize: 1 }
                                }
                            },
                            plugins: {
                                legend: {
                                    labels: {
                                        usePointStyle: true,
                                        pointStyle: 'rect',
                                        pointRadius: 6,
                                        pointBorderWidth: 1
                                    }
                                }
                            }
                        }} />
                    )}
                </div>
                
                <div id="racketList">
                    {selectedRacket && (
                        <div key={selectedRacket.id} className="racket-card selected">
                            <span className="boldst">Raquette sélectionnée</span>
                            <div className='cardblock' onClick={() => openStoreLink(selectedRacket)}>
                                <RacketImage 
                                    className='imgc' 
                                    src={selectedRacket.imageUrl} 
                                    alt={`Image of ${selectedRacket.name}`} 
                                    style={{ maxHeight: '60px' }} 
                                />
                                <span>{selectedRacket.name}</span>
                            </div>
                        </div>
                    )}
                    
                    {similarRackets.map((racket, index) => (
                        <div key={racket.id} className="racket-card">
                            <span className="boldst">Raquette similaire {index + 1}</span>
                            <div className='cardblock' onClick={() => openStoreLink(racket)}>
                                <RacketImage 
                                    className='imgc' 
                                    src={racket.imageUrl} 
                                    alt={`Image of ${racket.name}`} 
                                    style={{ maxHeight: '60px' }} 
                                />
                                <span>{racket.name}</span>
                            </div>
                            
                            {/* Affichage du score de similarité avec barre de progression */}
                            {racket.similarityScore !== undefined && (
                                <div className="similarity-score">
                                    <div className="similarity-score-value">
                                        {Math.round(racket.similarityScore * 100)}% de similarité
                                    </div>
                                    <div className="similarity-bar-container">
                                        <div 
                                            className="similarity-bar" 
                                            style={{ width: `${Math.round(racket.similarityScore * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </LoadingOverlay>
        </div>
    );
};

export default SimilarRacketsComparison;