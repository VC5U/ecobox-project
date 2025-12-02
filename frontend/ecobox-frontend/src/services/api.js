import axios from 'axios';

// Configuración base de Axios para conectar con Django
const API = axios.create({
  baseURL: 'http://localhost:8000/api/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para agregar token a las requests
// Interceptor para DEBUG MEJORADO
API.interceptors.request.use(
  (config) => {
    console.log('🔄 Enviando request a:', config.url);
    const token = localStorage.getItem('token');
    console.log('💾 Token en localStorage:', token);
    
    if (token) {
      config.headers.Authorization = `Token ${token}`; // ← PRUEBA CON "Token" en lugar de "Bearer"
      console.log('🔑 Header Authorization agregado:', config.headers.Authorization);
    } else {
      console.log('⚠️ NO hay token en localStorage');
    }
    return config;
  },
  (error) => {
    console.error('❌ Error en request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;