import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const StatusChart = ({ labels, data, colors, onClick, selectedValue, legendPosition = 'bottom' }) => {
  const chartLabels = labels || ['Completados', 'En Producción', 'Pendientes', 'Cancelados'];
  const chartColors = colors || ['#00A651', '#00ADEF', '#FFF200', '#E6007E'];

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        data: data || [65, 20, 10, 5],
        backgroundColor: chartLabels.map((l, i) => {
          const baseColor = chartColors[i] || '#94A3B8';
          const reflectsSelection = Array.isArray(selectedValue) 
            ? selectedValue.length > 0 
            : !!selectedValue;
          
          if (!reflectsSelection) return baseColor;

          const isSelected = Array.isArray(selectedValue)
            ? selectedValue.includes(l)
            : l === selectedValue;
            
          return isSelected ? baseColor : baseColor + '40';
        }),
        borderWidth: 0,
        hoverOffset: 15,
      },
    ],
  };

  const options = {
    onClick: (e, elements) => {
      if (!onClick || elements.length === 0) return;
      onClick(chartLabels[elements[0].index]);
    },
    onHover: (e, elements) => {
      e.native.target.style.cursor = elements.length ? 'pointer' : 'default';
    },
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { 
        display: false
      },
      datalabels: {
        color: '#FFFFFF',
        font: {
          weight: 'bold',
          family: 'Outfit',
          size: 10
        },
        formatter: (value, context) => {
          const dataset = context.chart.data.datasets[0];
          const total = dataset.data.reduce((acc, current) => acc + current, 0);
          const percentage = (value / total * 100);
          return percentage > 5 ? Math.round(percentage) + '%' : null;
        }
      }
    },
  };

  const isSideLegend = legendPosition === 'left' || legendPosition === 'right';

  const containerStyle = {
    display: 'flex',
    flexDirection: isSideLegend ? 'row' : 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    width: '100%',
    height: '100%',
    position: 'relative'
  };

  const chartContainerStyle = {
    flex: '1 1 0%',
    minWidth: 0,
    minHeight: 0,
    height: '100%',
    width: '100%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const legendContainerStyle = {
    display: 'flex',
    flexDirection: isSideLegend ? 'column' : 'row',
    flexWrap: isSideLegend ? 'nowrap' : 'wrap',
    justifyContent: 'center',
    alignItems: isSideLegend ? 'flex-start' : 'center',
    gap: isSideLegend ? '4px' : '10px',
    padding: '4px',
    maxHeight: isSideLegend ? '100%' : 'none',
    overflow: 'visible',
    flexShrink: 0
  };

  const handleLegendClick = (label) => {
    if (onClick) {
      onClick(label);
    }
  };

  const renderLegend = () => {
    return (
      <div style={legendContainerStyle}>
        {chartLabels.map((l, i) => {
          const baseColor = chartColors[i] || '#94A3B8';
          const reflectsSelection = Array.isArray(selectedValue)
            ? selectedValue.length > 0
            : !!selectedValue;
          
          const isSelected = Array.isArray(selectedValue)
            ? selectedValue.includes(l)
            : l === selectedValue;
          
          const itemOpacity = reflectsSelection && !isSelected ? 0.35 : 1;

          return (
            <div
              key={l}
              onClick={() => handleLegendClick(l)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                opacity: itemOpacity,
                transition: 'all 0.2s ease',
                userSelect: 'none',
                padding: '1px 3px',
                borderRadius: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                if (reflectsSelection && !isSelected) {
                  e.currentTarget.style.opacity = '0.7';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.opacity = itemOpacity;
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: baseColor,
                  display: 'inline-block',
                  flexShrink: 0
                }}
              />
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: '600',
                  color: '#1E293B',
                  fontFamily: 'Inter',
                  whiteSpace: 'nowrap',
                  lineHeight: '1.2'
                }}
              >
                {l}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={containerStyle}>
      {(legendPosition === 'top' || legendPosition === 'left') && renderLegend()}
      <div style={chartContainerStyle}>
        <Doughnut data={chartData} options={options} />
      </div>
      {(legendPosition === 'bottom' || legendPosition === 'right') && renderLegend()}
    </div>
  );
};

export default StatusChart;
