// src/services/historialService.js
import API from './api';

// ===== FUNCIONES AUXILIARES PARA DATOS DEMO =====

// Generar detalles específicos para cada tipo de evento
const generarDetallesEvento = (tipo, index) => {
  switch(tipo) {
    case 'riego':
      const cantidades = ['250ml', '500ml', '750ml', '1L'];
      return `Cantidad: ${cantidades[index % cantidades.length]} | Duración: ${15 + (index % 10)} minutos`;
    
    case 'fertilizacion':
      const fertilizantes = ['NPK 10-10-10', 'Abono orgánico', 'Fertilizante líquido', 'Compost'];
      return `Producto: ${fertilizantes[index % fertilizantes.length]} | Dosis: ${50 + (index % 30)}g`;
    
    case 'poda':
      const tiposPoda = ['Hojas secas', 'Ramas laterales', 'Formación', 'Sanitaria'];
      return `Tipo: ${tiposPoda[index % tiposPoda.length]} | Material: ${0.5 + (index % 2)}kg`;
    
    case 'alerta':
      const niveles = ['Bajo', 'Moderado', 'Alto', 'Crítico'];
      return `Nivel: ${niveles[index % niveles.length]} | Acción: ${index % 2 === 0 ? 'Revisar' : 'Intervención requerida'}`;
    
    default:
      return 'Evento registrado en el sistema';
  }
};

// Generar estadísticas demo
const generarEstadisticasDemo = (plantId) => {
  return {
    humedad: {
      promedio: 68.5,
      maximo: 85,
      minimo: 42,
      tendencia: 'estable'
    },
    temperatura: {
      promedio: 24.2,
      maximo: 31,
      minimo: 18,
      tendencia: 'ascendente'
    },
    eventos: {
      total: 45,
      riegos: 12,
      alertas: 3,
      ultimaSemana: 8
    },
    sensores: {
      activos: 2,
      confiabilidad: 92,
      ultimaActualizacion: new Date().toISOString()
    }
  };
};

// Generar mediciones demo para un sensor
const generarMedicionesDemo = (sensorId, limite = 50) => {
  const mediciones = [];
  const ahora = new Date();
  
  // Determinar tipo de sensor
  let tipoSensor;
  let valorBase;
  let variacion;
  let unidad;
  
  if (sensorId % 3 === 0) {
    tipoSensor = 'temperatura';
    valorBase = 22;
    variacion = 8;
    unidad = '°C';
  } else if (sensorId % 3 === 1) {
    tipoSensor = 'humedad';
    valorBase = 65;
    variacion = 20;
    unidad = '%';
  } else {
    tipoSensor = 'luz';
    valorBase = 750;
    variacion = 400;
    unidad = 'lux';
  }
  
  for (let i = 0; i < limite; i++) {
    const fecha = new Date(ahora.getTime() - (i * 30 * 60 * 1000)); // Cada 30 minutos
    
    // Valor con variación cíclica
    const ciclo = Math.sin(i / 12) * variacion / 2;
    const aleatorio = (Math.random() - 0.5) * variacion / 4;
    let valor = valorBase + ciclo + aleatorio;
    
    // Limitar valores según tipo
    if (tipoSensor === 'humedad') {
      valor = Math.max(30, Math.min(95, valor));
    } else if (tipoSensor === 'temperatura') {
      valor = Math.max(15, Math.min(35, valor));
    } else if (tipoSensor === 'luz') {
      valor = Math.max(100, Math.min(1200, valor));
    }
    
    valor = Math.round(valor * 10) / 10;
    
    mediciones.push({
      id: i,
      fecha: fecha.toISOString(),
      sensor_id: sensorId,
      tipo_sensor: tipoSensor,
      valor: valor,
      unidad: unidad,
      planta_id: Math.ceil(sensorId / 2)
    });
  }
  
  return mediciones;
};

// Generar eventos demo
const generarEventosDemo = (plantId) => {
  const eventos = [];
  const ahora = new Date();
  const tiposEvento = ['riego', 'fertilizacion', 'poda', 'alerta', 'medicion', 'configuracion'];
  
  for (let i = 0; i < 20; i++) {
    const tipo = tiposEvento[Math.floor(Math.random() * tiposEvento.length)];
    const fecha = new Date(ahora.getTime() - (i * 12 * 60 * 60 * 1000)); // Cada 12 horas
    
    let descripcion;
    switch(tipo) {
      case 'riego':
        descripcion = `Riego automático programado para Planta ${plantId}`;
        break;
      case 'fertilizacion':
        descripcion = `Aplicación de fertilizante NPK`;
        break;
      case 'poda':
        descripcion = `Poda de mantenimiento realizada`;
        break;
      case 'alerta':
        descripcion = `Alerta: ${i % 2 === 0 ? 'Humedad baja' : 'Temperatura alta'}`;
        break;
      default:
        descripcion = `Evento de ${tipo} registrado`;
    }
    
    eventos.push({
      id: i,
      fecha: fecha.toISOString(),
      tipo: tipo,
      descripcion: descripcion,
      usuario: i % 3 === 0 ? 'Sistema EcoBox' : 'Usuario',
      detalles: generarDetallesEvento(tipo, i),
      planta_id: plantId
    });
  }
  
  return eventos;
};

// Generar historial demo completo
const generarHistorialDemo = (plantId) => {
  console.log(`🌿 [DEMO] Generando historial demo para planta ${plantId}...`);
  
  const ahora = new Date();
  const ultimasMediciones = [];
  const eventos = [];
  
  // Obtener nombre de planta para hacer demo más realista
  const nombrePlanta = `Planta ${plantId}`;
  
  // Generar mediciones de los últimos 7 días
  for (let i = 0; i < 168; i++) { // 7 días * 24 horas = 168 puntos
    const fecha = new Date(ahora.getTime() - (i * 60 * 60 * 1000)); // Retroceder i horas
    
    // Alternar entre humedad y temperatura
    const tipoSensor = i % 2 === 0 ? 1 : 2; // 1: temperatura, 2: humedad
    const tipoSensorNombre = tipoSensor === 1 ? 'temperatura' : 'humedad';
    
    // Generar valores realistas
    let valor;
    let unidad;
    
    if (tipoSensor === 1) { // Temperatura
      valor = 20 + Math.sin(i / 24) * 8 + Math.random() * 2; // Ciclo diario
      valor = Math.round(valor * 10) / 10;
      unidad = '°C';
    } else { // Humedad
      valor = 60 + Math.cos(i / 12) * 15 + Math.random() * 5;
      valor = Math.max(30, Math.min(95, Math.round(valor)));
      unidad = '%';
    }
    
    ultimasMediciones.push({
      id: i,
      fecha: fecha.toISOString(),
      sensor_id: tipoSensor,
      tipo_sensor: tipoSensorNombre,
      valor: valor,
      unidad: unidad,
      sensor_nombre: tipoSensor === 1 ? 'Sensor de Temperatura' : 'Sensor de Humedad'
    });
  }
  
  // Generar eventos de los últimos 30 días
  const eventosTipos = [
    { tipo: 'riego', icono: '💧', descripciones: ['Riego manual', 'Riego automático', 'Riego programado'] },
    { tipo: 'fertilizacion', icono: '🌱', descripciones: ['Aplicación de fertilizante', 'Abono orgánico'] },
    { tipo: 'poda', icono: '✂️', descripciones: ['Poda de mantenimiento', 'Poda de formación'] },
    { tipo: 'alerta', icono: '⚠️', descripciones: ['Humedad baja', 'Temperatura crítica', 'Necesita atención'] },
    { tipo: 'medicion', icono: '📊', descripciones: ['Medición periódica', 'Control de parámetros'] },
    { tipo: 'configuracion', icono: '⚙️', descripciones: ['Configuración actualizada', 'Umbrales modificados'] }
  ];
  
  for (let i = 0; i < 25; i++) {
    const eventoType = eventosTipos[Math.floor(Math.random() * eventosTipos.length)];
    const fecha = new Date(ahora.getTime() - (i * Math.random() * 30 * 24 * 60 * 60 * 1000)); // Últimos 30 días
    const descripcion = eventoType.descripciones[Math.floor(Math.random() * eventoType.descripciones.length)];
    
    eventos.push({
      id: i,
      fecha: fecha.toISOString(),
      tipo: eventoType.tipo,
      icono: eventoType.icono,
      descripcion: `${descripcion} - ${nombrePlanta}`,
      usuario: i % 3 === 0 ? 'Sistema' : 'Maria Lopez',
      detalles: generarDetallesEvento(eventoType.tipo, i)
    });
  }
  
  // Ordenar eventos por fecha descendente
  eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  
  const historial = {
    resumen: {
      totalRegistros: ultimasMediciones.length + eventos.length,
      primerRegistro: ultimasMediciones[ultimasMediciones.length - 1]?.fecha || ahora.toISOString(),
      ultimoRegistro: ultimasMediciones[0]?.fecha || ahora.toISOString(),
      sensoresActivos: 2,
      diasMonitoreo: 7
    },
    ultimasMediciones: ultimasMediciones.slice(0, 50), // Solo mostrar las últimas 50
    eventos: eventos,
    estadisticas: generarEstadisticasDemo(plantId)
  };
  
  return historial;
};

// Función auxiliar para convertir a CSV
const convertirHistorialACSV = (historial) => {
  let csv = 'Fecha,Tipo,Descripción,Valor,Unidad,Usuario\n';
  
  // Agregar mediciones
  historial.ultimasMediciones.forEach(item => {
    csv += `${item.fecha},Medición,${item.tipo_sensor},${item.valor},${item.unidad},Sistema\n`;
  });
  
  // Agregar eventos
  historial.eventos.forEach(evento => {
    csv += `${evento.fecha},${evento.tipo},${evento.descripcion},,${evento.usuario}\n`;
  });
  
  return csv;
};

// ===== SERVICIO PRINCIPAL =====
export const historialService = {
  // Obtener historial completo de una planta
 getHistorialPlanta: async (plantId) => {
    try {
      console.log(`📋 [HISTORIAL] Obteniendo historial para planta ${plantId}...`);
      
      // CORRECCIÓN: Usar 'id_planta' en lugar de 'plantId' o verificar el parámetro
      // El backend espera 'id_planta' en la URL
      const endpoints = [
        `plantas/${plantId}/historial/`,  // Intenta primero
        `plantas/${plantId}/historial/simple/`,  // Luego simple
      ];
      
      let lastError;
      
      for (const endpoint of endpoints) {
        try {
          const response = await API.get(endpoint);
          console.log(`✅ [HISTORIAL] Datos obtenidos de ${endpoint}`);
          return response.data;
        } catch (error) {
          lastError = error;
          console.warn(`⚠️ Endpoint ${endpoint} falló:`, error.message);
          // Continúa con el siguiente endpoint
        }
      }
      
      // Si todos fallan, usar datos demo
      console.warn(`⚠️ Todos los endpoints fallaron, usando datos demo`);
      return generarHistorialDemo(plantId);
      
    } catch (error) {
      console.error(`❌ Error obteniendo historial:`, error);
      return generarHistorialDemo(plantId);
    }
  },
  // Obtener mediciones históricas de un sensor específico
  getMedicionesSensor: async (sensorId, limite = 50) => {
    try {
      console.log(`📊 [MEDICIONES] Obteniendo ${limite} mediciones para sensor ${sensorId}...`);
      
      const response = await API.get(`sensores/${sensorId}/historial_mediciones/`, {
        params: {
          limit: limite,
          ordering: '-fecha'
        }
      });
      
      console.log(`✅ [MEDICIONES] ${response.data.length} mediciones obtenidas`);
      return response.data;
      
    } catch (error) {
      console.warn(`⚠️ [MEDICIONES] Usando datos demo para sensor ${sensorId}:`, error.message);
      return generarMedicionesDemo(sensorId, limite);
    }
  },

  // Obtener eventos de la planta
  getEventosPlanta: async (plantId) => {
    try {
      console.log(`📅 [EVENTOS] Obteniendo eventos para planta ${plantId}...`);
      
      const response = await API.get(`plantas/${plantId}/eventos/`);
      console.log(`✅ [EVENTOS] ${response.data.length} eventos obtenidos`);
      return response.data;
      
    } catch (error) {
      console.warn(`⚠️ [EVENTOS] Usando datos demo para planta ${plantId}:`, error.message);
      return generarEventosDemo(plantId);
    }
  },

  // Obtener estadísticas de la planta
  getEstadisticasPlanta: async (plantId) => {
    try {
      console.log(`📈 [ESTADÍSTICAS] Obteniendo estadísticas para planta ${plantId}...`);
      
      const response = await API.get(`plantas/${plantId}/estadisticas/`);
      console.log('✅ [ESTADÍSTICAS] Datos obtenidos:', response.data);
      return response.data;
      
    } catch (error) {
      console.warn(`⚠️ [ESTADÍSTICAS] Usando datos demo para planta ${plantId}:`, error.message);
      return generarEstadisticasDemo(plantId);
    }
  },

  // Obtener resumen de historial (para la pestaña de historial en PlantDetail)
  getResumenHistorial: async (plantId) => {
    try {
      // Intentar obtener datos reales primero
      const [mediciones, eventos, estadisticas] = await Promise.all([
        historialService.getMedicionesSensor(plantId, 10), // Últimas 10 mediciones
        historialService.getEventosPlanta(plantId),
        historialService.getEstadisticasPlanta(plantId)
      ]);
      
      return {
        ultimasMediciones: mediciones.slice(0, 5),
        ultimosEventos: eventos.slice(0, 3),
        estadisticas: estadisticas,
        totalRegistros: mediciones.length + eventos.length
      };
      
    } catch (error) {
      console.warn('⚠️ Usando resumen demo');
      return {
        ultimasMediciones: generarMedicionesDemo(1, 5),
        ultimosEventos: generarEventosDemo(plantId).slice(0, 3),
        estadisticas: generarEstadisticasDemo(plantId),
        totalRegistros: 127
      };
    }
  },

  // Función para exportar historial
  exportarHistorial: async (plantId, formato = 'json') => {
    try {
      const historial = await historialService.getHistorialPlanta(plantId);
      
      if (formato === 'json') {
        return {
          data: JSON.stringify(historial, null, 2),
          filename: `historial-planta-${plantId}-${new Date().toISOString().split('T')[0]}.json`
        };
      } else if (formato === 'csv') {
        // Convertir a CSV básico
        const csvData = convertirHistorialACSV(historial);
        return {
          data: csvData,
          filename: `historial-planta-${plantId}-${new Date().toISOString().split('T')[0]}.csv`
        };
      }
      
      throw new Error(`Formato ${formato} no soportado`);
      
    } catch (error) {
      console.error('❌ Error exportando historial:', error);
      throw error;
    }
  },

  // Función para generar datos demo (útil para testing)
  generarHistorialDemo
};

export default historialService;