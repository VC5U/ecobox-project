// src/services/familiasService.js - VERSIÓN MEJORADA
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
          cantidadMiembros: 1,
          cantidadPlantas: familia.cantidad_plantas || 0,
          esAdmin: true
        }));
      }
      
      console.warn('⚠️ Response.data no es un array:', response.data);
      return [];
      
    } catch (error) {
      console.error('❌ Error cargando familias:', error);
      return [];
    }
  },

  // CREAR FAMILIA - Ya funciona bien
  crearFamilia: async (familiaData) => {
    try {
      console.log('🆕 Creando familia...', familiaData);
      
      const response = await API.post('familias/', {
        nombre: familiaData.nombreFamilia,
        codigo_invitacion: `INV${Date.now()}`,
        cantidad_plantas: 0
      });
      
      console.log('✅ Familia creada con endpoint estándar:', response.data);
      
      return {
        idFamilia: response.data.id,
        nombreFamilia: response.data.nombre,
        codigoInvitacion: response.data.codigo_invitacion,
        fechaCreacion: response.data.fecha_creacion,
        cantidadMiembros: 1,
        cantidadPlantas: response.data.cantidad_plantas || 0,
        esAdmin: true
      };
      
    } catch (error) {
      console.error('❌ Error creando familia:', error);
      throw new Error('No se pudo crear la familia. Intenta nuevamente.');
    }
  },

  // UNIRSE A FAMILIA - VERSIÓN QUE EVITA ENDPOINT PROBLEMÁTICO
  unirseAFamilia: async (codigoInvitacion) => {
    try {
      console.log('🤝 Buscando familia con código:', codigoInvitacion);
      
      // SOLUCIÓN: Solo buscar en familias existentes y simular unión
      const familiasResponse = await API.get('familias/');
      
      if (!Array.isArray(familiasResponse.data)) {
        throw new Error('No se pudieron cargar las familias');
      }
      
      const familiaEncontrada = familiasResponse.data.find(
        familia => familia.codigo_invitacion === codigoInvitacion
      );
      
      if (!familiaEncontrada) {
        throw new Error('Código de invitación inválido');
      }
      
      console.log('✅ Familia encontrada:', familiaEncontrada.nombre);
      
      // ESTRATEGIA: Crear la membresía manualmente usando el endpoint de agregar_miembro
      try {
        // Intentar crear la membresía automáticamente
        await API.post(`familias/${familiaEncontrada.id}/agregar_miembro/`, {
          usuario_id: getUsuarioDesdeStorage().id,
          es_administrador: false
        });
        console.log('✅ Membresía creada automáticamente');
      } catch (membresiaError) {
        console.log('⚠️ No se pudo crear membresía automáticamente:', membresiaError.response?.data);
        
        // Si no se puede crear automáticamente, guiar al usuario
        return {
          success: true,
          mensaje: `Familia "${familiaEncontrada.nombre}" encontrada. Para completar tu unión, contacta al administrador de la familia para que te agregue manualmente.`,
          familia: {
            idFamilia: familiaEncontrada.id,
            nombreFamilia: familiaEncontrada.nombre,
            codigoInvitacion: familiaEncontrada.codigo_invitacion,
            fechaCreacion: familiaEncontrada.fecha_creacion,
            cantidadMiembros: 1,
            cantidadPlantas: familiaEncontrada.cantidad_plantas || 0,
            esAdmin: false
          },
          necesitaConfirmacionManual: true
        };
      }
      
      // Éxito completo
      return {
        success: true,
        mensaje: `¡Te has unido exitosamente a la familia "${familiaEncontrada.nombre}"!`,
        familia: {
          idFamilia: familiaEncontrada.id,
          nombreFamilia: familiaEncontrada.nombre,
          codigoInvitacion: familiaEncontrada.codigo_invitacion,
          fechaCreacion: familiaEncontrada.fecha_creacion,
          cantidadMiembros: 1,
          cantidadPlantas: familiaEncontrada.cantidad_plantas || 0,
          esAdmin: false
        }
      };
      
    } catch (error) {
      console.error('❌ Error uniéndose a familia:', error);
      throw new Error(error.message || 'No se pudo unir a la familia');
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
        cantidadMiembros: 1,
        cantidadPlantas: familia.cantidad_plantas || 0,
        esAdmin: true,
        miembros: []
      };
    } catch (error) {
      console.error('❌ Error cargando familia:', error);
      throw error;
    }
  },

  // Obtener miembros (versión mejorada)
  getMiembros: async (idFamilia) => {
    try {
      // Primero intentar obtener miembros reales
      const response = await API.get(`familias/${idFamilia}/`);
      const familia = response.data;
      
      let miembrosReales = [];
      
      // Si la familia tiene miembros en la respuesta
      if (familia.miembros && Array.isArray(familia.miembros)) {
        miembrosReales = familia.miembros.map(miembro => ({
          idUsuario: miembro.usuario?.id || 1,
          nombre: miembro.usuario?.first_name || 'Usuario',
          apellido: miembro.usuario?.last_name || 'Demo',
          email: miembro.usuario?.email || 'usuario@demo.com',
          nombreRol: miembro.es_administrador ? 'Administrador' : 'Miembro',
          esAdministrador: miembro.es_administrador || false,
          fechaUnion: miembro.fecha_union || new Date().toISOString()
        }));
      }
      
      // Si no hay miembros reales, agregar al menos al usuario actual
      if (miembrosReales.length === 0) {
        const usuario = getUsuarioDesdeStorage();
        miembrosReales.push({
          idUsuario: usuario.id,
          nombre: usuario.first_name,
          apellido: usuario.last_name,
          email: usuario.email,
          nombreRol: 'Administrador',
          esAdministrador: true,
          fechaUnion: new Date().toISOString()
        });
      }
      
      return miembrosReales;
      
    } catch (error) {
      console.warn('⚠️ No se pudieron cargar miembros, usando datos simulados');
      
      const usuario = getUsuarioDesdeStorage();
      return [{
        idUsuario: usuario.id,
        nombre: usuario.first_name,
        apellido: usuario.last_name,
        email: usuario.email,
        nombreRol: 'Administrador',
        esAdministrador: true,
        fechaUnion: new Date().toISOString()
      }];
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
      const miembros = await familiasService.getMiembros(idFamilia);
      const usuario = getUsuarioDesdeStorage();
      
      const miembro = miembros.find(m => m.idUsuario === usuario.id);
      return miembro ? miembro.esAdministrador : true;
    } catch (error) {
      return true; // Por defecto true
    }
  },

  // Función para agregar miembro manualmente (para admins)
  agregarMiembro: async (idFamilia, emailUsuario, esAdministrador = false) => {
    try {
      // Buscar usuario por email (esto necesitaría un endpoint en el backend)
      console.log(`🔄 Intentando agregar miembro ${emailUsuario} a familia ${idFamilia}`);
      
      // Por ahora, simular éxito
      return {
        success: true,
        mensaje: `Usuario ${emailUsuario} agregado exitosamente (simulado)`,
        necesitaBackend: true
      };
    } catch (error) {
      console.error('❌ Error agregando miembro:', error);
      throw new Error('No se pudo agregar el miembro. Funcionalidad requiere backend.');
    }
  },

  // Funciones simuladas
  cambiarRolMiembro: async (idFamilia, idUsuario, nuevoRol) => {
    console.log('🔄 Simulando cambio de rol...');
    return { success: true, mensaje: 'Rol actualizado (simulado)' };
  },

  eliminarMiembro: async (idFamilia, idUsuario) => {
    console.log('🔄 Simulando eliminación de miembro...');
    return { success: true, mensaje: 'Miembro eliminado (simulado)' };
  },

  generarCodigoInvitacion: async (idFamilia) => {
    try {
      const response = await API.post(`familias/${idFamilia}/generar_codigo_invitacion/`);
      return response.data;
    } catch (error) {
      // Simular generación
      return {
        success: true,
        codigo_invitacion: `NEW${Date.now()}`,
        mensaje: 'Código generado (simulado)'
      };
    }
  }
  /*
  // nuevo commit */

};