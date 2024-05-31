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
  }
];

const RacketComparison = () => {
  const [selectedRackets, setSelectedRackets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResultRacket, setSearchResultRacket] = useState([]);

  useEffect(() => {
    searchProducts(searchTerm);
  }, [searchTerm]);

  const addRacket = (racketName) => {
    const racketToAdd = searchResultRacket.find(racket => racket.name.toLowerCase() === racketName.toLowerCase());

    if (racketToAdd && !selectedRackets.includes(racketToAdd)) {
      if (selectedRackets.length === 3) {
        setSelectedRackets(prevSelectedRackets => prevSelectedRackets.slice(1));
      }
      setSelectedRackets(prevSelectedRackets => [...prevSelectedRackets, racketToAdd]);
      setSearchResultRacket([]);
    }
  };

  const addTopRackets = (category) => {
    const sortedProducts = [...products].sort((a, b) => b[category] - a[category]);
    const topRackets = sortedProducts.slice(0, 3);
    setSelectedRackets(topRackets);
  };

  const searchProducts = (searchTerm) => {
    const filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResultRacket(filteredProducts.slice(0, 10));
  };

  const updateChart = () => {
    const labels = ['Maniabilité ', 'Poids', 'Effet', 'Tolérance', 'Puissance', 'Contrôle'];
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
      <h1>Comparateur de Raquette Pro en <span className='boldr'>TEMPS RÉEL</span></h1>
      <p className='boldst'> Algorithme basé sur <span className='boldt'>{products.length}</span> raquettes actuellement</p>

      <p className='center'>Un outil innovant conçu pour vous aider à choisir la <span className='bp'>meilleure raquette de padel</span>. Grâce à notre <span className='bp'>algorithme de calcul avancé</span>, nous analysons des statistiques détaillées de chaque raquette pour vous offrir des <span className='bp'>comparaisons précises et personnalisées</span>. Que vous soyez débutant ou joueur expérimenté, notre <span className='bp'>comparateur</span> vous guide pour faire le choix le plus éclairé.</p>

      <input
        type="text"
        id="searchInput"
        placeholder="Rechercher une raquette..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div id="suggestions" hidden={setSearchResultRacket.length === 0}>
        {searchTerm && searchResultRacket.length !== 0 && (
          <ul>
            {searchResultRacket.map((racket) => (
              <li key={racket.name} onClick={() => addRacket(racket.name)}>
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
        <button onClick={() => addTopRackets('Maniability')} className="racket-button">Top Maniabilité </button>
        <button onClick={() => addTopRackets('Weight')} className="racket-button">Top Poids</button>
        <button onClick={() => addTopRackets('Effect')} className="racket-button">Top Effet</button>
        <button onClick={() => addTopRackets('Tolerance')} className="racket-button">Top Tolérance</button>
        <button onClick={() => addTopRackets('Power')} className="racket-button">Top Puissance</button>
        <button onClick={() => addTopRackets('Control')} className="racket-button">Top Contrôle</button>
      </div>
      <div id="racketList">
        {selectedRackets.map(racket => (
          <div key={racket.name} className="racket-card">
            <button className="close-button" onClick={() => {
              setSelectedRackets(prevSelectedRackets => prevSelectedRackets.filter(r => r.name !== racket.name));
            }}>
              &times;
            </button>
            <div className='cardblock'  onClick={() => {
              if (!racket.storeUrl) return;
              window.open(racket.storeUrl, '_blank');
            }}>
              <img className='imgc' src={racket.imageUrl} alt={`Image of ${racket.name}`} style={{ maxHeight: '60px' }} />
              <span>{racket.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RacketComparison;