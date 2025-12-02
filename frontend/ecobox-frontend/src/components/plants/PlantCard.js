// src/components/plants/PlantCard.js
import React from 'react';
import './PlantCard.css';

const PlantCard = ({ planta, onSelect }) => {
  const getStatusInfo = (estado) => {
    const statusInfo = {
      saludable: { color: '#4CAF50', icon: '🌱', label: 'Saludable' },
      necesita_agua: { color: '#FF9800', icon: '💧', label: 'Necesita Agua' },
      peligro: { color: '#F44336', icon: '⚠️', label: 'En Peligro' },
      normal: { color: '#2196F3', icon: '✅', label: 'Normal' }
    };
    return statusInfo[estado] || statusInfo.normal;
  };

  const getTipoPlanta = (idTipoPlanta) => {
    const tipos = {
      1: 'Aromática',
      2: 'Suculenta', 
      3: 'Hortaliza',
      4: 'Floral',
      5: 'Frutal',
      6: 'Ornamental'
    };
    return tipos[idTipoPlanta] || 'Planta';
  };

  const statusInfo = getStatusInfo(planta.estado);

  return (
    <div className="plant-card" onClick={() => onSelect(planta)}>
      <div className="plant-card-header">
        <div className="plant-type-badge">
          {getTipoPlanta(planta.idTipoPlanta)}
        </div>
        <div 
          className="plant-status" 
          style={{ backgroundColor: statusInfo.color }}
          title={statusInfo.label}
        >
          <span className="status-icon">{statusInfo.icon}</span>
        </div>
      </div>
      
      <div className="plant-card-body">
        {planta.foto ? (
          <img 
            src={planta.foto} 
            alt={planta.nombrePersonalizado} 
            className="plant-image" 
          />
        ) : (
          <div className="plant-image-placeholder">
            <span className="placeholder-icon">🌿</span>
          </div>
        )}
        
        <h3 className="plant-name">{planta.nombrePersonalizado}</h3>
        
        <p className="plant-description">
          {planta.descripcion || 'Sin descripción'}
        </p>
        
        <div className="plant-meta">
          <span className="plant-aspecto">
            {planta.aspecto || 'Normal'}
          </span>
          <span className="plant-date">
            {new Date(planta.fecha_creacion).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      <div className="plant-card-footer">
        <button 
          className="btn-view-details"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(planta);
          }}
        >
          Ver Detalles
        </button>
      </div>
    </div>
  );
};

export default PlantCard;