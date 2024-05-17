import React, { useState } from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const fakeRackets = [
  {
    model: 'Raquette Alpha',
    inertie: 8,
    poids: 7,
    equilibre: 6,
    deflexionVisage: 5,
    flexionHorizontale: 4,
    url: '#'
  },
  {
    model: 'Raquette Beta',
    inertie: 7,
    poids: 6,
    equilibre: 5,
    deflexionVisage: 4,
    flexionHorizontale: 3,
    url: '#'
  },
  {
    model: 'Raquette Gamma',
    inertie: 6,
    poids: 5,
    equilibre: 4,
    deflexionVisage: 3,
    flexionHorizontale: 2,
    url: '#'
  },
  {
    model: 'Raquette Alph zea',
    inertie: 8,
    poids: 7,
    equilibre: 6,
    deflexionVisage: 5,
    flexionHorizontale: 4,
    url: '#'
  },
  {
    model: 'Raquette Beta ze',
    inertie: 7,
    poids: 6,
    equilibre: 5,
    deflexionVisage: 4,
    flexionHorizontale: 3,
    url: '#'
  },
  {
    model: 'Raquette Gammaez',
    inertie: 6,
    poids: 5,
    equilibre: 4,
    deflexionVisage: 3,
    flexionHorizontale: 2,
    url: '#'
  }
];

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

  const addRacket = (racketName) => {
    const racket = fakeRackets.find(r => r.model.toLowerCase() === racketName.toLowerCase());
    if (racket && !selectedRackets.includes(racket)) {
      if (selectedRackets.length === 3) {
        setSelectedRackets(prevSelectedRackets => prevSelectedRackets.slice(1));
      }
      setSelectedRackets(prevSelectedRackets => [...prevSelectedRackets, racket]);
    }
    setSearchTerm('');
  };

  const updateChart = () => {
    const labels = ['Inertie', 'Poids', 'Equilibre', 'Déflexion visage', 'Flexion horizontale'];
    const datasets = selectedRackets.map((racket, index) => ({
      label: racket.model,
      data: [racket.inertie, racket.poids, racket.equilibre, racket.deflexionVisage, racket.flexionHorizontale],
      fill: true,
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
      <div id="suggestions">
        {searchTerm && (
          <ul>
            {fakeRackets.filter(racket => racket.model.toLowerCase().includes(searchTerm.toLowerCase())).map((racket) => (
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
          <button
            key={racket.model}
            className="racket-button"
            onClick={() => window.open(racket.url, '_blank')}
          >
            {racket.model}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RacketComparison;