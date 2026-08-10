import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const GeoChart = ({ title, labels, data, color }) => {
  const options = {
    indexAxis: 'y', // Horizontal bars
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `$${context.raw.toLocaleString()}`
        }
      },
      datalabels: {
        color: '#475569',
        font: {
          weight: 'bold',
          family: 'Outfit',
          size: 10
        },
        anchor: 'end',
        align: 'end',
        offset: 4,
        formatter: (value) => `$${value >= 1000000 ? (value / 1000000).toFixed(1) + 'M' : (value / 1000).toFixed(0) + 'k'}`
      }
    },
    layout: {
      padding: { right: 35 }
    },
    scales: {
      x: { 
        beginAtZero: true, 
        grid: { color: '#f1f5f9' },
        ticks: {
          callback: (value) => `$${value >= 1000000 ? (value / 1000000).toFixed(1) + 'M' : value / 1000 + 'k'}`
        }
      },
      y: { 
        grid: { display: false },
        ticks: {
          font: { size: 10, weight: '500' },
          color: '#64748B'
        }
      }
    }
  };

  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: color,
      borderRadius: 4,
      hoverBackgroundColor: color + 'CC',
      barThickness: 12
    }]
  };

  return (
    <div className="card" style={{ height: '100%', borderLeft: `6px solid ${color}` }}>
      <div className="card-title">{title}</div>
      <div className="chart-box" style={{ paddingRight: '10px' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default GeoChart;
