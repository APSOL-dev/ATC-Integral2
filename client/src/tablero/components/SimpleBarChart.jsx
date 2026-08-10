import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, ChartDataLabels);

const SimpleBarChart = ({ title, labels, data, color, indexAxis = 'x', onClick, selectedValue }) => {
  const options = {
    onClick: (e, elements) => {
      if (!onClick || !elements || elements.length === 0) return;
      const index = elements[0].index;
      if (index !== undefined && labels && labels[index] !== undefined) {
        onClick(labels[index]);
      }
    },
    indexAxis,
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    onHover: (e, elements) => {
      e.native.target.style.cursor = elements.length ? 'pointer' : 'default';
    },
    plugins: { 
      legend: { display: false },
      datalabels: {
        color: '#E6007E',
        font: {
          weight: 'bold',
          family: 'Outfit',
          size: 10
        },
        anchor: 'end',
        align: 'end',
        offset: 4,
        formatter: (value) => {
          if (value === null || value === undefined) return '';
          if (value === 0) return '0';
          
          if (typeof value === 'number') {
            if (Number.isInteger(value)) return value.toLocaleString('es-AR');
            
            if (Math.abs(value) < 1000 && Math.abs(value) > 0) {
              return value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
            if (Math.abs(value) >= 1000) return (value/1000).toFixed(1) + 'k';
            return value.toLocaleString('es-AR');
          }
          return value;
        }
      }
    },
    layout: {
      padding: {
        top: indexAxis === 'x' ? 20 : 0,
        right: indexAxis === 'y' ? 30 : 0,
        bottom: 0,
        left: 0
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { 
          color: indexAxis === 'x' ? 'rgba(0, 173, 239, 0.1)' : 'transparent',
          drawBorder: false
        },
        ticks: {
          display: true,
          color: '#00ADEF',
          font: { size: 9, family: 'Inter', weight: '600' }
        }
      },
      x: { 
        grid: { 
          display: indexAxis === 'y' ? true : false,
          color: 'rgba(0, 173, 239, 0.1)',
          drawBorder: false
        },
        ticks: {
          display: true,
          color: '#00ADEF',
          font: { size: 9, family: 'Inter', weight: '600' },
          maxRotation: 0,
          minRotation: 0
        }
      }
    }
  };

  const chartData = {
    labels,
    datasets: [{
      data,
      backgroundColor: labels.map(l => {
        const reflectsSelection = Array.isArray(selectedValue) 
          ? selectedValue.length > 0 
          : !!selectedValue;
        
        if (!reflectsSelection) return color;
        
        const isSelected = Array.isArray(selectedValue)
          ? selectedValue.includes(l)
          : l === selectedValue;
          
        if (isSelected) return color;
        
        // Only apply opacity suffix if color looks like a hex code
        return (color.startsWith('#') && color.length === 7) ? color + '40' : color;
      }),
      borderRadius: 8,
      hoverBackgroundColor: (color.startsWith('#') && color.length === 7) ? color + 'CC' : color
    }]
  };

  return (
    <div className="card" style={{ height: '100%', borderLeft: `6px solid ${color}` }}>
      <div className="card-title">{title}</div>
      <div className="chart-box">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default SimpleBarChart;
