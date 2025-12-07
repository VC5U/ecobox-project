// src/services/profileService.js
import API from './api';

// Servicio de notificaciones para perfil
const NotificacionServiceLocal = {
  obtenerUsuarioId() {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || 1;
      }
      return 1;
    } catch (error) {
      console.error('Error obteniendo ID de usuario:', error);
      return 1;
    }
  },

  crearNotificacionLocal(mensaje, tipo = 'info') {
    try {
      console.log('📝 [PERFIL] Creando notificación:', mensaje);
      
      const notificaciones = JSON.parse(localStorage.getItem('notificaciones_fallback') || '[]');
      const usuarioId = this.obtenerUsuarioId();
      
      const nuevaNotificacion = {
        id: Date.now(),
        mensaje,
        tipo,
        leida: false,
        fecha_creacion: new Date().toISOString(),
        usuario: usuarioId
      };
      
      notificaciones.unshift(nuevaNotificacion);
      localStorage.setItem('notificaciones_fallback', JSON.stringify(notificaciones));
      
      window.dispatchEvent(new CustomEvent('notificaciones-actualizadas'));
      
      console.log('✅ [PERFIL] Notificación creada:', nuevaNotificacion);
      
      // Intentar enviar al backend
      this.enviarAlBackend(nuevaNotificacion);
      
      return nuevaNotificacion;
    } catch (error) {
      console.error('❌ Error creando notificación local:', error);
      return null;
    }
  },

  async enviarAlBackend(notificacion) {
    try {
      const datosBackend = {
        mensaje: notificacion.mensaje,
        leida: notificacion.leida,
        tipo: notificacion.tipo,
        usuario: notificacion.usuario
      };
      
      await API.post('notificaciones/', datosBackend);
      console.log('✅ [PERFIL] Notificación enviada al backend');
    } catch (error) {
      console.warn('⚠️ [PERFIL] No se pudo enviar al backend:', error.message);
    }
  },
  
  crearNotificacionPerfilActualizado(nombreUsuario) {
    console.log('👤 Creando notificación para perfil actualizado:', nombreUsuario);
    return this.crearNotificacionLocal(`Perfil actualizado: ${nombreUsuario}`, 'info');
  },
  
  crearNotificacionContrasenaCambiada() {
    console.log('🔐 Creando notificación para contraseña cambiada');
    return this.crearNotificacionLocal('Contraseña actualizada exitosamente', 'success');
  }
};

export const profileService = {
  // Obtener perfil del usuario
  getProfile: async () => {
    try {
      console.log('👤 Obteniendo perfil del usuario...');
      
      const response = await API.get('auth/profile/');
      console.log('✅ Perfil obtenido:', response.data);
      
      return {
        success: true,
        data: response.data
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo perfil:', error);
      
      // Fallback: usar datos de localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser && storedUser.email) {
        console.log('🔄 Usando datos guardados en localStorage');
        
        return {
          success: true,
          data: {
            nombre: storedUser.first_name || storedUser.nombre || '',
            apellido: storedUser.last_name || storedUser.apellido || '',
            email: storedUser.email || '',
            username: storedUser.username || '',
            telefono: storedUser.telefono || '',
            fecha_registro_formatted: storedUser.date_joined ? 
              new Date(storedUser.date_joined).toLocaleDateString() : 
              new Date().toLocaleDateString(),
            estadisticas: {
              plantas_count: 0,
              mediciones_count: 0,
              riegos_hoy: 0,
              semanas_activo: 1
            }
          }
        };
      }
      
      return {
        success: false,
        error: 'Error al cargar el perfil'
      };
    }
  },

  // ===== ACTUALIZAR PERFIL - CON NOTIFICACIÓN =====
  updateProfile: async (profileData) => {
    try {
      console.log('✏️ Actualizando perfil con datos:', profileData);
      
      // Preparar datos para el backend
      const datosParaEnviar = {
        nombre: profileData.nombre,
        apellido: profileData.apellido,
        username: profileData.username,
        telefono: profileData.telefono
      };
      
      const response = await API.put('auth/profile/', datosParaEnviar);
      console.log('✅ Perfil actualizado:', response.data);
      
      // Actualizar localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        first_name: profileData.nombre,
        last_name: profileData.apellido,
        username: profileData.username,
        telefono: profileData.telefono
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // AGREGADO: Crear notificación automática
      const nombreCompleto = `${profileData.nombre} ${profileData.apellido}`.trim() || profileData.username;
      NotificacionServiceLocal.crearNotificacionPerfilActualizado(nombreCompleto);
      
      return {
        success: true,
        message: response.data.message || 'Perfil actualizado correctamente',
        user: response.data.user || updatedUser
      };
      
    } catch (error) {
      console.error('❌ Error actualizando perfil:', error);
      
      let errorMessage = 'Error al actualizar el perfil';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        // Unir todos los errores de validación
        const detalles = error.response.data.details;
        if (typeof detalles === 'object') {
          errorMessage = Object.values(detalles).flat().join(', ');
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  // ===== CAMBIAR CONTRASEÑA - CON NOTIFICACIÓN =====
  changePassword: async (passwordData) => {
    try {
      console.log('🔐 Cambiando contraseña...');
      
      const response = await API.post('auth/change-password/', {
        old_password: passwordData.oldPassword,
        new_password: passwordData.newPassword,
        confirm_password: passwordData.confirmPassword
      });
      
      console.log('✅ Contraseña cambiada:', response.data);
      
      // AGREGADO: Crear notificación automática
      NotificacionServiceLocal.crearNotificacionContrasenaCambiada();
      
      return {
        success: true,
        message: response.data.message || 'Contraseña actualizada exitosamente'
      };
      
    } catch (error) {
      console.error('❌ Error cambiando contraseña:', error);
      
      let errorMessage = 'Error al cambiar la contraseña';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = Object.values(error.response.data.details).flat().join(', ');
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  // Obtener avatar
  getAvatarUrl: (nombre, apellido, username, userId) => {
    const colors = [
      '4CAF50', '2196F3', 'FF9800', 'E91E63', 
      '9C27B0', '00BCD4', 'FF5722', '795548',
      '607D8B', '3F51B5', '009688', 'FFC107'
    ];
    
    const colorIndex = userId ? userId % colors.length : 0;
    const color = colors[colorIndex];
    
    let iniciales = '';
    if (nombre && apellido) {
      iniciales = `${nombre[0]}${apellido[0]}`.toUpperCase();
    } else if (nombre) {
      iniciales = nombre[0].toUpperCase();
    } else if (username) {
      iniciales = username[0].toUpperCase();
    } else {
      iniciales = 'U';
    }
    
    return `https://ui-avatars.com/api/?name=${iniciales}&background=${color}&color=fff&size=150&bold=true`;
  },

  // Generar bio aleatoria
  getRandomBio: (userId) => {
    const biosPredefinidas = [
      "🌱 Apasionado por la tecnología y el cuidado de plantas",
      "💚 Amante de la naturaleza y la agricultura urbana",
      "🌿 Entusiasta de la jardinería y monitoreo de plantas",
      "🌻 Buscando conectar la tecnología con la naturaleza",
      "🍃 Innovando en el cuidado sostenible de plantas",
      "🌳 Creando un futuro más verde con tecnología",
      "🌼 Aprendiendo cada día sobre botánica y sensores",
      "🌾 Transformando espacios con plantas inteligentes",
      "🍀 Comprometido con la agricultura del futuro",
      "🎋 Explorando la sinergia entre IoT y botánica"
    ];
    
    const index = userId ? userId % biosPredefinidas.length : Math.floor(Math.random() * biosPredefinidas.length);
    return biosPredefinidas[index];
  }
};

export default profileService;