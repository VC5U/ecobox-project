// src/services/plantasService.js
import API from './api';

// Datos de demo mejorados basados en tu schema de DB
const demoData = {
  plantas: [
    {
      idPlanta: 1,
      idFamilia: 1,
      idTipoPlanta: 1,
      nombrePersonalizado: "Lavanda del Jardín",
      estado: "saludable",
      aspecto: "Floreciendo",
      fecha_creacion: "2024-01-15",
      foto: "/images/lavanda.jpg",
      descripcion: "Lavanda francesa en maceta de terracota"
    },
    {
      idPlanta: 2,
      idFamilia: 1,
      idTipoPlanta: 2,
      nombrePersonalizado: "Suculenta Oficina",
      estado: "necesita_agua",
      aspecto: "Hojas arrugadas",
      fecha_creacion: "2024-02-20",
      foto: "/images/suculenta.jpg",
      descripcion: "Echeveria en maceta blanca"
    },
    {
      idPlanta: 3,
      idFamilia: 1,
      idTipoPlanta: 3,
      nombrePersonalizado: "Tomate Cherry",
      estado: "saludable",
      aspecto: "Con frutos",
      fecha_creacion: "2024-01-10",
      foto: "/images/tomate.jpg",
      descripcion: "Planta de tomate en huerto"
    }
  ],
  sensores: [
    {
      idSensor: 1,
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
      idSensor: 2,
      idPlanta: 1,
      idTipoSensor: 2,
      idEstadoSensor: 1,
      macAddress: "AA:BB:CC:DD:EE:02",
      ultimaMedicion: {
        valor: 22,
        fechaHora: "2024-03-20T10:30:00Z"
      }
    }
  ],
  configuraciones: [
    {
      idConfiguracion: 1,
      idPlanta: 1,
      humedadObjetivo: 60,
      tempMax: 30,
      tempMin: 15
    }
  ]
};

export const plantasService = {
  // Obtener todas las plantas
  getPlantas: async () => {
    try {
      const response = await API.get('plantas/');
      console.log('✅ Datos reales de plantas cargados');
      return response.data;
    } catch (error) {
      console.warn('⚠️ Usando datos demo para plantas');
      return demoData.plantas;
    }
  },

  // Obtener planta específica
  getPlanta: async (id) => {
    try {
      const response = await API.get(`plantas/${id}/`);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Usando datos demo para planta específica');
      const planta = demoData.plantas.find(p => p.idPlanta === id);
      return planta || demoData.plantas[0];
    }
  },

  // Crear nueva planta
  crearPlanta: async (plantaData) => {
    try {
      const response = await API.post('plantas/', plantaData);
      console.log('✅ Planta creada exitosamente');
      return response.data;
    } catch (error) {
      console.warn('⚠️ Simulando creación de planta en demo');
      // Simular creación en demo
      const nuevaPlanta = {
        idPlanta: Math.max(...demoData.plantas.map(p => p.idPlanta)) + 1,
        ...plantaData,
        fecha_creacion: new Date().toISOString().split('T')[0]
      };
      demoData.plantas.push(nuevaPlanta);
      return nuevaPlanta;
    }
  },

  // Actualizar planta
  actualizarPlanta: async (id, plantaData) => {
    try {
      const response = await API.put(`plantas/${id}/`, plantaData);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Simulando actualización de planta en demo');
      const index = demoData.plantas.findIndex(p => p.idPlanta === id);
      if (index !== -1) {
        demoData.plantas[index] = { ...demoData.plantas[index], ...plantaData };
        return demoData.plantas[index];
      }
      throw new Error('Planta no encontrada');
    }
  },

  // Eliminar planta
  eliminarPlanta: async (id) => {
    try {
      await API.delete(`plantas/${id}/`);
      return true;
    } catch (error) {
      console.warn('⚠️ Simulando eliminación de planta en demo');
      const index = demoData.plantas.findIndex(p => p.idPlanta === id);
      if (index !== -1) {
        demoData.plantas.splice(index, 1);
        return true;
      }
      return false;
    }
  },

  // Obtener sensores de una planta
  getSensoresPlanta: async (idPlanta) => {
    try {
      const response = await API.get(`sensores/?idPlanta=${idPlanta}`);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Usando datos demo para sensores de planta');
      return demoData.sensores.filter(s => s.idPlanta === idPlanta);
    }
  },

  // Obtener configuración de planta
  getConfiguracionPlanta: async (idPlanta) => {
    try {
      const response = await API.get(`configuraciones/?idPlanta=${idPlanta}`);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Usando datos demo para configuración');
      return demoData.configuraciones.find(c => c.idPlanta === idPlanta) || null;
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
  },

  getMedicionesSensor: async (idSensor) => {
    try {
      const response = await API.get(`mediciones/?idSensor=${idSensor}`);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Usando datos demo para mediciones');
      // Datos demo de mediciones
      return [
        { valor: 65, fechaHora: "2024-03-20T10:30:00Z" },
        { valor: 63, fechaHora: "2024-03-20T09:30:00Z" },
        { valor: 68, fechaHora: "2024-03-20T08:30:00Z" }
      ];
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