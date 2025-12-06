// src/services/dashboardService.js
import API from './api';

export const dashboardService = {
  getDashboard: async () => {
    try {
      console.log('📊 Obteniendo datos del dashboard...');
      const response = await API.get('dashboard/');
      console.log('✅ Dashboard cargado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error cargando dashboard:', error);
      
      // Datos demo para desarrollo
      return {
        total_plantas: 15,
        total_sensores: 7,
        plantas_necesitan_agua: 0,
        plantas_criticas: 0,
        temperatura_promedio: '24.0°C',
        humedad_promedio: '65%',
        familias_disponibles: [
          { id: 1, nombre: 'Hogar', descripcion: 'Plantas del hogar' },
          { id: 2, nombre: 'Oficina', descripcion: 'Plantas de oficina' },
          { id: 3, nombre: 'Jardín', descripcion: 'Plantas del jardín' },
          { id: 4, nombre: 'Terraza', descripcion: 'Plantas de la terraza' }
        ],
        ultima_actualizacion: new Date().toISOString()
      };
    }
  }
};

export default dashboardService;