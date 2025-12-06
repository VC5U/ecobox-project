// src/components/plants/PlantList.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PlantCard from './PlantCard';
import './PlantList.css';

const PlantList = ({ plantas = [], onAddPlant }) => {
  const navigate = useNavigate();

  const handleViewPlant = (planta) => {
    console.log("📋 PlantList - Planta seleccionada:", planta);
    // Navegar a la ruta de detalle con el ID
    navigate(`/plantas/${planta.idPlanta || planta.id}`);
  };

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
              key={planta.idPlanta || planta.id}
              planta={planta}
              onSelect={() => handleViewPlant(planta)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlantList;