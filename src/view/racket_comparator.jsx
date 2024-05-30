import React, { useState, useEffect } from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import products from './products' 

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
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [searchResultRacket, setSearchResultRacket] = useState([]);
  // const product = le json final 

  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (searchTerm.length >= 3) {
      const timerId = setTimeout(() => {
        searchProducts(searchTerm);
      }, 100);

      setDebounceTimer(timerId);
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
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

  const searchProducts = (searchTerm) => {
    const filteredProducts = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResultRacket(filteredProducts);
  };

  const updateChart = () => {
    const labels = ['Maniability', 'Weight', 'Effect', 'Tolerance', 'Power', 'Control'];
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
      <h2>Padel Racket Comparison</h2>
      <input
        type="text"
        id="searchInput"
        placeholder="Search for a racket..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div id="suggestions" hidden={setSearchResultRacket.length === 0}>
        {searchTerm && (
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
      <div id="racketList">
        {selectedRackets.map(racket => (
          <div key={racket.name} className="racket-card" onClick={() => window.open(racket.storeUrl, '_blank')}>
            <img src={racket.imageUrl} alt={`Image of ${racket.name}`} style={{maxHeight: '60px'}} />
            <span>{racket.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RacketComparison;