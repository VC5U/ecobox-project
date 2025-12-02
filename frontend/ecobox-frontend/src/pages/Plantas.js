// src/pages/Plantas.js
import React, { useState } from 'react';
import PlantList from '../components/plants/PlantList';
import PlantForm from '../components/plants/PlantForm';
import PlantDetail from '../components/plants/PlantDetail';
import { usePlantas } from '../hooks/usePlantas';

const Plantas = () => {
  const [currentView, setCurrentView] = useState('list');
  const [selectedPlant, setSelectedPlant] = useState(null);
  const { plantas, agregarPlanta, actualizarPlanta } = usePlantas();

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
    } catch (error) {
      console.error('Error saving plant:', error);
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedPlant(null);
  };

  return (
    <div className="plantas-page">
      {currentView === 'list' && (
        <PlantList 
          plantas={plantas} // ¡Agregar esta prop!
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

export default Plantas;