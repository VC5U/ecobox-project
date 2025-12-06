// src/components/plants/PlantCard.js
import React from 'react';
import './PlantCard.css';

const PlantCard = ({ planta, onSelect }) => {
  const getStatusInfo = (estado) => {
    const statusInfo = {
      saludable: { color: '#4CAF50', label: 'Saludable' },
      necesita_agua: { color: '#FF9800', label: 'Necesita Agua' },
      peligro: { color: '#F44336', label: 'En Peligro' },
      normal: { color: '#2196F3', label: 'Normal' }
    };
    return statusInfo[estado] || statusInfo.normal;
  };

  const statusInfo = getStatusInfo(planta.estado);

  const handleClick = () => {
    console.log("🖱️ PlantCard clickeada, ID:", planta.idPlanta || planta.id);
    if (onSelect && typeof onSelect === 'function') {
      onSelect();
    }
  };

  return (
    <div className="plant-card" onClick={handleClick}>
      <div className="plant-card-header">
        {planta.foto ? (
          <img src={planta.foto} alt={planta.nombrePersonalizado} className="plant-card-image" />
        ) : (
          <div className="plant-card-image-placeholder">
            <span className="placeholder-icon">🌿</span>
          </div>
        )}
        <div className="plant-status" style={{ backgroundColor: statusInfo.color }}>
          {statusInfo.label}
        </div>
      </div>
      
      <div className="plant-card-content">
        <h3 className="plant-name">{planta.nombrePersonalizado}</h3>
        <p className="plant-description">{planta.descripcion || 'Sin descripción'}</p>
        
        <div className="plant-meta">
          <span className="meta-item">
            <span className="meta-label">Aspecto:</span>
            <span className="meta-value">{planta.aspecto || 'Normal'}</span>
          </span>
          <span className="meta-item">
            <span className="meta-label">Creada:</span>
            <span className="meta-value">
              {new Date(planta.fecha_creacion).toLocaleDateString()}
            </span>
          </span>
        </div>
      </div>
      
      <div className="plant-card-footer">
        <button className="btn-view-details" onClick={handleClick}>
          Ver detalles
        </button>
      </div>
    </div>
  );
};

export default PlantCard;