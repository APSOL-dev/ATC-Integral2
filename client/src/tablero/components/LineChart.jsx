import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels
);

const LineChart = ({ title, labels, data, color = '#3b82f6', fill = false }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        titleColor: '#E6007E',
        bodyColor: '#0F172A',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: (context) => ` Pedidos: ${context.parsed.y}`,
        }
      },
      datalabels: {
        align: 'top',
        anchor: 'end',
        offset: 4,
        color: '#E6007E',
        font: {
          size: 10,
          weight: 'bold',
          family: 'Inter'
        },
        formatter: (val) => val === 0 ? null : val
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'var(--cyan)',
          font: {
            size: 10,
            weight: '600'
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 173, 239, 0.05)',
        },
        ticks: {
          color: 'var(--cyan)',
          font: {
            size: 10
          },
          precision: 0
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data: data,
        borderColor: color,
        backgroundColor: color + '20', // Add transparency for fill
        fill: fill,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'white',
        pointBorderColor: color,
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointHoverBorderWidth: 3,
      },
    ],
  };

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', borderLeft: `6px solid ${color}` }}>
      <div className="card-title" style={{ marginBottom: '15px' }}>{title}</div>
      <div style={{ flexGrow: 1, minHeight: 0 }}>
        <Line options={options} data={chartData} />
      </div>
    </div>
  );
};

export default LineChart;
