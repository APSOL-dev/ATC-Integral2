import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SalesChart = () => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, beginAtZero: true, grid: { color: '#f0f0f0' } },
    },
  };

  const data = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [
      {
        label: 'E-commerce',
        data: [450, 520, 480, 610, 590, 720, 680, 750, 810, 890, 950, 1100],
        backgroundColor: '#00ADEF',
        borderRadius: 6,
      },
      {
        label: 'WhatsApp',
        data: [300, 350, 320, 410, 380, 450, 420, 480, 510, 580, 650, 720],
        backgroundColor: '#E6007E',
        borderRadius: 6,
      },
      {
        label: 'Presencial',
        data: [200, 220, 210, 250, 240, 280, 270, 310, 330, 360, 400, 450],
        backgroundColor: '#FFF200',
        borderRadius: 6,
      },
    ],
  };

  return <Bar options={options} data={data} />;
};

export default SalesChart;
