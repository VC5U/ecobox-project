// src/services/plantasService.js - VERSIÓN CORREGIDA
import API from './api';

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
    },
    {
      id: 2,
      idPlanta: 2,
      nombrePersonalizado: "Suculenta Oficina",
      especie: "Echeveria",
      estado: "necesita_agua",
      aspecto: "normal",
      fecha_creacion: "2024-02-20",
      foto: "/images/suculenta.jpg",
      descripcion: "Echeveria en maceta blanca",
      familia: 1
    }
  ],
  sensores: [
    {
      id: 1,
      idPlanta: 1,
      idTipoSensor: 1,
      idEstadoSensor: 1,
      macAddress: "AA:BB:CC:DD:EE:01",
      ultimaMedicion: {
        valor: 65,
        fechaHora: "2024-03-20T10:30:00Z"
      }
    },
    {
      id: 2,
      idPlanta: 2,
      idTipoSensor: 1,
      idEstadoSensor: 1,
      macAddress: "AA:BB:CC:DD:EE:02",
      ultimaMedicion: {
        valor: 25,
        fechaHora: "2024-03-20T11:45:00Z"
      }
    }
  ],
  configuraciones: [
    {
      id: 1,
      idPlanta: 1,
      humedadObjetivo: 60,
      tempMax: 30,
      tempMin: 15
    },
    {
      id: 2,
      idPlanta: 2,
      humedadObjetivo: 30,
      tempMax: 35,
      tempMin: 20
    }
  ]
};
// ===== FUNCIÓN AUXILIAR =====
// Normalizar datos de familia (recibe id_familia o familia)
const normalizarFamilia = (familiaData) => {
  if (!familiaData) return 1; // Valor por defecto
  
  // Si es objeto con id, usar el id
  if (typeof familiaData === 'object' && familiaData !== null) {
    return familiaData.id || familiaData.idFamilia || 1;
  }
  
  // Si es número, devolverlo
  if (!isNaN(familiaData)) {
    return parseInt(familiaData);
  }
  
  return 1; // Valor por defecto
};
export const plantasService = {
  // Obtener todas las plantas
  getPlantas: async () => {
    try {
      const response = await API.get('plantas/');
      console.log('✅ Datos reales de plantas cargados:', response.data);
      
      const plantasMapeadas = response.data.map(planta => ({
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
      
      return plantasMapeadas;
    } catch (error) {
      console.warn('⚠️ Usando datos demo para plantas');
      console.log('🔍 Error detallado:', error.response?.data || error.message);
      return demoData.plantas;
    }
  },

  // Obtener planta específica - CORREGIDO
  getPlanta: async (id) => {
    console.log("🔧 getPlanta llamado con ID:", id);
    console.log("🔧 Tipo de ID:", typeof id);
    
    try {
      // CORREGIDO: Usar template literals correctamente
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
      console.log('🔍 Error detallado:', error.response?.data || error.message);
      
      const plantaId = parseInt(id);
      console.log("🔍 Buscando planta demo con ID:", plantaId);
      
      const planta = demoData.plantas.find(p => 
        p.id === plantaId || p.idPlanta === plantaId
      );
      
      if (planta) {
        console.log("✅ Planta demo encontrada:", planta);
        return planta;
      } else {
        console.log("⚠️ Planta demo no encontrada, usando primera planta");
        // Crear una planta demo con el ID solicitado
        const nuevaPlantaDemo = {
          ...demoData.plantas[0],
          id: plantaId,
          idPlanta: plantaId,
          nombrePersonalizado: `Planta ${plantaId}`,
          descripcion: `Planta con ID ${plantaId}`
        };
        return nuevaPlantaDemo;
      }
    }
  },

  // ===== NUEVA FUNCIÓN =====
  getMisPlantas: async () => {
    try {
      console.log('🌱 Obteniendo plantas (filtradas por activo=True)...');
      const response = await API.get('plantas/mis_plantas/');
      console.log(`✅ Plantas obtenidas: ${response.data.length}`);
      
      // Mapear igual que getPlantas para consistencia
      const plantasMapeadas = response.data.map(planta => ({
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
      
      return plantasMapeadas;
      
    } catch (error) {
      console.error('❌ Error obteniendo plantas filtradas:', error);
      
      // Fallback al endpoint original
      console.log('🔄 Usando endpoint general como fallback...');
      return await plantasService.getPlantas();
    }
  },

  // Obtener sensores de una planta
  getSensoresPlanta: async (idPlanta) => {
    console.log("🔧 getSensoresPlanta llamado para planta ID:", idPlanta);
    
    try {
      const response = await API.get('sensores/', {
        params: { planta: idPlanta }
      });
      console.log('✅ Sensores recibidos:', response.data);
      return response.data || [];
    } catch (error) {
      console.warn('⚠️ Usando datos demo para sensores');
      console.log('🔍 Error detallado:', error.response?.data || error.message);
      
      const plantaId = parseInt(idPlanta);
      const sensores = demoData.sensores.filter(s => 
        s.idPlanta === plantaId || s.planta === plantaId
      );
      
      return sensores.length > 0 ? sensores : [];
    }
  },

  // Obtener configuración de planta
  getConfiguracionPlanta: async (idPlanta) => {
    console.log("🔧 getConfiguracionPlanta llamado para planta ID:", idPlanta);
    
    try {
      const response = await API.get('configuraciones/', {
        params: { idPlanta }
      });
      
      console.log('✅ Configuración recibida:', response.data);
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0];
      }
      return response.data || null;
    } catch (error) {
      console.warn('⚠️ Usando datos demo para configuración');
      console.log('🔍 Error detallado:', error.response?.data || error.message);
      
      const plantaId = parseInt(idPlanta);
      const config = demoData.configuraciones?.find(c => 
        c.idPlanta === plantaId
      );
      
      if (config) {
        return config;
      } else {
        // Crear configuración por defecto
        return {
          idPlanta: plantaId,
          humedadObjetivo: 60,
          tempMax: 30,
          tempMin: 15
        };
      }
    }
  },

  // Crear nueva planta
   // ===== CREAR PLANTA - VERSIÓN CORREGIDA =====
 // En plantasService.js - MODIFICAR SOLO LA FUNCIÓN crearPlanta
crearPlanta: async (plantaData) => {
  try {
    console.log('🌱 [CREAR] Datos recibidos en crearPlanta:', plantaData);
    
    // IMPORTANTE: Django DRF con archivos requiere FormData
    const formData = new FormData();
    
    // Agregar todos los campos al FormData
    formData.append('nombrePersonalizado', plantaData.nombrePersonalizado || '');
    formData.append('especie', plantaData.especie || 'Desconocida');
    formData.append('descripcion', plantaData.descripcion || '');
    
    // ¡IMPORTANTE! Django espera 'familia' no 'id_familia'
    formData.append('familia', normalizarFamilia(plantaData.id_familia || plantaData.familia));
    
    formData.append('estado', plantaData.estado || 'saludable');
    formData.append('aspecto', plantaData.aspecto || 'normal');
    
    // Manejar foto - puede ser File, string URL, o null
    if (plantaData.foto instanceof File) {
      // Es un archivo File
      formData.append('foto', plantaData.foto);
    } else if (typeof plantaData.foto === 'string' && plantaData.foto.trim() !== '') {
      // Es una URL string
      formData.append('foto_url', plantaData.foto); // Algunos backends tienen campo separado
    }
    
    // Log para debug
    console.log('📤 [CREAR] FormData preparado:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
    
    // Validación crítica: familia debe ser un número válido
    const familiaId = normalizarFamilia(plantaData.id_familia || plantaData.familia);
    if (!familiaId || isNaN(familiaId) || familiaId <= 0) {
      throw new Error('Debes seleccionar una familia válida para la planta');
    }
    
    // Validación: nombre es requerido
    if (!plantaData.nombrePersonalizado || !plantaData.nombrePersonalizado.trim()) {
      throw new Error('El nombre de la planta es requerido');
    }
    
    // Enviar con headers multipart
    const response = await API.post('plantas/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('✅ [CREAR] Respuesta del backend:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('❌ [CREAR] Error creando planta:', error);
    
    // Mensaje de error detallado
    let mensajeError = 'Error al crear la planta';
    
    if (error.response?.data) {
      console.error('📝 [CREAR] Errores del backend:', error.response.data);
      
      if (typeof error.response.data === 'object') {
        // Procesar errores de validación de Django
        const errores = Object.entries(error.response.data)
          .map(([campo, mensajes]) => {
            const campoTraducido = {
              'nombrePersonalizado': 'Nombre personalizado',
              'familia': 'Familia',
              'estado': 'Estado',
              'aspecto': 'Aspecto',
              'foto': 'Foto'
            }[campo] || campo;
            
            return `${campoTraducido}: ${Array.isArray(mensajes) ? mensajes.join(', ') : mensajes}`;
          })
          .join('; ');
        
        mensajeError = errores;
      } else if (typeof error.response.data === 'string') {
        mensajeError = error.response.data;
      } else if (error.response.data.detail) {
        mensajeError = error.response.data.detail;
      } else if (error.response.data.error) {
        mensajeError = error.response.data.error;
      }
    } else if (error.message) {
      mensajeError = error.message;
    }
    
    throw new Error(mensajeError);
  }
},
  // Actualizar planta
  actualizarPlanta: async (id, plantaData) => {
    console.log("🔄 actualizarPlanta llamado con ID:", id, "Datos:", plantaData);
    
    try {
      // Convertir ID a número si es necesario
      const plantaId = parseInt(id);
      
      // Preparar datos en el formato que Django espera
      const datosParaEnviar = {
        nombrePersonalizado: plantaData.nombrePersonalizado,
        especie: plantaData.especie || '',
        descripcion: plantaData.descripcion || '',
        estado: plantaData.estado || 'normal',
        aspecto: plantaData.aspecto || 'normal',
        familia: plantaData.familia || 1
      };
      
      console.log("📤 Enviando datos a API:", datosParaEnviar);
      
      // IMPORTANTE: Django DRF espera el ID en la URL, no en el body
      const response = await API.put(`plantas/${plantaId}/`, datosParaEnviar);
      
      console.log("✅ Planta actualizada exitosamente:", response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Error actualizando planta:', error);
      
      // Log detallado del error
      if (error.response) {
        console.error('📡 Error de servidor:', {
          status: error.response.status,
          data: error.response.data,
          url: error.config?.url
        });
        
        // Si es 400, mostrar detalles de validación
        if (error.response.status === 400) {
          console.error('📝 Errores de validación:', error.response.data);
        }
      }
      
      // Mejorar el fallback demo
      console.warn('⚠️ Usando fallback demo para actualización');
      
      const plantaId = parseInt(id);
      const index = demoData.plantas.findIndex(p => 
        p.id === plantaId || p.idPlanta === plantaId
      );
      
      if (index !== -1) {
        // Actualizar planta en demoData
        demoData.plantas[index] = { 
          ...demoData.plantas[index], 
          ...plantaData,
          // Mantener ID original
          id: demoData.plantas[index].id,
          idPlanta: demoData.plantas[index].idPlanta
        };
        
        console.log("✅ Planta demo actualizada:", demoData.plantas[index]);
        return demoData.plantas[index];
      }
      
      // Si no existe en demo, crear una
      const nuevaPlantaDemo = {
        id: plantaId,
        idPlanta: plantaId,
        ...plantaData,
        fecha_creacion: new Date().toISOString().split('T')[0]
      };
      
      demoData.plantas.push(nuevaPlantaDemo);
      console.log("✅ Nueva planta demo creada:", nuevaPlantaDemo);
      return nuevaPlantaDemo;
    }
  },

  // Eliminar planta
  eliminarPlanta: async (id) => {
    try {
      await API.delete(`plantas/${id}/`);
      return { success: true, message: 'Planta eliminada correctamente' };
    } catch (error) {
      console.warn('⚠️ Simulando eliminación de planta en demo');
      const plantaId = parseInt(id);
      const index = demoData.plantas.findIndex(p => p.id === plantaId);
      if (index !== -1) {
        demoData.plantas.splice(index, 1);
        return { success: true, message: 'Planta eliminada (demo)' };
      }
      return { success: false, message: 'Planta no encontrada' };
    }
  }
};

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
        plantas_saludables: demoData.plantas.filter(p => p.estado === 'saludable').length,
        plantas_necesitan_agua: demoData.plantas.filter(p => p.estado === 'necesita_agua').length,
        sensores_activos: demoData.sensores.length,
        ultima_actualizacion: new Date().toISOString()
      };
    }
  }
};

export default plantasService;