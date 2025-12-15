// src/hooks/usePlantas.js
import { useState, useEffect, useCallback } from 'react';
import { plantasService } from '../services/plantasService';

export const usePlantas = () => {
  const [plantas, setPlantas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar plantas
  const cargarPlantas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Intentar usar getMisPlantas primero (que filtra por activo=True)
      let data;
      try {
        data = await plantasService.getMisPlantas();
        console.log(`✅ Plantas cargadas desde getMisPlantas: ${data.length}`);
      } catch (error1) {
        console.log('⚠️ getMisPlantas falló, intentando getPlantas:', error1);
        // Si falla, intentar con getPlantas
        data = await plantasService.getPlantas();
        console.log(`✅ Plantas cargadas desde getPlantas: ${data.length}`);
      }
      
      // Filtrar plantas activas si no se hizo en el backend
      const plantasActivas = Array.isArray(data) 
        ? data.filter(planta => planta.activo !== false) // Mantener las que no sean explícitamente false
        : [];
      
      setPlantas(plantasActivas);
      return plantasActivas;
      
    } catch (err) {
      console.error('❌ Error cargando plantas:', err);
      setError(err);
      setPlantas([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar plantas al inicio
  useEffect(() => {
    cargarPlantas();
  }, [cargarPlantas]);

  // Agregar nueva planta
  const agregarPlanta = async (plantaData) => {
    try {
      setError(null);
      const nuevaPlanta = await plantasService.crearPlanta(plantaData);
      
      // Actualizar estado local
      setPlantas(prev => [...prev, nuevaPlanta]);
      
      console.log('✅ Planta agregada:', nuevaPlanta);
      return nuevaPlanta;
      
    } catch (err) {
      console.error('❌ Error agregando planta:', err);
      setError(err);
      throw err;
    }
  };

  // Actualizar planta existente
  const actualizarPlanta = async (id, plantaData) => {
    try {
      setError(null);
      const plantaActualizada = await plantasService.actualizarPlanta(id, plantaData);
      
      // Actualizar estado local
      setPlantas(prev => prev.map(p => 
        (p.id === id || p.idPlanta === id) ? { ...p, ...plantaActualizada } : p
      ));
      
      console.log('✅ Planta actualizada:', plantaActualizada);
      return plantaActualizada;
      
    } catch (err) {
      console.error('❌ Error actualizando planta:', err);
      setError(err);
      throw err;
    }
  };

  // Eliminar planta
  const eliminarPlanta = async (id) => {
    try {
      setError(null);
      await plantasService.eliminarPlanta(id);
      
      // Actualizar estado local (eliminar o marcar como inactiva)
      setPlantas(prev => prev.filter(p => 
        !(p.id === id || p.idPlanta === id)
      ));
      
      console.log('✅ Planta eliminada:', id);
      return true;
      
    } catch (err) {
      console.error('❌ Error eliminando planta:', err);
      setError(err);
      throw err;
    }
  };

  // Obtener planta por ID
  const getPlantaById = useCallback((id) => {
    return plantas.find(p => 
      p.id === id || p.idPlanta === id
    ) || null;
  }, [plantas]);

  // Recargar plantas manualmente
  const recargarPlantas = async () => {
    return await cargarPlantas();
  };

  // Buscar plantas
  const buscarPlantas = (termino) => {
    if (!termino) return plantas;
    
    return plantas.filter(planta => 
      planta.nombrePersonalizado?.toLowerCase().includes(termino.toLowerCase()) ||
      planta.especie?.toLowerCase().includes(termino.toLowerCase()) ||
      planta.descripcion?.toLowerCase().includes(termino.toLowerCase())
    );
  };

  // Obtener estadísticas
  const getEstadisticas = useCallback(() => {
    const total = plantas.length;
    const necesitaAgua = plantas.filter(p => p.estado === 'necesita_agua').length;
    const saludables = plantas.filter(p => p.estado === 'saludable').length;
    const criticas = plantas.filter(p => p.estado === 'peligro').length;
    
    return {
      total,
      necesitaAgua,
      saludables,
      criticas,
      normales: total - necesitaAgua - saludables - criticas
    };
  }, [plantas]);

  return {
    // Estado
    plantas,
    loading,
    error,
    
    // Acciones
    cargarPlantas,
    agregarPlanta,
    actualizarPlanta,
    eliminarPlanta,
    recargarPlantas,
    
    // Utilidades
    getPlantaById,
    buscarPlantas,
    getEstadisticas
  };
};