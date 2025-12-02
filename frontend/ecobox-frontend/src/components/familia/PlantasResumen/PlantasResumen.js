// src/components/familia/PlantasResumen/PlantasResumen.js
import React from 'react';
import './PlantasResumen.css';

const PlantasResumen = ({ plantasCount, familiaId }) => {
  const getEstadoPlantas = (count) => {
    if (count === 0) return { texto: 'Sin plantas', color: '#e53e3e', icono: '❌' };
    if (count < 3) return { texto: 'Pocas plantas', color: '#ed8936', icono: '🌱' };
    if (count < 6) return { texto: 'Jardín en crecimiento', color: '#48bb78', icono: '🌿' };
    return { texto: 'Jardín floreciente', color: '#38a169', icono: '🌸' };
  };

  const estado = getEstadoPlantas(plantasCount);

  return (
    <div className="plantas-resumen">
      <div className="plantas-resumen__header">
        <h4>Resumen de Plantas</h4>
        <span 
          className="plantas-resumen__estado"
          style={{ color: estado.color }}
        >
          {estado.icono} {estado.texto}
        </span>
      </div>
      
      <div className="plantas-resumen__stats">
        <div className="plantas-resumen__stat">
          <span className="plantas-resumen__stat-number">{plantasCount}</span>
          <span className="plantas-resumen__stat-label">plantas totales</span>
        </div>
        
        <div className="plantas-resumen__details">
          <div className="plantas-resumen__detail">
            <span className="plantas-resumen__detail-dot" style={{ background: '#48bb78' }}></span>
            <span>Saludables: {Math.floor(plantasCount * 0.7)}</span>
          </div>
          <div className="plantas-resumen__detail">
            <span className="plantas-resumen__detail-dot" style={{ background: '#ed8936' }}></span>
            <span>Necesitan atención: {Math.floor(plantasCount * 0.3)}</span>
          </div>
        </div>
      </div>
      
      <div className="plantas-resumen__footer">
        <a href={`/plantas?familia=${familiaId}`} className="plantas-resumen__link">
          Ver todas las plantas →
        </a>
      </div>
    </div>
  );
};

export default PlantasResumen;