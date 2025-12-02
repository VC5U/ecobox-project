// src/components/familia/Familia.js
import React, { useState, useEffect } from 'react';
import { useFamilias } from '../../hooks/useFamilias';
import { authService } from '../../services/authService';
import FamiliaCard from './FamiliaCard/FamiliaCard';
import MiembroCard from './MiembroCard/MiembroCard';
import ModalInvitacion from './ModalInvitacion/ModalInvitacion';
import LoginModal from './LoginModal/LoginModal';
import DebugInfo from './DebugInfo';
import PlantasResumen from './PlantasResumen/PlantasResumen';
import './Familia.css';

function Familia() {
  const [modalInvitacionAbierto, setModalInvitacionAbierto] = useState(false);
  const [modalLoginAbierto, setModalLoginAbierto] = useState(false);
  const [modalUnirseAbierto, setModalUnirseAbierto] = useState(false);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [codigoUnirse, setCodigoUnirse] = useState('');
  const [nombreNuevaFamilia, setNombreNuevaFamilia] = useState('');
  const [estaAutenticado, setEstaAutenticado] = useState(false);

  const {
    familias,
    familiaSeleccionada,
    miembros,
    loading,
    error,
    usuarioActual,
    esAdmin,
    setFamiliaSeleccionada,
    crearFamilia,
    cambiarRolMiembro,
    eliminarMiembro,
    generarCodigoInvitacion,
    unirseAFamilia,
    recargarDatos
  } = useFamilias();

  // Agrega este diagnóstico del hook
  useEffect(() => {
    console.log('🔍 [DIAGNÓSTICO] useFamilias hook:', {
      crearFamilia: !!crearFamilia,
      unirseAFamilia: !!unirseAFamilia,
      recargarDatos: !!recargarDatos,
      familias: familias?.length,
      usuarioActual: !!usuarioActual
    });
  }, [crearFamilia, unirseAFamilia, recargarDatos, familias, usuarioActual]);

  // Verificar autenticación al cargar
  useEffect(() => {
    const autenticado = authService.isAuthenticated();
    setEstaAutenticado(autenticado);
    if (!autenticado) {
      setModalLoginAbierto(true);
    }
  }, []);

  const handleLogin = (userData) => {
    setEstaAutenticado(true);
    setModalLoginAbierto(false);
    recargarDatos();
  };

  const handleLogout = () => {
    authService.logout();
    setEstaAutenticado(false);
    setModalLoginAbierto(true);
  };

  const handleCrearFamilia = async () => {
    console.log('🟡 [DIAGNÓSTICO] handleCrearFamilia EJECUTÁNDOSE');
    console.log('📝 Nombre familia:', nombreNuevaFamilia);
    console.log('🔧 Hook crearFamilia disponible:', !!crearFamilia);
    console.log('👤 Usuario actual:', usuarioActual);
    
    if (!nombreNuevaFamilia.trim()) {
      console.log('🔴 Nombre vacío - Mostrando alerta');
      alert('Por favor ingresa un nombre para la familia');
      return;
    }

    try {
      console.log('🚀 Llamando a crearFamilia...');
      const resultado = await crearFamilia({ nombreFamilia: nombreNuevaFamilia });
      console.log('✅ createFamilia completado:', resultado);
      
      setNombreNuevaFamilia('');
      setModalCrearAbierto(false);
      await recargarDatos();
      alert('¡Familia creada exitosamente!');
    } catch (error) {
      console.error('❌ Error en handleCrearFamilia:', error);
      alert('Error al crear la familia. Por favor intenta nuevamente.');
    }
  };

  // SOLO UNA FUNCIÓN handleUnirseFamilia - ELIMINA LA DUPLICADA
  const handleUnirseFamilia = async () => {
    console.log('🟡 [DIAGNÓSTICO] handleUnirseFamilia EJECUTÁNDOSE');
    console.log('🔑 Código:', codigoUnirse);
    console.log('🔧 Hook unirseAFamilia disponible:', !!unirseAFamilia);
    
    if (!codigoUnirse.trim()) {
      console.log('🔴 Código vacío - Mostrando alerta');
      alert('Por favor ingresa un código de invitación');
      return;
    }

    try {
      console.log('🚀 Llamando a unirseAFamilia...');
      const resultado = await unirseAFamilia(codigoUnirse);
      console.log('✅ unirseAFamilia completado:', resultado);
      
      setCodigoUnirse('');
      setModalUnirseAbierto(false);

      if (resultado && resultado.success) {
        alert('¡Te has unido a la familia exitosamente!');
        await recargarDatos();
      } else {
        alert(resultado?.mensaje || 'Error al unirse a la familia');
      }
    } catch (error) {
      console.error('❌ Error en handleUnirseFamilia:', error);
      alert('Error al unirse a la familia. Verifica el código e intenta nuevamente.');
    }
  };

  // Si no está autenticado, mostrar pantalla de login
  if (!estaAutenticado) {
    return (
      <>
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
        <LoginModal
          isOpen={modalLoginAbierto}
          onClose={() => setModalLoginAbierto(false)}
          onLogin={handleLogin}
        />
      </>
    );
  }

  // Mostrar loading mientras se cargan los datos
  if (loading) {
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
      {/* Mostrar error si existe */}
      {error && (
        <div className="familia-error-banner">
          <span>{error}</span>
          <button onClick={recargarDatos}>Reintentar</button>
        </div>
      )}

      {/* Header principal con layout mejorado */}
      <div className="familia-main-header">
        <div className="familia-main-header__left">
          <h1 className="familia-main-header__title">Mis Familias</h1>
          <p className="familia-main-header__subtitle">
            Gestiona las familias a las que perteneces y sus miembros
          </p>
        </div>
        
        <div className="familia-main-header__right">
          <div className="familia-main-header__actions">
            {/* ELIMINA LOS BOTONES DUPLICADOS - SOLO DEJA UNO DE CADA */}
            <button
              onClick={() => {
                console.log('🟡 Botón "Unirse a Familia" CLICKEADO');
                setModalUnirseAbierto(true);
              }}
              className="familia-main-header__action-btn familia-main-header__action-btn--secondary"
            >
              Unirse a Familia
            </button>
            <button
              onClick={() => {
                console.log('🟡 Botón "Crear Familia" CLICKEADO');
                setModalCrearAbierto(true);
              }}
              className="familia-main-header__action-btn"
            >
              Crear Familia
            </button>
            {familiaSeleccionada && esAdmin && (
              <button
                onClick={() => setModalInvitacionAbierto(true)}
                className="familia-main-header__action-btn familia-main-header__action-btn--primary"
              >
                Invitar Miembro
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Layout principal con sidebar y contenido */}
      <div className="familia-layout">
        {/* Sidebar con lista de familias */}
        <div className="familia-sidebar">
          <div className="familia-sidebar__header">
            <h3 className="familia-sidebar__title">Tus Familias</h3>
            <span className="familia-sidebar__count">{familias?.length || 0}</span>
          </div>
          
          <div className="familia-sidebar__list">
            {familias && familias.length > 0 ? (
              familias.map(familia => {
                // Verificar si el usuario actual es admin de esta familia
                const esAdminFamilia = familia.esAdmin || 
                  miembros.some(m => 
                    m.idUsuario === usuarioActual?.idUsuario && m.esAdministrador
                  );
                
                return (
                  <div 
                    key={familia.idFamilia}
                    className={`familia-sidebar__item ${
                      familiaSeleccionada?.idFamilia === familia.idFamilia ? 'familia-sidebar__item--active' : ''
                    }`}
                    onClick={() => setFamiliaSeleccionada(familia)}
                  >
                    <div className="familia-sidebar__item-avatar">
                      {familia.nombreFamilia.charAt(0).toUpperCase()}
                    </div>
                    <div className="familia-sidebar__item-content">
                      <div className="familia-sidebar__item-header">
                        <h4 className="familia-sidebar__item-name">{familia.nombreFamilia}</h4>
                        <div className="familia-sidebar__item-badges">
                          {esAdminFamilia && (
                            <span className="familia-sidebar__badge familia-sidebar__badge--admin">Admin</span>
                          )}
                          <span className="familia-sidebar__badge familia-sidebar__badge--active">Activa</span>
                        </div>
                      </div>
                      <div className="familia-sidebar__item-stats">
                        <div className="familia-sidebar__stat">
                          <span className="familia-sidebar__stat-value">{familia.cantidadMiembros || 0}</span>
                          <span className="familia-sidebar__stat-label">miembros</span>
                        </div>
                        <div className="familia-sidebar__stat">
                          <span className="familia-sidebar__stat-value">{familia.cantidadPlantas || 0}</span>
                          <span className="familia-sidebar__stat-label">plantas</span>
                        </div>
                      </div>
                      {familia.codigoInvitacion && (
                        <div className="familia-sidebar__item-code">
                          Código: {familia.codigoInvitacion}
                        </div>
                      )}
                      <div className="familia-sidebar__item-date">
                        Creada: {new Date(familia.fechaCreacion).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="familia-empty">
                <div className="familia-empty__content">
                  <svg className="familia-empty__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <h3 className="familia-empty__title">No perteneces a ninguna familia</h3>
                  <p className="familia-empty__description">
                    Únete a una familia existente o crea una nueva para empezar
                  </p>
                  <div className="familia-empty__actions">
                    <button
                      onClick={() => setModalUnirseAbierto(true)}
                      className="familia-empty__action-btn familia-empty__action-btn--secondary"
                    >
                      Unirse a Familia
                    </button>
                    <button
                      onClick={() => setModalCrearAbierto(true)}
                      className="familia-empty__action-btn"
                    >
                      Crear Primera Familia
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contenido principal - Detalles de la familia seleccionada */}
        <div className="familia-content">
          {familiaSeleccionada ? (
            <>
              <div className="familia-details">
                <div className="familia-details__header">
                  <div className="familia-details__info">
                    <h2 className="familia-details__title">
                      {familiaSeleccionada.nombreFamilia}
                    </h2>
                    <p className="familia-details__subtitle">
                      {miembros.length} miembro(s) • {familiaSeleccionada.cantidadPlantas || 0} planta(s)
                    </p>
                  </div>
                  {esAdmin && (
                    <span className="familia-details__admin-badge">
                      Eres Administrador
                    </span>
                  )}
                </div>

                {/* Lista de Miembros */}
                <div className="familia-details__content">
                  <h3 className="familia-details__members-title">Miembros de la Familia</h3>
                  <div className="familia-details__members-list">
                    {miembros && miembros.length > 0 ? (
                      miembros.map(miembro => (
                        <MiembroCard
                          key={`${miembro.idFamilia}-${miembro.idUsuario}`}
                          miembro={miembro}
                          esAdmin={esAdmin}
                          onRoleChange={cambiarRolMiembro}
                          onRemove={eliminarMiembro}
                          currentUserId={usuarioActual?.idUsuario}
                        />
                      ))
                    ) : (
                      <p className="familia-details__no-members">No hay miembros en esta familia</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Información adicional de la familia */}
              <div className="familia-extra-info">
                <div className="familia-extra-info__grid">
                  <PlantasResumen 
                    plantasCount={familiaSeleccionada.cantidadPlantas}
                    familiaId={familiaSeleccionada.idFamilia}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="familia-no-selection">
              <div className="familia-no-selection__content">
                <svg className="familia-no-selection__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="familia-no-selection__title">Selecciona una familia</h3>
                <p className="familia-no-selection__description">
                  Elige una familia de la lista para ver sus detalles y gestionar sus miembros
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Invitación */}
      <ModalInvitacion
        isOpen={modalInvitacionAbierto}
        onClose={() => setModalInvitacionAbierto(false)}
        familia={familiaSeleccionada}
        onGenerateCode={generarCodigoInvitacion}
      />

      {/* Modal de Login */}
      <LoginModal
        isOpen={modalLoginAbierto}
        onClose={() => setModalLoginAbierto(false)}
        onLogin={handleLogin}
      />

      {/* Modal para Unirse a Familia */}
      {modalUnirseAbierto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Unirse a Familia</h3>
              <button onClick={() => setModalUnirseAbierto(false)} className="modal-close-btn">×</button>
            </div>
            <div className="modal-body">
              <p>Ingresa el código de invitación:</p>
              <input
                type="text"
                value={codigoUnirse}
                onChange={(e) => setCodigoUnirse(e.target.value)}
                placeholder="Código de invitación"
                className="modal-input"
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setModalUnirseAbierto(false)} className="modal-cancel-btn">
                Cancelar
              </button>
              <button onClick={handleUnirseFamilia} className="modal-confirm-btn">
                Unirse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Familia */}
      {modalCrearAbierto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Crear Nueva Familia</h3>
              <button onClick={() => setModalCrearAbierto(false)} className="modal-close-btn">×</button>
            </div>
            <div className="modal-body">
              <p>Ingresa el nombre de la nueva familia:</p>
              <input
                type="text"
                value={nombreNuevaFamilia}
                onChange={(e) => setNombreNuevaFamilia(e.target.value)}
                placeholder="Nombre de la familia"
                className="modal-input"
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => setModalCrearAbierto(false)} className="modal-cancel-btn">
                Cancelar
              </button>
              <button onClick={handleCrearFamilia} className="modal-confirm-btn">
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Familia;