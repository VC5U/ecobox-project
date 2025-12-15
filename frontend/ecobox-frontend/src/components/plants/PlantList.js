// src/components/plants/PlantList.js - VERSIÓN FINAL
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PlantCard from './PlantCard';
import './PlantList.css';

const PlantList = ({ plantas = [], sensores = [], onAddPlant }) => {
  const navigate = useNavigate();

  // Agrupar sensores por planta
  const sensoresPorPlanta = React.useMemo(() => {
    const mapa = {};
    
    if (!Array.isArray(sensores)) {
      console.warn('⚠️ sensores no es un array:', sensores);
      return mapa;
    }
    
    sensores.forEach(sensor => {
      const plantaId = sensor.planta;
      if (plantaId) {
        if (!mapa[plantaId]) {
          mapa[plantaId] = [];
        }
        mapa[plantaId].push(sensor);
      }
    });
    
    console.log('🗺️ Mapa sensores por planta:', Object.keys(mapa).length, 'plantas con sensores');
    return mapa;
  }, [sensores]);

  const handleViewPlant = (planta) => {
    const plantaId = planta.idPlanta || planta.id;
    navigate(`/plantas/${plantaId}`);
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
        <>
            <div className="plant-grid">
            {plantas.map((planta) => {
              const plantaId = planta.idPlanta || planta.id;
              const sensoresDeEstaPlanta = sensoresPorPlanta[plantaId] || [];
              
              console.log(`🌿 Planta ${plantaId} "${planta.nombrePersonalizado}":`, {
                sensores: sensoresDeEstaPlanta.length,
                detalles: sensoresDeEstaPlanta.map(s => ({
                  id: s.id,
                  nombre: s.nombre,
                  tipo: s.tipo_sensor,
                  valor: s.ultima_medicion?.valor
                }))
              });
              
              return (
                <PlantCard
                  key={plantaId}
                  planta={planta}
                  sensores={sensoresDeEstaPlanta}
                  onSelect={() => handleViewPlant(planta)}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default PlantList;