// src/hooks/usePlantas.js
import { useState, useEffect } from 'react';
import { plantasService } from '../services/plantasService';

export const usePlantas = () => {
  const [plantas, setPlantas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarPlantas = async () => {
    try {
      setLoading(true);
      setError(null);
      const datosPlantas = await plantasService.getPlantas();
      setPlantas(datosPlantas);
    } catch (err) {
      setError('Error al cargar las plantas');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPlantas();
  }, []);

  const agregarPlanta = async (plantaData) => {
    try {
      setError(null);
      const nuevaPlanta = await plantasService.crearPlanta(plantaData);
      setPlantas(prev => [...prev, nuevaPlanta]);
      return nuevaPlanta;
    } catch (err) {
      setError('Error al crear la planta');
      throw err;
    }
  };

  const actualizarPlanta = async (id, plantaData) => {
    try {
      setError(null);
      const plantaActualizada = await plantasService.actualizarPlanta(id, plantaData);
      setPlantas(prev => prev.map(planta => 
        planta.idPlanta === id ? plantaActualizada : planta
      ));
      return plantaActualizada;
    } catch (err) {
      setError('Error al actualizar la planta');
      throw err;
    }
  };

  const eliminarPlanta = async (id) => {
    try {
      setError(null);
      const resultado = await plantasService.eliminarPlanta(id);
      if (resultado) {
        setPlantas(prev => prev.filter(planta => planta.idPlanta !== id));
      }
      return resultado;
    } catch (err) {
      setError('Error al eliminar la planta');
      throw err;
    }
  };

  return {
    plantas,
    loading,
    error,
    agregarPlanta,
    actualizarPlanta,
    eliminarPlanta,
    recargarPlantas: cargarPlantas
  };
};