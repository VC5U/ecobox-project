// src/services/familiasService.js - VERSIÓN CON NOTIFICACIONES
import API from './api';

// Servicio de notificaciones locales para familias
const NotificacionServiceLocal = {
  // Obtener ID de usuario del localStorage o token
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

  // Crear notificación local
  crearNotificacionLocal(mensaje, tipo = 'info') {
    try {
      console.log('📝 [FAMILIA] Creando notificación:', mensaje);
      
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
      
      console.log('✅ [FAMILIA] Notificación creada:', nuevaNotificacion);
      
      // Intentar enviar al backend
      this.enviarAlBackend(nuevaNotificacion);
      
      return nuevaNotificacion;
    } catch (error) {
      console.error('❌ Error creando notificación local:', error);
      return null;
    }
  },

  // Enviar notificación al backend Django
  async enviarAlBackend(notificacion) {
    try {
      const datosBackend = {
        mensaje: notificacion.mensaje,
        leida: notificacion.leida,
        tipo: notificacion.tipo,
        usuario: notificacion.usuario
      };
      
      await API.post('notificaciones/', datosBackend);
      console.log('✅ [FAMILIA] Notificación enviada al backend');
    } catch (error) {
      console.warn('⚠️ [FAMILIA] No se pudo enviar al backend:', error.message);
    }
  },
  
  // Notificaciones específicas para familias
  crearNotificacionNuevaFamilia(familiaNombre) {
    console.log('🏠 Creando notificación para nueva familia:', familiaNombre);
    return this.crearNotificacionLocal(`Nueva familia creada: ${familiaNombre}`, 'success');
  },
  
  crearNotificacionUnirseFamilia(familiaNombre) {
    console.log('👥 Creando notificación para unirse a familia:', familiaNombre);
    return this.crearNotificacionLocal(`Te has unido a la familia: ${familiaNombre}`, 'info');
  },
  
  crearNotificacionFamiliaEliminada(familiaNombre) {
    console.log('🗑️ Creando notificación para familia eliminada:', familiaNombre);
    return this.crearNotificacionLocal(`Familia eliminada: ${familiaNombre}`, 'warning');
  },
  
  crearNotificacionMiembroAgregado(nombreMiembro, familiaNombre) {
    console.log('➕ Creando notificación para miembro agregado:', nombreMiembro);
    return this.crearNotificacionLocal(`${nombreMiembro} se ha unido a la familia ${familiaNombre}`, 'success');
  },
  
  crearNotificacionMiembroEliminado(nombreMiembro, familiaNombre) {
    console.log('➖ Creando notificación para miembro eliminado:', nombreMiembro);
    return this.crearNotificacionLocal(`${nombreMiembro} ha sido removido de la familia ${familiaNombre}`, 'warning');
  },
  
  crearNotificacionRolCambiado(nombreMiembro, familiaNombre, nuevoRol) {
    console.log('🔄 Creando notificación para cambio de rol:', nombreMiembro);
    return this.crearNotificacionLocal(`${nombreMiembro} ahora es ${nuevoRol} en la familia ${familiaNombre}`, 'info');
  }
};

// Obtener usuario actual
const getUsuarioDesdeStorage = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData);
    }
  } catch (error) {
    console.warn('Error obteniendo usuario:', error);
  }
  
  return {
    id: 1,
    first_name: "Usuario",
    last_name: "Demo", 
    email: "usuario@demo.com"
  };
};

export const familiasService = {
  // Obtener todas las familias
  getFamilias: async () => {
    try {
      const response = await API.get('familias/');
      console.log('✅ Familias cargadas:', response.data);
      
      if (Array.isArray(response.data)) {
        return response.data.map(familia => ({
          idFamilia: familia.id,
          nombreFamilia: familia.nombre,
          codigoInvitacion: familia.codigo_invitacion,
          fechaCreacion: familia.fecha_creacion,
          cantidadMiembros: familia.cantidad_miembros || 1,
          cantidadPlantas: familia.cantidad_plantas || 0,
          esAdmin: familia.es_admin || true
        }));
      }
      
      console.warn('⚠️ Response.data no es un array:', response.data);
      return [];
      
    } catch (error) {
      console.error('❌ Error cargando familias:', error);
      return [];
    }
  },

  // ===== CREAR FAMILIA - CON NOTIFICACIÓN =====
  crearFamilia: async (familiaData) => {
    try {
      console.log('🏠 [CREAR] Creando familia con datos:', familiaData);
      
      const response = await API.post('familias/crear_familia/', {
        nombre_familia: familiaData.nombreFamilia
      });
      
      console.log('✅ [CREAR] Respuesta del backend:', response.data);
      
      if (response.data.success) {
        const familia = response.data.familia;
        
        // AGREGADO: Crear notificación automática
        NotificacionServiceLocal.crearNotificacionNuevaFamilia(familiaData.nombreFamilia);
        
        return {
          idFamilia: familia.id,
          nombreFamilia: familia.nombre,
          codigoInvitacion: familia.codigo_invitacion,
          fechaCreacion: familia.fecha_creacion,
          cantidadMiembros: familia.cantidad_miembros || 1,
          cantidadPlantas: familia.cantidad_plantas || 0,
          esAdmin: true
        };
      } else {
        throw new Error(response.data.error || 'Error al crear la familia');
      }
      
    } catch (error) {
      console.error('❌ [CREAR] Error creando familia:', error);
      
      let mensajeError = 'No se pudo crear la familia. Intenta nuevamente.';
      
      if (error.response?.data?.error) {
        mensajeError = error.response.data.error;
      } else if (error.response?.data?.detalles) {
        mensajeError = Object.values(error.response.data.detalles).join(', ');
      } else if (error.message) {
        mensajeError = error.message;
      }
      
      throw new Error(mensajeError);
    }
  },

  // ===== UNIRSE A FAMILIA - CON NOTIFICACIÓN =====
  unirseAFamilia: async (codigoInvitacion) => {
    try {
      console.log('👥 [UNIRSE] Intentando unirse con código:', codigoInvitacion);
      
      codigoInvitacion = codigoInvitacion.trim().toUpperCase();
      
      const response = await API.post('familias/unirse_familia/', {
        codigo_invitacion: codigoInvitacion
      });
      
      console.log('✅ [UNIRSE] Respuesta del backend:', response.data);
      
      if (response.data.success) {
        // AGREGADO: Crear notificación automática
        const familiaNombre = response.data.familia?.nombre || 'una familia';
        NotificacionServiceLocal.crearNotificacionUnirseFamilia(familiaNombre);
        
        return {
          success: true,
          mensaje: response.data.mensaje,
          familia: response.data.familia
        };
      } else {
        const mensajeError = response.data.error || 'Error al unirse a la familia';
        throw new Error(mensajeError);
      }
      
    } catch (error) {
      console.error('❌ [UNIRSE] Error uniéndose a familia:', error);
      
      let mensajeUsuario = 'Error al unirse a la familia';
      
      if (error.response?.data?.error) {
        const errorBackend = error.response.data.error;
        
        if (errorBackend.includes('Ya eres miembro')) {
          mensajeUsuario = 'Ya eres miembro de esta familia.';
        } else if (errorBackend.includes('Código de invitación inválido')) {
          mensajeUsuario = 'Código de invitación incorrecto. Verifica el código.';
        } else if (errorBackend.includes('requerido')) {
          mensajeUsuario = 'Debes ingresar un código de invitación.';
        } else {
          mensajeUsuario = errorBackend;
        }
      } else if (error.message) {
        mensajeUsuario = error.message;
      }
      
      console.log('📢 Mensaje para usuario:', mensajeUsuario);
      throw new Error(mensajeUsuario);
    }
  },

  // Obtener familia específica
  getFamilia: async (id) => {
    try {
      const response = await API.get(`familias/${id}/`);
      const familia = response.data;
      
      return {
        idFamilia: familia.id,
        nombreFamilia: familia.nombre,
        codigoInvitacion: familia.codigo_invitacion,
        fechaCreacion: familia.fecha_creacion,
        cantidadMiembros: familia.cantidad_miembros || 1,
        cantidadPlantas: familia.cantidad_plantas || 0,
        esAdmin: familia.es_admin || true,
        miembros: familia.miembros || []
      };
    } catch (error) {
      console.error('❌ Error cargando familia:', error);
      throw error;
    }
  },

  // Obtener miembros de familia
  getMiembros: async (idFamilia) => {
    try {
      console.log(`🔍 Obteniendo miembros para familia ${idFamilia}...`);
      
      const response = await API.get(`familias/${idFamilia}/`);
      const familia = response.data;
      
      console.log('📊 Familia completa del backend:', familia);
      
      let miembrosReales = [];
      
      if (familia.miembros && Array.isArray(familia.miembros)) {
        console.log('✅ Miembros crudos del backend:', familia.miembros);
        
        miembrosReales = familia.miembros.map((miembro, index) => {
          console.log(`👤 Miembro ${index} crudo:`, miembro);
          
          const usuarioInfo = miembro.usuario_info || miembro.usuario || {};
          console.log(`👤 Usuario info:`, usuarioInfo);
          
          return {
            idUsuario: usuarioInfo.id || miembro.usuario || miembro.usuario_id || (index + 1),
            nombre: usuarioInfo.first_name || 'Usuario',
            apellido: usuarioInfo.last_name || `Miembro ${index}`,
            email: usuarioInfo.email || `usuario${index}@demo.com`,
            nombreRol: miembro.es_administrador ? 'Administrador' : 'Miembro',
            esAdministrador: miembro.es_administrador || false,
            fechaUnion: miembro.fecha_union || new Date().toISOString(),
            _rawData: miembro,
            _usuarioInfo: usuarioInfo
          };
        });
      }
      
      console.log('👥 Miembros procesados:', miembrosReales);
      return miembrosReales;
      
    } catch (error) {
      console.error('❌ Error cargando miembros:', error);
      return [];
    }
  },

  // Obtener usuario actual
  getUsuarioActual: async () => {
    const usuario = getUsuarioDesdeStorage();
    return {
      idUsuario: usuario.id,
      id: usuario.id,
      first_name: usuario.first_name,
      last_name: usuario.last_name,
      email: usuario.email
    };
  },

  // Verificar si es admin
  esAdministrador: async (idFamilia) => {
    try {
      const response = await API.get(`familias/${idFamilia}/`);
      return response.data.es_admin || false;
    } catch (error) {
      console.warn('⚠️ Error verificando admin:', error);
      return true;
    }
  },

  // ===== AGREGAR MIEMBRO - CON NOTIFICACIÓN =====
  agregarMiembro: async (idFamilia, emailUsuario, esAdministrador = false) => {
    try {
      console.log(`➕ [AGREGAR] Intentando agregar miembro ${emailUsuario} a familia ${idFamilia}`);
      
      // Primero obtener nombre de la familia
      let familiaNombre = 'la familia';
      try {
        const familiaResponse = await API.get(`familias/${idFamilia}/`);
        familiaNombre = familiaResponse.data.nombre;
      } catch (error) {
        console.warn('No se pudo obtener nombre de la familia:', error);
      }
      
      // Luego agregar el miembro (simulado por ahora)
      // En un futuro, cuando tengas el endpoint, sería:
      // const response = await API.post(`familias/${idFamilia}/agregar_miembro/`, {
      //   usuario_email: emailUsuario,
      //   es_administrador: esAdministrador
      // });
      
      console.log(`✅ [AGREGAR] Miembro ${emailUsuario} agregado a familia ${idFamilia} (simulado)`);
      
      // AGREGADO: Crear notificación automática
      NotificacionServiceLocal.crearNotificacionMiembroAgregado(emailUsuario, familiaNombre);
      
      return {
        success: true,
        message: `Invitación enviada a ${emailUsuario}`,
        email: emailUsuario,
        familiaNombre: familiaNombre
      };
      
    } catch (error) {
      console.error('❌ [AGREGAR] Error agregando miembro:', error);
      
      // AGREGADO: Notificación de error
      NotificacionServiceLocal.crearNotificacionLocal(
        `Error al intentar agregar miembro ${emailUsuario}`, 
        'error'
      );
      
      throw new Error('No se pudo agregar el miembro. Funcionalidad requiere backend.');
    }
  },

  // ===== CAMBIAR ROL MIEMBRO - CON NOTIFICACIÓN =====
  cambiarRolMiembro: async (idFamilia, idUsuario, nuevoRol) => {
    try {
      console.log(`🔄 [ROL] Cambiando rol del usuario ${idUsuario} en familia ${idFamilia} a ${nuevoRol}`);
      
      // Obtener información del miembro y familia
      let nombreMiembro = 'Usuario';
      let familiaNombre = 'la familia';
      
      try {
        const miembros = await this.getMiembros(idFamilia);
        const miembro = miembros.find(m => m.idUsuario === idUsuario);
        if (miembro) {
          nombreMiembro = `${miembro.nombre} ${miembro.apellido}`;
        }
        
        const familiaResponse = await API.get(`familias/${idFamilia}/`);
        familiaNombre = familiaResponse.data.nombre;
      } catch (error) {
        console.warn('No se pudo obtener información:', error);
      }
      
      // Aquí iría la llamada real al backend cuando tengas el endpoint
      // const response = await API.post(`familias/${idFamilia}/cambiar_rol_miembro/`, {
      //   id_usuario: idUsuario,
      //   es_administrador: nuevoRol
      // });
      
      console.log(`✅ [ROL] Rol cambiado para ${nombreMiembro} en ${familiaNombre}`);
      
      // AGREGADO: Crear notificación automática
      const textoRol = nuevoRol ? 'Administrador' : 'Miembro';
      NotificacionServiceLocal.crearNotificacionRolCambiado(nombreMiembro, familiaNombre, textoRol);
      
      return {
        success: true,
        message: `Rol cambiado para ${nombreMiembro}`,
        miembro: nombreMiembro,
        nuevoRol: textoRol
      };
      
    } catch (error) {
      console.error('❌ [ROL] Error cambiando rol:', error);
      throw error;
    }
  },

  // ===== ELIMINAR MIEMBRO - CON NOTIFICACIÓN =====
  eliminarMiembro: async (idFamilia, idUsuario) => {
    try {
      console.log(`➖ [ELIMINAR] Eliminando miembro ${idUsuario} de familia ${idFamilia}`);
      
      // Obtener información del miembro y familia antes de eliminar
      let nombreMiembro = 'Usuario';
      let familiaNombre = 'la familia';
      
      try {
        const miembros = await this.getMiembros(idFamilia);
        const miembro = miembros.find(m => m.idUsuario === idUsuario);
        if (miembro) {
          nombreMiembro = `${miembro.nombre} ${miembro.apellido}`;
        }
        
        const familiaResponse = await API.get(`familias/${idFamilia}/`);
        familiaNombre = familiaResponse.data.nombre;
      } catch (error) {
        console.warn('No se pudo obtener información:', error);
      }
      
      // LLAMADA REAL AL BACKEND
      const response = await API.post(
        `familias/${idFamilia}/eliminar_miembro/`,
        { id_usuario: idUsuario }
      );
      
      console.log('✅ [ELIMINAR] Respuesta del backend:', response.data);
      
      // AGREGADO: Crear notificación automática
      NotificacionServiceLocal.crearNotificacionMiembroEliminado(nombreMiembro, familiaNombre);
      
      return response.data;
      
    } catch (error) {
      console.error('❌ [ELIMINAR] Error eliminando miembro:', error);
      
      if (error.response) {
        let errorMessage = 'Error al eliminar miembro';
        
        if (error.response.status === 403) {
          errorMessage = 'No tienes permisos para eliminar miembros';
        } else if (error.response.status === 400) {
          errorMessage = error.response.data.error || 'Solicitud inválida';
        } else if (error.response.status === 404) {
          errorMessage = 'Miembro no encontrado';
        }
        
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  },

  // ===== ELIMINAR FAMILIA - CON NOTIFICACIÓN =====
  eliminarFamilia: async (idFamilia) => {
    try {
      console.log(`🗑️ [FAMILIA] Eliminando familia ${idFamilia}`);
      
      // Obtener nombre de la familia antes de eliminar
      let familiaNombre = 'Familia';
      try {
        const familiaResponse = await API.get(`familias/${idFamilia}/`);
        familiaNombre = familiaResponse.data.nombre;
      } catch (error) {
        console.warn('No se pudo obtener nombre de la familia:', error);
      }
      
      // Aquí iría la llamada real al backend cuando tengas el endpoint
      // const response = await API.delete(`familias/${idFamilia}/`);
      
      console.log(`✅ [FAMILIA] Familia "${familiaNombre}" eliminada (simulado)`);
      
      // AGREGADO: Crear notificación automática
      NotificacionServiceLocal.crearNotificacionFamiliaEliminada(familiaNombre);
      
      return {
        success: true,
        message: `Familia "${familiaNombre}" eliminada`,
        familiaNombre: familiaNombre
      };
      
    } catch (error) {
      console.error('❌ [FAMILIA] Error eliminando familia:', error);
      
      // AGREGADO: Notificación de error
      NotificacionServiceLocal.crearNotificacionLocal(
        `Error al intentar eliminar la familia`, 
        'error'
      );
      
      throw new Error('No se pudo eliminar la familia. Funcionalidad requiere backend.');
    }
  },

  // Generar código de invitación
  generarCodigoInvitacion: async (idFamilia) => {
    try {
      const response = await API.post(`familias/${idFamilia}/generar_codigo_invitacion/`);
      return response.data;
    } catch (error) {
      console.error('❌ Error generando código:', error);
      throw error;
    }
  }
};