import React, { useState, useEffect } from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import ShopifyService from '../services/shopify';


ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);


// Définir un ensemble de couleurs fixes
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
  const [selectedRackets, setSelectedRackets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const shopifyService = new ShopifyService();
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [searchResultRacket, setSearchResultRacket] = useState([]);


  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (searchTerm.length >= 3) {
      const timerId = setTimeout(() => {
        fetchProducts(searchTerm);
      }, 100);

      setDebounceTimer(timerId);
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [searchTerm]);

  const addRacket = (racketModel) => {
    // Trouver le racket dans searchResultRacket
    const racketToAdd = searchResultRacket.find(racket => racket.model.toLowerCase() === racketModel.toLowerCase());
  
    if (racketToAdd &&!selectedRackets.includes(racketToAdd)) {
      if (selectedRackets.length === 3) {
        setSelectedRackets(prevSelectedRackets => prevSelectedRackets.slice(1));
      }
      setSelectedRackets(prevSelectedRackets => [...prevSelectedRackets, racketToAdd]);
      setSearchResultRacket([]);
    }
  };
  


  const fetchProducts = async (searchTerm) => {
    try {
      const products = await shopifyService.getProducts(searchTerm);
      const formattedProducts = products.map((product) => ({
        model: product.node.title,
        inertie: 3,
        poids: 4,
        equilibre: 5,
        deflexionVisage: 7,
        flexionHorizontale: 3,
        url: product.node.onlineStoreUrl,
        imageUrl: product.node.images.edges[0].node.originalSrc
      }));
      setSearchResultRacket(formattedProducts);
    } catch (error) {
      console.error('Erreur lors de la récupération des produits :', error);
    }
  };

  const updateChart = () => {
    const labels = ['Inertie', 'Poids', 'Equilibre', 'Déflexion visage', 'Flexion horizontale'];
    const datasets = selectedRackets.map((racket, index) => ({
      label: racket.model,
      data: [racket.inertie, racket.poids, racket.equilibre, racket.deflexionVisage, racket.flexionHorizontale],
      fill: true,
      pointRadius: 2.5,
      borderWidth: 1,
      ...colors[index % colors.length]  // Utiliser les couleurs fixes
    }));

    return {
      labels: labels,
      datasets: datasets
    };
  };

  return (
    <div className="racket-comparison">
      <h2>Comparateur de raquettes de padel</h2>
      <input
        type="text"
        id="searchInput"
        placeholder="Rechercher une raquette..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div id="suggestions" hidden={setSearchResultRacket.length === 0}>
        {searchTerm && (
          <ul>
            {searchResultRacket.map((racket) => (
              <li key={racket.model} onClick={() => addRacket(racket.model)}>
                {racket.model}
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
      <div id="racketList">
  {selectedRackets.map(racket => (
    <div key={racket.model} className="racket-card" onClick={() => window.open(racket.url, '_blank')}>
        <img src={racket.imageUrl} alt={`Image de ${racket.model}`} style={{maxHeight: '60px'}} /> {/* Image du produit */}
        <span>{racket.model}</span> {/* Nom du produit */}
    </div>
  ))}
</div>
    </div>
  );
};

export default RacketComparison;