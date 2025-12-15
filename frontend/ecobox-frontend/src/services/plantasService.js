// src/services/plantasService.js - VERSIÓN CORREGIDA CON USUARIO
import API from './api';

// Servicio de notificaciones locales CORREGIDO
const NotificacionServiceLocal = {
  // Obtener ID de usuario del localStorage o token
  obtenerUsuarioId() {
    try {
      // Intenta obtener del localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || 1;
      }
      
      // Si no hay usuario guardado, usar 1 por defecto
      return 1;
    } catch (error) {
      console.error('Error obteniendo ID de usuario:', error);
      return 1; // Valor por defecto
    }
  },

  crearNotificacionLocal(mensaje, tipo = 'info') {
    try {
      console.log('📝 Creando notificación local:', mensaje);
      
      const notificaciones = JSON.parse(localStorage.getItem('notificaciones_fallback') || '[]');
      const usuarioId = this.obtenerUsuarioId(); // Obtener ID de usuario
      
      const nuevaNotificacion = {
        id: Date.now(),
        mensaje,
        tipo,
        leida: false,
        fecha_creacion: new Date().toISOString(),
        usuario: usuarioId // AGREGADO: Incluir usuario
      };
      
      notificaciones.unshift(nuevaNotificacion);
      localStorage.setItem('notificaciones_fallback', JSON.stringify(notificaciones));
      
      // Disparar evento para actualizar componentes
      window.dispatchEvent(new CustomEvent('notificaciones-actualizadas'));
      
      console.log('✅ Notificación creada y guardada en localStorage:', nuevaNotificacion);
      
      // También intentar enviar al backend
      this.enviarAlBackend(nuevaNotificacion);
      
      return nuevaNotificacion;
    } catch (error) {
      console.error('❌ Error creando notificación local:', error);
      return null;
    }
  },

  // Intentar enviar notificación al backend Django
  async enviarAlBackend(notificacion) {
    try {
      console.log('🔄 Intentando enviar notificación al backend...');
      
      const datosBackend = {
        mensaje: notificacion.mensaje,
        leida: notificacion.leida,
        tipo: notificacion.tipo,
        usuario: notificacion.usuario
        // fecha_creacion se genera automáticamente en el backend
      };
      
      const response = await API.post('notificaciones/', datosBackend);
      console.log('✅ Notificación enviada al backend:', response.data);
      return response.data;
    } catch (error) {
      console.warn('⚠️ No se pudo enviar al backend, se mantiene en localStorage:', error.message);
      return null;
    }
  },
  
  crearNotificacionNuevaPlanta(plantaNombre) {
    console.log('🌱 Creando notificación para nueva planta:', plantaNombre);
    return this.crearNotificacionLocal(`Nueva planta agregada: ${plantaNombre}`, 'success');
  },
  
  crearNotificacionPlantaEditada(plantaNombre) {
    console.log('✏️ Creando notificación para planta editada:', plantaNombre);
    return this.crearNotificacionLocal(`Planta actualizada: ${plantaNombre}`, 'info');
  },
  
  crearNotificacionPlantaEliminada(plantaNombre) {
    console.log('🗑️ Creando notificación para planta eliminada:', plantaNombre);
    return this.crearNotificacionLocal(`Planta eliminada: ${plantaNombre}`, 'warning');
  }
};

// Datos de demo mejorados
const demoData = {
  plantas: [
    {
      id: 1,
      idPlanta: 1,
      nombrePersonalizado: "Lavanda del Jardín",
      especie: "Lavandula",
      estado: "saludable",
      aspecto: "floreciendo",
      fecha_creacion: "2024-01-15",
      foto: "/images/lavanda.jpg",
      descripcion: "Lavanda francesa en maceta de terracota",
      familia: 1
    }
  ],
  sensores: [],
  configuraciones: []
};

// ===== FUNCIÓN AUXILIAR =====
const normalizarFamilia = (familiaData) => {
  if (!familiaData) return 1;
  if (typeof familiaData === 'object' && familiaData !== null) {
    return familiaData.id || familiaData.idFamilia || 1;
  }
  if (!isNaN(familiaData)) {
    return parseInt(familiaData);
  }
  return 1;
};

export const plantasService = {
  // Obtener todas las plantas
  getPlantas: async () => {
    try {
      const response = await API.get('plantas/');
      console.log('✅ Datos reales de plantas cargados:', response.data.length);
      
      return response.data.map(planta => ({
        id: planta.idPlanta,
        idPlanta: planta.idPlanta,
        nombrePersonalizado: planta.nombrePersonalizado,
        especie: planta.especie,
        estado: planta.estado || 'saludable',
        aspecto: planta.aspecto || 'normal',
        fecha_creacion: planta.fecha_creacion,
        descripcion: planta.descripcion || '',
        foto: planta.foto || '/images/default-plant.jpg',
        familia: planta.familia || 1
      }));
    } catch (error) {
      console.warn('⚠️ Usando datos demo para plantas');
      return demoData.plantas;
    }
  },

  // Obtener planta específica
  getPlanta: async (id) => {
    console.log("🔧 getPlanta llamado con ID:", id);
    
    try {
      const response = await API.get(`plantas/${id}/`);
      console.log('✅ Datos de planta específica:', response.data);
      
      const planta = response.data;
      return {
        id: planta.idPlanta,
        idPlanta: planta.idPlanta,
        nombrePersonalizado: planta.nombrePersonalizado,
        especie: planta.especie || '',
        estado: planta.estado || 'saludable',
        aspecto: planta.aspecto || 'normal',
        fecha_creacion: planta.fecha_creacion,
        descripcion: planta.descripcion || '',
        foto: planta.foto || '/images/default-plant.jpg',
        familia: planta.familia || 1
      };
    } catch (error) {
      console.warn('⚠️ Usando datos demo para planta específica');
      const plantaId = parseInt(id);
      const planta = demoData.plantas.find(p => p.id === plantaId);
      return planta || { ...demoData.plantas[0], id: plantaId, nombrePersonalizado: `Planta ${plantaId}` };
    }
  },
  
// En plantasService.js

getSensores: async () => {
  try {
    console.log('📡 Obteniendo todos los sensores...');
    const response = await API.get('sensores/');
    console.log('✅ Sensores obtenidos:', response.data.length);
    return response.data || [];
  } catch (error) {
    console.error('❌ Error obteniendo sensores:', error);
    return [];
  }
},
// En plantasService.js - AÑADE estas funciones
getSensoresConMediciones: async () => {
  try {
    console.log('📡 Obteniendo sensores con mediciones...');
    
    // 1. Obtener todos los sensores
    const response = await API.get('sensores/');
    const sensores = response.data || [];
    
    console.log(`✅ ${sensores.length} sensores base obtenidos`);
    
    // 2. Para cada sensor, obtener su última medición
    const sensoresConMediciones = await Promise.all(
      sensores.map(async (sensor) => {
        try {
          // Obtener la última medición del sensor
          const medicionResponse = await API.get(`sensores/${sensor.id}/historial_mediciones/`, {
            params: { 
              limit: 1, // Solo la última
              ordering: '-fecha' // Orden descendente por fecha
            }
          });
          
          const ultimaMedicion = medicionResponse.data[0] || null;
          
          // Devolver sensor con su última medición
          return {
            ...sensor,
            ultima_medicion: ultimaMedicion, // Nombre que usa el backend
            valor: ultimaMedicion?.valor || null
          };
          
        } catch (error) {
          console.warn(`⚠️ No se pudo obtener medición para sensor ${sensor.id}:`, error.message);
          // Devolver sensor sin medición
          return {
            ...sensor,
            ultima_medicion: null,
            valor: null
          };
        }
      })
    );
    
    console.log('✅ Sensores procesados con mediciones:', sensoresConMediciones.length);
    return sensoresConMediciones;
    
  } catch (error) {
    console.error('❌ Error obteniendo sensores con mediciones:', error);
    return [];
  }
},

// Función específica para una planta
getSensoresPlantaConMediciones: async (idPlanta) => {
  try {
    console.log(`📡 Obteniendo sensores con mediciones para planta ${idPlanta}...`);
    
    // 1. Obtener sensores de la planta
    const sensores = await plantasService.getSensoresPlanta(idPlanta);
    
    // 2. Para cada sensor, obtener su última medición
    const sensoresConMediciones = await Promise.all(
      sensores.map(async (sensor) => {
        try {
          const medicionResponse = await API.get(`sensores/${sensor.id}/historial_mediciones/`, {
            params: { limit: 1 }
          });
          
          return {
            ...sensor,
            ultima_medicion: medicionResponse.data[0] || null
          };
          
        } catch (error) {
          console.warn(`⚠️ Error medición sensor ${sensor.id}:`, error.message);
          return sensor;
        }
      })
    );
    
    return sensoresConMediciones;
    
  } catch (error) {
    console.error(`❌ Error sensores planta ${idPlanta}:`, error);
    return [];
  }
},
  // Obtener plantas filtradas por activo=True
  getMisPlantas: async () => {
    try {
      console.log('🌱 Obteniendo plantas (filtradas por activo=True)...');
      const response = await API.get('plantas/mis_plantas/');
      console.log(`✅ Plantas obtenidas: ${response.data.length}`);
      
      return response.data.map(planta => ({
        id: planta.idPlanta,
        idPlanta: planta.idPlanta,
        nombrePersonalizado: planta.nombrePersonalizado,
        especie: planta.especie,
        estado: planta.estado || 'saludable',
        aspecto: planta.aspecto || 'normal',
        fecha_creacion: planta.fecha_creacion,
        descripcion: planta.descripcion || '',
        foto: planta.foto || '/images/default-plant.jpg',
        familia: planta.familia || 1
      }));
    } catch (error) {
      console.error('❌ Error obteniendo plantas filtradas:', error);
      return await plantasService.getPlantas();
    }
  },

  // Obtener sensores de una planta
// plantasService.js - Versión limpia
getSensoresPlanta: async (idPlanta) => {
  console.log("🔧 Obteniendo sensores para planta ID:", idPlanta);
  
  try {
    const response = await API.get('sensores/', { params: { planta: idPlanta } });
    console.log(`✅ ${response.data.length} sensores obtenidos para planta ${idPlanta}`);
    return response.data || [];
    
  } catch (error) {
    console.error('❌ Error al obtener sensores:', error);
    
    // Datos demo de respaldo SOLO en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Usando datos demo para sensores');
      
      const datosDemo = [
        {
          "id": 1,
          "nombre": "Sensor Temp Rosa",
          "ubicacion": "Jardín Principal",
          "fecha_instalacion": "2025-11-27T10:31:21Z",
          "activo": true,
          "planta": 1,
          "tipo_sensor": 1,
          "estado_sensor": 1
        },
        {
          "id": 2,
          "nombre": "Sensor Humedad Rosa",
          "ubicacion": "Jardín Principal",
          "fecha_instalacion": "2025-11-27T10:31:21Z",
          "activo": true,
          "planta": 1,
          "tipo_sensor": 2,
          "estado_sensor": 1
        }
      ];
      
      return datosDemo.filter(sensor => sensor.planta === parseInt(idPlanta));
    }
    
    return [];
  }
},
  // Obtener configuración de planta
  getConfiguracionPlanta: async (idPlanta) => {
    console.log("🔧 getConfiguracionPlanta llamado para planta ID:", idPlanta);
    
    try {
      const response = await API.get('configuraciones/', { params: { idPlanta } });
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0];
      }
      return response.data || null;
    } catch (error) {
      console.warn('⚠️ Usando datos demo para configuración');
      return {
        idPlanta: parseInt(idPlanta),
        humedadObjetivo: 60,
        tempMax: 30,
        tempMin: 15
      };
    }
  },

  // ===== CREAR PLANTA - CON NOTIFICACIÓN MEJORADA =====
  crearPlanta: async (plantaData) => {
    try {
      console.log('🌱 [CREAR] Datos recibidos en crearPlanta:', plantaData);
      
      const formData = new FormData();
      formData.append('nombrePersonalizado', plantaData.nombrePersonalizado || '');
      formData.append('especie', plantaData.especie || 'Desconocida');
      formData.append('descripcion', plantaData.descripcion || '');
      formData.append('familia', normalizarFamilia(plantaData.id_familia || plantaData.familia));
      formData.append('estado', plantaData.estado || 'saludable');
      formData.append('aspecto', plantaData.aspecto || 'normal');
      
      if (plantaData.foto instanceof File) {
        formData.append('foto', plantaData.foto);
      }
      
      const response = await API.post('plantas/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('✅ [CREAR] Respuesta del backend:', response.data);
      
      // AGREGADO: Crear notificación con usuario
      const nombrePlanta = plantaData.nombrePersonalizado || 'Nueva planta';
      NotificacionServiceLocal.crearNotificacionNuevaPlanta(nombrePlanta);
      
      return response.data;
      
    } catch (error) {
      console.error('❌ [CREAR] Error creando planta:', error);
      throw new Error(error.response?.data?.detail || 'Error al crear la planta');
    }
  },

  // ===== ACTUALIZAR PLANTA - CON NOTIFICACIÓN MEJORADA =====
  actualizarPlanta: async (id, plantaData) => {
    console.log("🔄 actualizarPlanta llamado con ID:", id, "Datos:", plantaData);
    
    try {
      const plantaId = parseInt(id);
      const datosParaEnviar = {
        nombrePersonalizado: plantaData.nombrePersonalizado,
        especie: plantaData.especie || '',
        descripcion: plantaData.descripcion || '',
        estado: plantaData.estado || 'normal',
        aspecto: plantaData.aspecto || 'normal',
        familia: plantaData.familia || 1
      };
      
      console.log("📤 Enviando datos a API:", datosParaEnviar);
      
      const response = await API.put(`plantas/${plantaId}/`, datosParaEnviar);
      console.log("✅ Planta actualizada exitosamente:", response.data);
      
      // AGREGADO: Crear notificación con usuario
      const nombrePlanta = plantaData.nombrePersonalizado || response.data.nombrePersonalizado || 'Planta';
      NotificacionServiceLocal.crearNotificacionPlantaEditada(nombrePlanta);
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Error actualizando planta:', error);
      
      // Fallback demo
      const plantaId = parseInt(id);
      const plantaActualizada = {
        id: plantaId,
        idPlanta: plantaId,
        ...plantaData,
        fecha_creacion: new Date().toISOString().split('T')[0]
      };
      
      // AGREGADO: Crear notificación en modo demo
      const nombrePlanta = plantaData.nombrePersonalizado || 'Planta';
      NotificacionServiceLocal.crearNotificacionPlantaEditada(nombrePlanta);
      
      return plantaActualizada;
    }
  },
// ===== MÉTODOS FALTANTES PARA PLANTDETAIL =====

// Obtener última medición de un sensor (MÉTODO FALTANTE)
getUltimasMedicionesSensor: async (idSensor) => {
  console.log("🔧 getUltimasMedicionesSensor llamado para sensor ID:", idSensor);
  
  try {
    // Usar el endpoint que ya tienes
    const response = await API.get(`sensores/${idSensor}/historial_mediciones/`, {
      params: { 
        limit: 1,
        ordering: '-fecha'
      }
    });
    
    if (response.data && response.data.length > 0) {
      const ultimaMedicion = response.data[0];
      console.log(`✅ Última medición sensor ${idSensor}:`, ultimaMedicion);
      return ultimaMedicion;
    }
    
    console.log(`⚠️ Sensor ${idSensor} sin mediciones`);
    return null;
    
  } catch (error) {
    console.error(`❌ Error obteniendo mediciones sensor ${idSensor}:`, error);
    return null;
  }
},

// Versión específica para dashboard/plantas list
getUltimaMedicionSensor: async (idSensor) => {
  try {
    // Endpoint más simple si existe
    const response = await API.get(`sensores/${idSensor}/ultima_medicion/`);
    return response.data;
  } catch (error) {
    // Fallback al método anterior
    console.log(`🔄 Fallback para sensor ${idSensor}`);
    return await plantasService.getUltimasMedicionesSensor(idSensor);
  }
},
  // ===== ELIMINAR PLANTA - CON NOTIFICACIÓN MEJORADA =====
  eliminarPlanta: async (id) => {
    try {
      // Primero obtener el nombre de la planta
      let nombrePlanta = 'Planta eliminada';
      try {
        const response = await API.get(`plantas/${id}/`);
        nombrePlanta = response.data.nombrePersonalizado || 'Planta sin nombre';
      } catch (error) {
        console.warn('No se pudo obtener el nombre de la planta');
      }
      
      // Eliminar la planta
      const result = await API.delete(`plantas/${id}/`);
      
      // AGREGADO: Crear notificación con usuario
      NotificacionServiceLocal.crearNotificacionPlantaEliminada(nombrePlanta);
      
      return { 
        success: true, 
        message: 'Planta eliminada correctamente',
        nombrePlanta: nombrePlanta
      };
      
    } catch (error) {
      console.error('❌ Error eliminando planta:', error);
      
      // AGREGADO: Crear notificación incluso si falla
      NotificacionServiceLocal.crearNotificacionPlantaEliminada('Planta eliminada');
      
      return { 
        success: false, 
        message: 'Error al eliminar la planta' 
      };
    }
  }
};

// ===== SERVICIOS ADICIONALES =====
export const sensoresService = {
  getSensores: async () => {
    try {
      const response = await API.get('sensores/');
      return response.data;
    } catch (error) {
      console.warn('⚠️ Usando datos demo para sensores');
      return demoData.sensores;
    }
  }
};

export const dashboardService = {
  getDashboard: async () => {
    try {
      const response = await API.get('dashboard/');
      return response.data;
    } catch (error) {
      console.warn('⚠️ Usando datos demo para dashboard');
      return {
        total_plantas: demoData.plantas.length,
        plantas_saludables: 1,
        plantas_necesitan_agua: 0,
        sensores_activos: 0,
        ultima_actualizacion: new Date().toISOString()
      };
    }
  }
};

export default plantasService;