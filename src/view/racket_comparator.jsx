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
  }
];

const RacketComparison = () => {
  // Utilisation du contexte pour les données de raquettes
  const { rackets, loading, error, searchRackets, getTopRackets } = useRackets();
  
  // États locaux
  const [selectedRackets, setSelectedRackets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResultRacket, setSearchResultRacket] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [topLoading, setTopLoading] = useState(false);

  // Recherche des produits lorsque le terme de recherche change
  useEffect(() => {
    if (searchTerm) {
      searchProducts(searchTerm);
    } else {
      setSearchResultRacket([]);
    }
  }, [searchTerm]);

  // Fonction pour ajouter une raquette à la sélection avec chargement des données complètes
  const addRacket = async (racketId) => {
    try {
      setSearchLoading(true);
      
      // Récupérer les données complètes de la raquette depuis l'API
      const racketComplete = await apiService.getRacket(racketId);
      
      if (racketComplete) {
        //console.log('Données complètes de la raquette chargées:', racketComplete);
        
        // Vérifier si la raquette est déjà sélectionnée
        if (!selectedRackets.some(r => r.id === racketId)) {
          // Limiter à 3 raquettes maximum
          if (selectedRackets.length === 3) {
            setSelectedRackets(prev => prev.slice(1));
          }
          setSelectedRackets(prev => [...prev, racketComplete]);
        }
      } else {
        // Fallback sur les données de recherche si l'API échoue
        const racketToAdd = searchResultRacket.find(racket => racket.id === racketId);
        if (racketToAdd && !selectedRackets.some(r => r.id === racketId)) {
          if (selectedRackets.length === 3) {
            setSelectedRackets(prev => prev.slice(1));
          }
          setSelectedRackets(prev => [...prev, racketToAdd]);
        }
      }
      
      // Réinitialiser la recherche
      setSearchTerm('');
      setSearchResultRacket([]);
    } catch (error) {
      console.error('Erreur lors du chargement des données de la raquette:', error);
      
      // Fallback sur les données de recherche si l'API échoue
      const racketToAdd = searchResultRacket.find(racket => racket.id === racketId);
      if (racketToAdd && !selectedRackets.some(r => r.id === racketId)) {
        if (selectedRackets.length === 3) {
          setSelectedRackets(prev => prev.slice(1));
        }
        setSelectedRackets(prev => [...prev, racketToAdd]);
      }
      
      // Réinitialiser la recherche
      setSearchTerm('');
      setSearchResultRacket([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Fonction pour récupérer les meilleures raquettes
  const addTopRackets = async (category) => {
    try {
      setTopLoading(true);
      const topRackets = await getTopRackets(category, 3);
      setSelectedRackets(topRackets);
    } catch (error) {
      console.error('Erreur lors de la récupération des meilleures raquettes:', error);
    } finally {
      setTopLoading(false);
    }
  };

  // Fonction pour rechercher des raquettes
  const searchProducts = async (term) => {
    if (!term.trim()) return;
    
    try {
      setSearchLoading(true);
      const results = await searchRackets(term);
      setSearchResultRacket(results.slice(0, 10));
    } catch (error) {
      console.error('Erreur lors de la recherche de raquettes:', error);
      setSearchResultRacket([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Mise à jour des données pour le graphique
  const updateChart = () => {
    const labels = ['Maniabilité', 'Poids', 'Effet', 'Tolérance', 'Puissance', 'Contrôle'];
    const datasets = selectedRackets.map((racket, index) => ({
      label: racket.name,
      data: [racket.Maniability, racket.Weight, racket.Effect, racket.Tolerance, racket.Power, racket.Control],
      fill: true,
      pointRadius: 2.5,
      borderWidth: 1,
      ...colors[index % colors.length]
    }));

    return {
      labels: labels,
      datasets: datasets
    };
  };

  return (
    <div className="racket-comparison">
      <LoadingOverlay loading={loading && !searchLoading && !topLoading} error={error}>
        <h1>Comparateur de Raquette Pro en <span className='boldr'>TEMPS RÉEL</span></h1>
        <p className='boldst'> Algorithme basé sur des milliers de raquettes actuellement</p>

        <p className='center'>Un outil innovant conçu pour vous aider à choisir la <span className='bp'>meilleure raquette de padel</span>. Grâce à notre <span className='bp'>algorithme de calcul avancé</span>, nous analysons des statistiques détaillées de chaque raquette pour vous offrir des <span className='bp'>comparaisons précises et personnalisées</span>. Que vous soyez débutant ou joueur expérimenté, notre <span className='bp'>comparateur</span> vous guide pour faire le choix le plus éclairé.</p>

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
        
        <div id="suggestions" hidden={searchResultRacket.length === 0}>
          {searchTerm && searchResultRacket.length > 0 && (
            <ul>
              {searchResultRacket.map((racket) => (
                <li key={racket.id} onClick={() => addRacket(racket.id)}>
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
                ticks: {
                  stepSize: 1
                }
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
        
        <div>
          <button 
            onClick={() => addTopRackets('Maniability')} 
            className="racket-button"
            disabled={topLoading}
          >
            Top Maniabilité
          </button>
          <button 
            onClick={() => addTopRackets('Weight')} 
            className="racket-button"
            disabled={topLoading}
          >
            Top Poids
          </button>
          <button 
            onClick={() => addTopRackets('Effect')} 
            className="racket-button"
            disabled={topLoading}
          >
            Top Effet
          </button>
          <button 
            onClick={() => addTopRackets('Tolerance')} 
            className="racket-button"
            disabled={topLoading}
          >
            Top Tolérance
          </button>
          <button 
            onClick={() => addTopRackets('Power')} 
            className="racket-button"
            disabled={topLoading}
          >
            Top Puissance
          </button>
          <button 
            onClick={() => addTopRackets('Control')} 
            className="racket-button"
            disabled={topLoading}
          >
            Top Contrôle
          </button>
        </div>
        
        <div id="racketList">
          {selectedRackets.map(racket => (
            <div key={racket.id || racket.name} className="racket-card">
              <button className="close-button" onClick={() => {
                setSelectedRackets(prevSelectedRackets => 
                  prevSelectedRackets.filter(r => r.id !== racket.id)
                );
              }}>
                &times;
              </button>
              <div className='cardblock' onClick={() => {
                if (!racket.storeUrl) return;
                window.open(racket.storeUrl, '_blank');
              }}>
                <RacketImage 
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

export default RacketComparison;