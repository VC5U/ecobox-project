// src/components/familia/Familia.js
import React, { useState, useEffect } from 'react';
import { familiasService } from '../../services/familiasService';
import { authService } from '../../services/authService';
import CrearFamiliaModal from './CrearFamiliaModal';
import UnirseFamiliaModal from './UnirseFamiliaModal';
import MiembrosFamilia from './MiembrosFamilia';
import './Familia.css';

function Familia() {
  // Estados
  const [familias, setFamilias] = useState([]);
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState(null);
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usuarioActual, setUsuarioActual] = useState(null);
  
  // Estados para modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modalUnirseAbierto, setModalUnirseAbierto] = useState(false);
  const [modalLoginAbierto, setModalLoginAbierto] = useState(false);
  const [estaAutenticado, setEstaAutenticado] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const verificarAutenticacion = async () => {
      const autenticado = authService.isAuthenticated();
      setEstaAutenticado(autenticado);
      
      if (autenticado) {
        await cargarDatos();
        const usuario = await familiasService.getUsuarioActual();
        setUsuarioActual(usuario);
      } else {
        setModalLoginAbierto(true);
      }
    };
    
    verificarAutenticacion();
  }, []);

  // Cargar todas las familias
  const cargarFamilias = async () => {
    try {
      setLoading(true);
      const data = await familiasService.getFamilias();
      setFamilias(data);
      
      // Seleccionar primera familia si hay
      if (data.length > 0 && !familiaSeleccionada) {
        setFamiliaSeleccionada(data[0]);
        await cargarMiembros(data[0].idFamilia);
      }
      
      return data;
    } catch (error) {
      console.error('Error cargando familias:', error);
      setError('Error al cargar las familias');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Cargar miembros de una familia
  const cargarMiembros = async (idFamilia) => {
    try {
      const data = await familiasService.getMiembros(idFamilia);
      setMiembros(data);
      return data;
    } catch (error) {
      console.error('Error cargando miembros:', error);
      setMiembros([]);
      return [];
    }
  };

  // Cargar todos los datos
  const cargarDatos = async () => {
    const familiasCargadas = await cargarFamilias();
    if (familiasCargadas.length > 0 && familiaSeleccionada) {
      await cargarMiembros(familiaSeleccionada.idFamilia);
    }
  };

  // Verificar si es admin
  const esAdmin = async (idFamilia) => {
    try {
      return await familiasService.esAdministrador(idFamilia);
    } catch (error) {
      console.warn('Error verificando admin:', error);
      return false;
    }
  };

  // Crear nueva familia
  const handleCrearFamilia = async (familiaData) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Creando familia con datos:', familiaData);
      
      const nuevaFamilia = await familiasService.crearFamilia(familiaData);
      console.log('Familia creada:', nuevaFamilia);
      
      // Actualizar lista de familias
      await cargarFamilias();
      
      // Seleccionar la nueva familia
      setFamiliaSeleccionada(nuevaFamilia);
      await cargarMiembros(nuevaFamilia.idFamilia);
      
      setModalCrearAbierto(false);
      
      return { success: true, mensaje: 'Familia creada exitosamente' };
      
    } catch (error) {
      console.error('Error creando familia:', error);
      const mensajeError = error.message || 'Error al crear la familia';
      setError(mensajeError);
      return { success: false, mensaje: mensajeError };
    } finally {
      setLoading(false);
    }
  };

  // Unirse a familia
  const handleUnirseFamilia = async (codigoInvitacion) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Uniéndose con código:', codigoInvitacion);
      
      const resultado = await familiasService.unirseAFamilia(codigoInvitacion);
      console.log('Resultado unión:', resultado);
      
      if (resultado.success) {
        // Actualizar lista de familias
        await cargarFamilias();
        setModalUnirseAbierto(false);
        
        if (resultado.familia) {
          setFamiliaSeleccionada(resultado.familia);
          await cargarMiembros(resultado.familia.idFamilia);
        }
      }
      
      return resultado;
      
    } catch (error) {
      console.error('Error uniéndose a familia:', error);
      const mensajeError = error.message || 'Error al unirse a la familia';
      setError(mensajeError);
      return { success: false, mensaje: mensajeError };
    } finally {
      setLoading(false);
    }
  };

  // Cambiar rol de miembro
  const handleCambiarRolMiembro = async (idFamilia, idUsuario, nuevoRol) => {
    try {
      setError('');
      const resultado = await familiasService.cambiarRolMiembro(idFamilia, idUsuario, nuevoRol);
      
      if (resultado.success) {
        // Actualizar miembros
        await cargarMiembros(idFamilia);
      }
      
      return resultado;
    } catch (error) {
      console.error('Error cambiando rol:', error);
      setError('Error al cambiar el rol del miembro');
      throw error;
    }
  };

  // Eliminar miembro
  const handleEliminarMiembro = async (idFamilia, idUsuario) => {
    try {
      setError('');
      const resultado = await familiasService.eliminarMiembro(idFamilia, idUsuario);
      
      if (resultado.success) {
        // Actualizar miembros
        await cargarMiembros(idFamilia);
      }
      
      return resultado;
    } catch (error) {
      console.error('Error eliminando miembro:', error);
      setError('Error al eliminar el miembro');
      throw error;
    }
  };

  // Generar código de invitación
  const handleGenerarCodigoInvitacion = async (idFamilia) => {
    try {
      setError('');
      return await familiasService.generarCodigoInvitacion(idFamilia);
    } catch (error) {
      console.error('Error generando código:', error);
      setError('Error al generar código de invitación');
      throw error;
    }
  };

  // Login
  const handleLogin = async (userData) => {
    setEstaAutenticado(true);
    setModalLoginAbierto(false);
    await cargarDatos();
    const usuario = await familiasService.getUsuarioActual();
    setUsuarioActual(usuario);
  };

  // Logout
  const handleLogout = () => {
    authService.logout();
    setEstaAutenticado(false);
    setFamilias([]);
    setFamiliaSeleccionada(null);
    setMiembros([]);
    setUsuarioActual(null);
    setModalLoginAbierto(true);
  };

  // Seleccionar familia
  const handleSeleccionarFamilia = async (familia) => {
    setFamiliaSeleccionada(familia);
    await cargarMiembros(familia.idFamilia);
  };

  // Si no está autenticado
  if (!estaAutenticado) {
    return (
      <div className="familia-unauthorized">
        <div className="familia-unauthorized__content">
          <h1>Acceso Requerido</h1>
          <p>Por favor inicia sesión para acceder a las familias</p>
          <button
            onClick={() => setModalLoginAbierto(true)}
            className="familia-unauthorized__login-btn"
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  // Mostrar loading
  if (loading && familias.length === 0) {
    return (
      <div className="familia-container">
        <div className="familia-loading">
          <div className="familia-loading__spinner"></div>
          <p>Cargando familias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="familia-container">
      {/* Mostrar error */}
      {error && (
        <div className="familia-error-banner">
          <span>{error}</span>
          <button onClick={cargarDatos}>Reintentar</button>
        </div>
      )}

      {/* Header */}
      <div className="familia-main-header">
        <div className="familia-main-header__left">
          <h1 className="familia-main-header__title">Mis Familias</h1>
          <p className="familia-main-header__subtitle">
            Gestiona las familias a las que perteneces y sus miembros
          </p>
        </div>
        
        <div className="familia-main-header__right">
          <div className="familia-main-header__actions">
            <button
              onClick={() => setModalUnirseAbierto(true)}
              disabled={loading}
              className="familia-main-header__action-btn familia-main-header__action-btn--secondary"
            >
              Unirse a Familia
            </button>
            <button
              onClick={() => setModalCrearAbierto(true)}
              disabled={loading}
              className="familia-main-header__action-btn"
            >
              Crear Familia
            </button>
            {/* Botón de cerrar sesión 
            <button
              onClick={handleLogout}
              className="familia-main-header__action-btn familia-main-header__action-btn--logout"
            >
              Cerrar Sesión
            </button>
            */}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="familia-content-wrapper">
        {/* Lista de familias */}
        <div className="familia-list">
          <div className="familia-list__header">
            <h3>Tus Familias</h3>
            <span className="familia-list__count">{familias.length}</span>
          </div>
          
          {familias.length > 0 ? (
            <div className="familia-list__items">
              {familias.map(familia => (
                <div
                  key={familia.idFamilia}
                  className={`familia-list__item ${
                    familiaSeleccionada?.idFamilia === familia.idFamilia 
                      ? 'familia-list__item--active' 
                      : ''
                  }`}
                  onClick={() => handleSeleccionarFamilia(familia)}
                >
                  <div className="familia-list__item-avatar">
                    {familia.nombreFamilia.charAt(0).toUpperCase()}
                  </div>
                  <div className="familia-list__item-content">
                    <h4 className="familia-list__item-name">
                      {familia.nombreFamilia}
                      {familia.esAdmin && (
                        <span className="familia-list__item-admin-badge">Admin</span>
                      )}
                    </h4>
                    <div className="familia-list__item-stats">
                      <span className="familia-list__item-stat">
                        {familia.cantidadMiembros} miembros
                      </span>
                      <span className="familia-list__item-stat">
                        {familia.cantidadPlantas} plantas
                      </span>
                    </div>
                    <div className="familia-list__item-code">
                      Código: {familia.codigoInvitacion}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="familia-list__empty">
              <p>No tienes familias. ¡Crea una nueva o únete a una existente!</p>
              <div className="familia-list__empty-actions">
                <button
                  onClick={() => setModalCrearAbierto(true)}
                  className="familia-list__empty-btn"
                >
                  Crear Primera Familia
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detalles de la familia seleccionada */}
        <div className="familia-details">
          {familiaSeleccionada ? (
            <>
              <div className="familia-details__header">
                <h2 className="familia-details__title">
                  {familiaSeleccionada.nombreFamilia}
                </h2>
                <div className="familia-details__info">
                  <span className="familia-details__code">
                    Código: {familiaSeleccionada.codigoInvitacion}
                  </span>
                  <span className="familia-details__date">
                    Creada: {new Date(familiaSeleccionada.fechaCreacion).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Componente MiembrosFamilia */}
              <MiembrosFamilia
                miembros={miembros}
                familia={familiaSeleccionada}
                onMiembroActualizado={() => cargarMiembros(familiaSeleccionada.idFamilia)}
              />

              {/* Información adicional */}
              <div className="familia-details__additional">
                <div className="familia-details__stat">
                  <span className="familia-details__stat-value">
                    {miembros.length}
                  </span>
                  <span className="familia-details__stat-label">Miembros totales</span>
                </div>
                <div className="familia-details__stat">
                  <span className="familia-details__stat-value">
                    {familiaSeleccionada.cantidadPlantas}
                  </span>
                  <span className="familia-details__stat-label">Plantas registradas</span>
                </div>
              </div>
            </>
          ) : (
            <div className="familia-details__empty">
              <p>Selecciona una familia para ver sus detalles</p>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      <CrearFamiliaModal
        show={modalCrearAbierto}
        onClose={() => setModalCrearAbierto(false)}
        onConfirm={handleCrearFamilia}
        loading={loading}
      />

      <UnirseFamiliaModal
        show={modalUnirseAbierto}
        onClose={() => setModalUnirseAbierto(false)}
        onConfirm={handleUnirseFamilia}
        loading={loading}
      />

      {/* Modal de Login simple */}
      {modalLoginAbierto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Iniciar Sesión</h3>
            <p>Esta funcionalidad requiere autenticación</p>
            <div className="modal-actions">
              <button
                onClick={() => {
                  // Simular login exitoso para desarrollo
                  authService.login({ email: 'usuario@demo.com' });
                  handleLogin({ email: 'usuario@demo.com' });
                }}
                className="modal-confirm-btn"
              >
                Iniciar Sesión (Demo)
              </button>
              <button
                onClick={() => setModalLoginAbierto(false)}
                className="modal-cancel-btn"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Familia;