// src/services/familiasService.js - VERSIÓN CORREGIDA
import API from './api';

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

  // CREAR FAMILIA - USAR ENDPOINT CORRECTO
  crearFamilia: async (familiaData) => {
    try {
      console.log('🆕 Creando familia con datos:', familiaData);
      
      // USAR EL ENDPOINT ESPECÍFICO PARA CREAR FAMILIA
      // Este endpoint automáticamente te agrega como administrador
      const response = await API.post('familias/crear_familia/', {
        nombre_familia: familiaData.nombreFamilia  // Nota: nombre_familia (no nombre)
      });
      
      console.log('✅ Respuesta del backend:', response.data);
      
      if (response.data.success) {
        // El backend ya te incluye como miembro administrador
        const familia = response.data.familia;
        
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
      console.error('❌ Error creando familia:', error);
      
      // Mensajes de error específicos
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

  // UNIRSE A FAMILIA - VERSIÓN CORREGIDA
  unirseAFamilia: async (codigoInvitacion) => {
    try {
      console.log('🔍 [FRONTEND] Intentando unirse con código:', codigoInvitacion);
      
      // Limpiar y formatear el código
      codigoInvitacion = codigoInvitacion.trim().toUpperCase();
      
      const response = await API.post('familias/unirse_familia/', {
        codigo_invitacion: codigoInvitacion
      });
      
      console.log('✅ [FRONTEND] Respuesta del backend:', response.data);
      
      if (response.data.success) {
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
      console.error('❌ [FRONTEND] Error uniéndose a familia:', error);
      
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

  // getMiembros
// EN familiasService.js - CORRIGE la función getMiembros:

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
        // DEBUG: Ver qué datos vienen realmente
        console.log(`👤 Miembro ${index} crudo:`, miembro);
        
        // ¡CORRECCIÓN! Usar usuario_info en lugar de usuario
        const usuarioInfo = miembro.usuario_info || miembro.usuario || {};
        console.log(`👤 Usuario info:`, usuarioInfo);
        
        return {
          // ID del usuario (no de la relación)
          idUsuario: usuarioInfo.id || miembro.usuario || miembro.usuario_id || (index + 1),
          nombre: usuarioInfo.first_name || 'Usuario',
          apellido: usuarioInfo.last_name || `Miembro ${index}`,
          email: usuarioInfo.email || `usuario${index}@demo.com`,
          nombreRol: miembro.es_administrador ? 'Administrador' : 'Miembro',
          esAdministrador: miembro.es_administrador || false,
          fechaUnion: miembro.fecha_union || new Date().toISOString(),
          // Datos originales para debug
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

  // Función para agregar miembro
  agregarMiembro: async (idFamilia, emailUsuario, esAdministrador = false) => {
    try {
      console.log(`🔄 Intentando agregar miembro ${emailUsuario} a familia ${idFamilia}`);
      
      // Necesitarías un endpoint en el backend para esto
      const response = await API.post(`familias/${idFamilia}/agregar_miembro/`, {
        usuario_email: emailUsuario,
        es_administrador: esAdministrador
      });
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Error agregando miembro:', error);
      throw new Error('No se pudo agregar el miembro. Funcionalidad requiere backend.');
    }
  },

  // Funciones para gestionar miembros
  cambiarRolMiembro: async (idFamilia, idUsuario, nuevoRol) => {
    try {
      const response = await API.post(`familias/${idFamilia}/cambiar_rol_miembro/`, {
        id_usuario: idUsuario,
        es_administrador: nuevoRol
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error cambiando rol:', error);
      throw error;
    }
  },

  // EN familiasService.js - REEMPLAZA eliminarMiembro con ESTA VERSIÓN:

eliminarMiembro: async (idFamilia, idUsuario) => {
  try {
    console.log(`🚀 [ELIMINAR] Enviando POST a: familias/${idFamilia}/eliminar_miembro/`);
    console.log(`📦 Datos: { id_usuario: ${idUsuario} }`);
    
    // Obtener token para debug
    const token = localStorage.getItem('token');
    console.log(`🔑 Token: ${token?.substring(0, 10)}...`);
    
    // LLAMADA SIMPLE Y DIRECTA
    const response = await API.post(
      `familias/${idFamilia}/eliminar_miembro/`,
      {
        id_usuario: idUsuario  // IMPORTANTE: guión bajo
      }
    );
    
    console.log('✅ Respuesta del backend:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('❌ Error eliminando miembro:', error);
    
    // DEBUG DETALLADO
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Data:', error.response.data);
      console.error('📋 Headers:', error.response.headers);
      
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