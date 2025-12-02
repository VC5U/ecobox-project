import API from './api';

export const authService = {
  login: async (email, password) => {
  try {
    console.log('🔐 Intentando login con:', { email, password });
    const response = await API.post('/auth/login/', {
      email,
      password
    });
    
    console.log('✅ Respuesta completa del login:', response);
    console.log('📦 Datos recibidos:', response.data);
    
    // VERIFICAR QUÉ ESTRUCTURA TIENE LA RESPUESTA
    if (response.data.token) {
      console.log('🔑 Token guardado:', response.data.token);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    } else if (response.data.key) {
      console.log('🔑 Key guardada:', response.data.key);
      localStorage.setItem('token', response.data.key);
      localStorage.setItem('user', JSON.stringify({email}));
    } else if (response.data.access) {
      console.log('🔑 Access token guardado:', response.data.access);
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('user', JSON.stringify({email}));
    } else {
      console.log('❌ No se encontró token en la respuesta:', response.data);
    }
    
    // VERIFICAR QUE SE GUARDÓ
    console.log('💾 Token en localStorage:', localStorage.getItem('token'));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error completo:', error);
    console.error('📋 Datos del error:', error.response?.data);
    throw error.response?.data || { message: 'Error de conexión' };
  }
},

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};