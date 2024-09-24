import React, { useState, useEffect } from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import products from './products';

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
    const [selectedRacket, setSelectedRacket] = useState(null);
    const [similarRackets, setSimilarRackets] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        if (selectedRacket) {
            findSimilarRackets(selectedRacket);
        }
    }, [selectedRacket]);

    useEffect(() => {
        searchProducts(searchTerm);
    }, [searchTerm]);

    const searchProducts = (term) => {
        const filteredProducts = products.filter(product =>
            product.name.toLowerCase().includes(term.toLowerCase())
        );
        setSearchResults(filteredProducts.slice(0, 10));
    };

    const selectRacket = (racket) => {
        setSelectedRacket(racket);
        setSearchTerm('');
        setSearchResults([]);
    };

    const findSimilarRackets = (racket) => {
        const attributes = ['Maniability', 'Weight', 'Effect', 'Tolerance', 'Power', 'Control'];

        const similarityScores = products
            .filter(p => p.name !== racket.name)
            .map(p => {
                const score = Math.sqrt(
                    attributes.reduce((sum, attr) => sum + Math.pow(racket[attr] - p[attr], 2), 0)
                );
                return { racket: p, score };
            });

        const topSimilar = similarityScores
            .sort((a, b) => a.score - b.score)
            .slice(0, 3)
            .map(item => item.racket);

        setSimilarRackets(topSimilar);
    };

    const updateChart = () => {
        const labels = ['Maniabilité', 'Poids', 'Effet', 'Tolérance', 'Puissance', 'Contrôle'];
        const datasets = [selectedRacket, ...similarRackets].filter(Boolean).map((racket, index) => ({
            label: racket.name,
            data: [racket.Maniability, racket.Weight, racket.Effect, racket.Tolerance, racket.Power, racket.Control],
            fill: true,
            pointRadius: 2.5,
            borderWidth: 1,
            ...colors[index]
        }));

        return { labels, datasets };
    };

    const openStoreLink = (racket) => {
        if (racket.storeUrl) {
            window.open(racket.storeUrl, '_blank');
        }
    };

    return (
        <div className="racket-comparison">
            <h1>Trouvez des raquettes similaires en <span className='boldr'>TEMPS RÉEL</span></h1>
            <p className='boldst'>Algorithme basé sur <span className='boldt'>{products.length}</span> raquettes actuellement</p>

            <p className='center'>Un outil innovant pour découvrir des <span className='bp'>raquettes similaires</span> à votre modèle préféré. Notre <span className='bp'>algorithme avancé</span> analyse les caractéristiques détaillées de chaque raquette pour vous proposer les <span className='bp'>options les plus proches</span>. Idéal pour explorer de nouvelles raquettes correspondant à votre style de jeu.</p>

            <input
                type="text"
                id="searchInput"
                placeholder="Rechercher une raquette..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div id="suggestions" hidden={searchResults.length === 0}>
                {searchTerm && searchResults.length !== 0 && (
                    <ul>
                        {searchResults.map((racket) => (
                            <li key={racket.name} onClick={() => selectRacket(racket)}>
                                {racket.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div id="chart-container">
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
            </div>
            <div id="racketList">
                {selectedRacket && (
                    <div key={selectedRacket.name} className="racket-card selected">
                        <span className="boldst">Raquette sélectionnée</span>
                        <div className='cardblock' onClick={() => openStoreLink(selectedRacket)}>
                            <img className='imgc' src={selectedRacket.imageUrl} alt={`Image of ${selectedRacket.name}`} style={{ maxHeight: '60px' }} />
                            <span>{selectedRacket.name}</span>
                        </div>
                    </div>
                )}
                {similarRackets.map((racket, index) => (
                    <div key={racket.name} className="racket-card">
                        <span className="boldst">Raquette similaire {index + 1}</span>
                        <div className='cardblock' onClick={() => openStoreLink(racket)}>
                            <img className='imgc' src={racket.imageUrl} alt={`Image of ${racket.name}`} style={{ maxHeight: '60px' }} />
                            <span>{racket.name}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SimilarRacketsComparison;