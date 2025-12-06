// src/components/PlantsManager.js
import React, { useState } from 'react';
import { usePlantas } from '../hooks/usePlantas';
import PlantList from './plants/PlantList';
import PlantForm from './plants/PlantForm';
import PlantDetail from './plants/PlantDetail';

const PlantsManager = () => {
  const [currentView, setCurrentView] = useState('list');
  const [selectedPlant, setSelectedPlant] = useState(null);
  const { plantas, agregarPlanta, actualizarPlanta, recargarPlantas } = usePlantas();

  const handleAddPlant = () => {
    setSelectedPlant(null);
    setCurrentView('form');
  };

  const handleEditPlant = (plant) => {
    setSelectedPlant(plant);
    setCurrentView('form');
  };

  const handleViewPlant = (plant) => {
    console.log("👁️ Planta seleccionada:", plant);
    
    // IMPORTANTE: La API devuelve idPlanta, usarlo como ID
    const plantId = plant.idPlanta || plant.id;
    console.log("👁️ ID a usar:", plantId);
    
    if (!plantId) {
      console.error("❌ No se encontró ID en la planta");
      return;
    }
    
    // Guardar la planta con el ID correcto
    setSelectedPlant({ ...plant, id: plantId, idPlanta: plantId });
    setCurrentView('detail');
  };

  const handleSavePlant = async (plantData) => {
    try {
      if (selectedPlant) {
        await actualizarPlanta(selectedPlant.idPlanta, plantData);
      } else {
        await agregarPlanta(plantData);
      }
      setCurrentView('list');
      recargarPlantas();
    } catch (error) {
      console.error('Error saving plant:', error);
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedPlant(null);
  };

  return (
    <div className="plants-manager">
      {currentView === 'list' && (
        <PlantList 
          plantas={plantas}
          onAddPlant={handleAddPlant}
          onSelectPlant={handleViewPlant}
        />
      )}
      
      {currentView === 'form' && (
        <PlantForm
          plantaExistente={selectedPlant}
          onSubmit={handleSavePlant}
          onCancel={handleBackToList}
        />
      )}
      
      {currentView === 'detail' && selectedPlant && (
        <PlantDetail
          plantId={selectedPlant.idPlanta || selectedPlant.id}
          onEdit={() => handleEditPlant(selectedPlant)}
          onBack={handleBackToList}
        />
      )}
    </div>
  );
};

export default PlantsManager;