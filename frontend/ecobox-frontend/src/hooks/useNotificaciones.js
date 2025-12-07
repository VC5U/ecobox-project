// hooks/useNotificaciones.js
import { useState, useEffect, useCallback } from 'react';
import NotificacionService from '../services/notificacionService';

export const useNotificaciones = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({ total: 0, no_leidas: 0 });
  const [error, setError] = useState(null);

  // Cargar notificaciones
  const cargarNotificaciones = useCallback(async (filtros = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await NotificacionService.obtenerNotificaciones(filtros);
      const stats = await NotificacionService.obtenerEstadisticas();
      
      // Si el backend devuelve un array directamente
      if (Array.isArray(data)) {
        setNotificaciones(data);
      } else if (data.results) {
        setNotificaciones(data.results);
      } else {
        setNotificaciones(data);
      }
      
      setEstadisticas(stats);
    } catch (err) {
      setError(err.message);
      console.error('Error cargando notificaciones:', err);
      
      // Fallback a localStorage
      const locales = NotificacionService.obtenerNotificacionesLocal();
      const statsLocal = NotificacionService.obtenerEstadisticasLocal();
      
      setNotificaciones(locales);
      setEstadisticas(statsLocal);
    } finally {
      setLoading(false);
    }
  }, []);

  // Escuchar eventos de actualización
  useEffect(() => {
    const handleActualizacion = () => {
      cargarNotificaciones();
    };

    window.addEventListener('notificaciones-actualizadas', handleActualizacion);
    
    return () => {
      window.removeEventListener('notificaciones-actualizadas', handleActualizacion);
    };
  }, [cargarNotificaciones]);

  // Cargar al inicio
  useEffect(() => {
    cargarNotificaciones();
  }, [cargarNotificaciones]);

  return {
    notificaciones,
    loading,
    error,
    estadisticas,
    cargarNotificaciones,
    
    // Acciones
    marcarComoLeida: async (id) => {
      await NotificacionService.marcarComoLeida(id);
      cargarNotificaciones();
    },
    
    marcarTodasComoLeidas: async () => {
      await NotificacionService.marcarTodasComoLeidas();
      cargarNotificaciones();
    },
    
    crearNotificacion: NotificacionService.crearNotificacion,
    crearNotificacionNuevaPlanta: NotificacionService.crearNotificacionNuevaPlanta,
    crearNotificacionPlantaEditada: NotificacionService.crearNotificacionPlantaEditada,
    crearNotificacionPlantaEliminada: NotificacionService.crearNotificacionPlantaEliminada,
    crearNotificacionRiegoCompletado: NotificacionService.crearNotificacionRiegoCompletado,
    crearNotificacionAlertaHumedad: NotificacionService.crearNotificacionAlertaHumedad,
    crearNotificacionAlertaTemperatura: NotificacionService.crearNotificacionAlertaTemperatura
  };
};