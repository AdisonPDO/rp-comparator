import React, { useState, useEffect } from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { useRackets } from '../contexts/RacketContext';
import LoadingOverlay from '../components/LoadingOverlay';
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
        if (selectedRacket) {
            fetchSimilarRackets(selectedRacket.id);
        }
    }, [selectedRacket]);

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

    // Sélectionner une raquette
    const selectRacket = (racketId) => {
        const racket = searchResults.find(r => r.id === racketId);
        if (racket) {
            setSelectedRacket(racket);
            setSearchTerm('');
            setSearchResults([]);
        }
    };

    // Récupérer les raquettes similaires depuis l'API
    const fetchSimilarRackets = async (racketId) => {
        try {
            setSimilarLoading(true);
            const similar = await getSimilarRackets(racketId, 3);
            setSimilarRackets(similar);
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
        const allRackets = [selectedRacket, ...similarRackets].filter(Boolean);
        
        const datasets = allRackets.map((racket, index) => ({
            label: racket.name,
            data: [racket.Maniability, racket.Weight, racket.Effect, racket.Tolerance, racket.Power, racket.Control],
            fill: true,
            pointRadius: 2.5,
            borderWidth: 1,
            ...colors[index]
        }));

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
                <p className='boldst'>Algorithme basé sur <span className='boldt'>{rackets.length}</span> raquettes actuellement</p>

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
                                <img 
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
                                <img 
                                    className='imgc' 
                                    src={racket.imageUrl} 
                                    alt={`Image of ${racket.name}`} 
                                    style={{ maxHeight: '60px' }} 
                                />
                                <span>{racket.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </LoadingOverlay>
        </div>
    );
};

export default SimilarRacketsComparison;