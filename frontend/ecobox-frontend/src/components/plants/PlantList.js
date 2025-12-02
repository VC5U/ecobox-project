// src/components/plants/PlantList.js
import React from 'react';
import PlantCard from './PlantCard';
import './PlantList.css';

const PlantList = ({ plantas = [], onAddPlant, onSelectPlant }) => {
  return (
    <div className="plant-list-container">
      <div className="plant-list-header">
        <h1>Mis Plantas</h1>
        <button className="btn-add-plant" onClick={onAddPlant}>
          + Agregar Planta
        </button>
      </div>

      {plantas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌱</div>
          <h3>No tienes plantas aún</h3>
          <p>Comienza agregando tu primera planta</p>
          <button className="btn-primary" onClick={onAddPlant}>
            Agregar Primera Planta
          </button>
        </div>
      ) : (
        <div className="plant-grid">
          {plantas.map((planta) => (
            <PlantCard
              key={planta.idPlanta}
              planta={planta}
              onSelect={onSelectPlant}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlantList;