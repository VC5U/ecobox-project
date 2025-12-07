// src/services/notificacionService.js
import API from './api'; // Cambiado de 'API.js' a './api'

export const NotificacionService = {
  // Obtener todas las notificaciones
  async obtenerNotificaciones(filtros = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filtros.leida !== undefined) {
        params.append('leida', filtros.leida);
      }
      if (filtros.tipo) {
        params.append('tipo', filtros.tipo);
      }
      
      const queryString = params.toString();
      const url = queryString ? `notificaciones/?${queryString}` : 'notificaciones/';
      
      const response = await API.get(url);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      
      // Fallback a localStorage
      return this.obtenerNotificacionesLocal();
    }
  },

  // Crear nueva notificación
  async crearNotificacion(datos) {
    try {
      const response = await API.post('notificaciones/', datos);
      return response.data;
    } catch (error) {
      console.error('Error creando notificación:', error);
      
      // Fallback: guardar en localStorage
      return this.guardarNotificacionLocal(datos);
    }
  },

  // Crear notificaciones para diferentes eventos
  async crearNotificacionNuevaPlanta(plantaNombre) {
    const notificacion = {
      mensaje: `Nueva planta agregada: ${plantaNombre}`,
      tipo: 'success',
      leida: false
    };
    return await this.crearNotificacion(notificacion);
  },

  async crearNotificacionPlantaEditada(plantaNombre) {
    const notificacion = {
      mensaje: `Planta actualizada: ${plantaNombre}`,
      tipo: 'info',
      leida: false
    };
    return await this.crearNotificacion(notificacion);
  },

  async crearNotificacionPlantaEliminada(plantaNombre) {
    const notificacion = {
      mensaje: `Planta eliminada: ${plantaNombre}`,
      tipo: 'warning',
      leida: false
    };
    return await this.crearNotificacion(notificacion);
  },

  async crearNotificacionRiegoCompletado(plantaNombre) {
    const notificacion = {
      mensaje: `Riego completado para ${plantaNombre}`,
      tipo: 'success',
      leida: false
    };
    return await this.crearNotificacion(notificacion);
  },

  async crearNotificacionAlertaHumedad(plantaNombre, humedad) {
    const notificacion = {
      mensaje: `${plantaNombre} necesita agua - Humedad: ${humedad}%`,
      tipo: 'warning',
      leida: false
    };
    return await this.crearNotificacion(notificacion);
  },

  async crearNotificacionAlertaTemperatura(plantaNombre, temperatura) {
    const notificacion = {
      mensaje: `Temperatura alta en ${plantaNombre}: ${temperatura}°C`,
      tipo: 'error',
      leida: false
    };
    return await this.crearNotificacion(notificacion);
  },

  // Marcar como leída
  async marcarComoLeida(id) {
    try {
      const response = await API.post(`notificaciones/${id}/marcar_leida/`, {});
      return response.data;
    } catch (error) {
      console.error('Error marcando como leída:', error);
      
      // Fallback: actualizar en localStorage
      this.marcarComoLeidaLocal(id);
      return { id, leida: true };
    }
  },

  // Marcar todas como leídas
  async marcarTodasComoLeidas() {
    try {
      const response = await API.post('notificaciones/marcar_todas_leidas/', {});
      return response.data;
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      
      // Fallback: actualizar en localStorage
      this.marcarTodasComoLeidasLocal();
      return { success: true };
    }
  },

  // =================== LOCALSTORAGE FALLBACK ===================
  
  // Guardar notificación en localStorage
  guardarNotificacionLocal(datos) {
    try {
      const notificaciones = this.obtenerNotificacionesLocal();
      const nuevaNotificacion = {
        id: Date.now(), // ID temporal
        ...datos,
        fecha_creacion: new Date().toISOString(),
        usuario: 1 // ID temporal del usuario
      };
      
      notificaciones.unshift(nuevaNotificacion); // Agregar al inicio
      localStorage.setItem('notificaciones_fallback', JSON.stringify(notificaciones));
      
      // Disparar evento para actualizar componentes
      window.dispatchEvent(new CustomEvent('notificaciones-actualizadas'));
      
      return nuevaNotificacion;
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
      return null;
    }
  },

  // Obtener notificaciones de localStorage
  obtenerNotificacionesLocal() {
    try {
      const data = localStorage.getItem('notificaciones_fallback');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error obteniendo de localStorage:', error);
      return [];
    }
  },

  // Marcar como leída en localStorage
  marcarComoLeidaLocal(id) {
    try {
      const notificaciones = this.obtenerNotificacionesLocal();
      const index = notificaciones.findIndex(n => n.id === id);
      
      if (index !== -1) {
        notificaciones[index].leida = true;
        localStorage.setItem('notificaciones_fallback', JSON.stringify(notificaciones));
        window.dispatchEvent(new CustomEvent('notificaciones-actualizadas'));
      }
    } catch (error) {
      console.error('Error actualizando localStorage:', error);
    }
  },

  // Marcar todas como leídas en localStorage
  marcarTodasComoLeidasLocal() {
    try {
      const notificaciones = this.obtenerNotificacionesLocal();
      const actualizadas = notificaciones.map(n => ({ ...n, leida: true }));
      
      localStorage.setItem('notificaciones_fallback', JSON.stringify(actualizadas));
      window.dispatchEvent(new CustomEvent('notificaciones-actualizadas'));
    } catch (error) {
      console.error('Error actualizando localStorage:', error);
    }
  }
};

export default NotificacionService;