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
    setSelectedPlant(plant);
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
          plantas={plantas} // ¡Falta esta prop!
          onAddPlant={handleAddPlant}
          onSelectPlant={handleViewPlant}
        />
      )}
      
      {currentView === 'form' && (
        <PlantForm
          plantaExistente={selectedPlant} // Cambiado de "planta" a "plantaExistente"
          onSubmit={handleSavePlant} // Cambiado de "onSave" a "onSubmit"
          onCancel={handleBackToList}
        />
      )}
      
      {currentView === 'detail' && selectedPlant && (
        <PlantDetail
          plant={selectedPlant} // Cambiado de "plantId" a "plant"
          onEdit={() => handleEditPlant(selectedPlant)}
          onBack={handleBackToList}
        />
      )}
    </div>
  );
};

export default PlantsManager;