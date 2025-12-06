// src/hooks/usePlantas.js
import { useState, useEffect } from 'react';
import { plantasService } from '../services/plantasService';

export const usePlantas = () => {
  const [plantas, setPlantas] = useState([]);
  const [loading, setLoading] = useState(true);

 // Cambia esto:
useEffect(() => {
  const cargarPlantas = async () => {
    const data = await plantasService.getPlantas();
    setPlantas(data);
  };
  cargarPlantas();
}, []);

// Por esto:
useEffect(() => {
  const cargarPlantas = async () => {
    try {
      // Usar el NUEVO endpoint que filtra por activo=True
      const data = await plantasService.getMisPlantas();
      setPlantas(data);
      console.log(`🌿 Plantas cargadas: ${data.length}`);
    } catch (error) {
      console.error('Error cargando plantas:', error);
    }
  };
  cargarPlantas();
}, []);

  const agregarPlanta = async (plantaData) => {
    const nuevaPlanta = await plantasService.crearPlanta(plantaData);
    setPlantas([...plantas, nuevaPlanta]);
    return nuevaPlanta;
  };

  const actualizarPlanta = async (id, plantaData) => {
    const plantaActualizada = await plantasService.actualizarPlanta(id, plantaData);
    setPlantas(plantas.map(p => p.id === id ? plantaActualizada : p));
    return plantaActualizada;
  };

  const recargarPlantas = async () => {
    setLoading(true);
    const data = await plantasService.getPlantas();
    setPlantas(data);
    setLoading(false);
  };

  return { plantas, loading, agregarPlanta, actualizarPlanta, recargarPlantas };
};