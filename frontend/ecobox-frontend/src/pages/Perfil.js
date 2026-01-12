// src/pages/Perfil.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import './Profile.css';

// Constantes dentro del mismo archivo
const AVATAR_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', 
  '#EF4444', '#EC4899', '#14B8A6', '#F97316',
  '#06B6D4', '#8B5CF6', '#84CC16', '#F43F5E'
];

const BIOS_PREDEFINIDAS = [
  "🌿 Entusiasta de la jardinería y monitoreo de plantas",
  "💧 Amante del cuidado responsable de plantas",
  "📊 Apasionado por el seguimiento de métricas de plantas",
  "🌱 Comprometido con la jardinería sostenible",
  "✨ Explorando el mundo de la botánica digital",
  "🌸 Jardinería urbana como estilo de vida",
  "💚 Cultivando un futuro más verde",
  "🌳 Conectando con la naturaleza a través de la tecnología"
];

// Función para generar avatar CON color específico
const generateAvatarUrl = (nombre, apellido, username, userId, colorIndex = null) => {
  const iniciales = `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase() || username?.[0]?.toUpperCase() || 'U';
  
  // Si se proporciona un colorIndex, usarlo; de lo contrario, obtener del localStorage
  let indexToUse;
  
  if (colorIndex !== null && colorIndex !== undefined) {
    indexToUse = colorIndex % AVATAR_COLORS.length;
  } else {
    // Intentar obtener color guardado
    const storedColor = localStorage.getItem(`avatar_color_${userId}`);
    if (storedColor !== null) {
      indexToUse = parseInt(storedColor) % AVATAR_COLORS.length;
    } else {
      // Generar índice basado en ID de usuario
      const seed = userId ? userId.toString().split('').reduce((a, b) => a + parseInt(b), 0) : 0;
      indexToUse = seed % AVATAR_COLORS.length;
      localStorage.setItem(`avatar_color_${userId}`, indexToUse.toString());
    }
  }
  
  const color = AVATAR_COLORS[indexToUse];
  return {
    url: `https://ui-avatars.com/api/?name=${encodeURIComponent(iniciales)}&background=${color.replace('#', '')}&color=fff&bold=true&size=200`,
    colorIndex: indexToUse,
    color: color
  };
};

// Función para obtener bio con persistencia
const getRandomBio = (userId) => {
  // Intentar obtener bio guardada
  const storedBio = localStorage.getItem(`user_bio_${userId}`);
  if (storedBio) return storedBio;
  
  // Si no hay bio guardada, generar una basada en el ID
  const seed = userId ? userId.toString().split('').reduce((a, b) => a + parseInt(b), 0) : Date.now();
  const bioIndex = seed % BIOS_PREDEFINIDAS.length;
  const selectedBio = BIOS_PREDEFINIDAS[bioIndex];
  
  // Guardar la bio seleccionada
  localStorage.setItem(`user_bio_${userId}`, selectedBio);
  localStorage.setItem(`user_bio_index_${userId}`, bioIndex.toString());
  
  return selectedBio;
};

const Perfil = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  
  // Estados reorganizados y optimizados
  const [profileState, setProfileState] = useState({
    personalInfo: {
      nombre: '',
      apellido: '',
      email: '',
      username: '',
      telefono: '',
      fecha_registro: '',
    },
    stats: {
      plantas_count: 0,
      mediciones_count: 0,
      riegos_hoy: 0,
      semanas_activo: 1
    },
    customization: {
      bio: '',
      avatar: '',
      avatarColorIndex: 0,
      avatarColor: '#10B981'
    }
  });
  
  const [uiState, setUiState] = useState({
    loading: true,
    saving: false,
    editing: false,
    showPasswordForm: false,
    hasUnsavedChanges: false
  });
  
  const [notifications, setNotifications] = useState({
    message: '',
    error: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Memoizar estadísticas
  const memoizedStats = useMemo(() => [
    { 
      key: 'plantas', 
      value: profileState.stats.plantas_count, 
      label: 'Plantas', 
      className: 'pf-stat-plants' 
    },
    { 
      key: 'mediciones', 
      value: profileState.stats.mediciones_count, 
      label: 'Mediciones', 
      className: 'pf-stat-measures' 
    },
    { 
      key: 'riegos', 
      value: profileState.stats.riegos_hoy, 
      label: 'Riegos hoy', 
      className: 'pf-stat-watering' 
    },
    { 
      key: 'semanas', 
      value: profileState.stats.semanas_activo, 
      label: 'Semanas activo', 
      className: 'pf-stat-weeks' 
    }
  ], [profileState.stats]);

  // Cargar perfil con manejo de errores mejorado
  const fetchUserProfile = useCallback(async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      setUiState(prev => ({ ...prev, loading: true }));
      setNotifications({ message: '', error: '' });
      
      const result = await profileService.getProfile();
      
      if (result.success) {
        const data = result.data;
        
        const newPersonalInfo = {
          nombre: data.nombre || data.first_name || '',
          apellido: data.apellido || data.last_name || '',
          email: data.email || '',
          username: data.username || '',
          telefono: data.telefono || '',
          fecha_registro: data.fecha_registro_formatted || 
                        (data.date_joined ? new Date(data.date_joined).toLocaleDateString() : ''),
        };
        
        // Obtener avatar con color actual
        const avatarData = generateAvatarUrl(
          newPersonalInfo.nombre,
          newPersonalInfo.apellido,
          newPersonalInfo.username,
          data.id
        );
        
        // Obtener bio
        const userBio = getRandomBio(data.id);
        
        setProfileState({
          personalInfo: newPersonalInfo,
          stats: data.estadisticas || profileState.stats,
          customization: {
            bio: userBio,
            avatar: avatarData.url,
            avatarColorIndex: avatarData.colorIndex,
            avatarColor: avatarData.color
          }
        });
        
        // Actualizar contexto de autenticación
        if (updateUser) {
          updateUser({ ...data, ...newPersonalInfo });
        }
        
      } else {
        setNotifications(prev => ({ 
          ...prev, 
          error: result.error || 'Error al cargar el perfil' 
        }));
      }
      
    } catch (error) {
      console.error('❌ Error en la petición:', error);
      setNotifications(prev => ({ 
        ...prev, 
        error: 'Error de conexión con el servidor' 
      }));
    } finally {
      setUiState(prev => ({ ...prev, loading: false }));
    }
  }, [user, navigate, updateUser]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Manejador de cambios optimizado con debounce
  const handleChange = useCallback((field, value) => {
    setProfileState(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
    
    // Marcar que hay cambios sin guardar
    if (!uiState.hasUnsavedChanges && uiState.editing) {
      setUiState(prev => ({ ...prev, hasUnsavedChanges: true }));
    }
    
    // Actualizar avatar si cambia nombre o apellido
    if ((field === 'nombre' || field === 'apellido') && user?.id) {
      const avatarData = generateAvatarUrl(
        field === 'nombre' ? value : profileState.personalInfo.nombre,
        field === 'apellido' ? value : profileState.personalInfo.apellido,
        profileState.personalInfo.username,
        user.id,
        profileState.customization.avatarColorIndex
      );
      
      setProfileState(prev => ({
        ...prev,
        customization: {
          ...prev.customization,
          avatar: avatarData.url,
          avatarColorIndex: avatarData.colorIndex,
          avatarColor: avatarData.color
        }
      }));
    }
  }, [user?.id, uiState.editing, uiState.hasUnsavedChanges, profileState.personalInfo, profileState.customization.avatarColorIndex]);

  // FUNCIÓN CORREGIDA: Cambiar color del avatar
  const cambiarAvatar = useCallback(() => {
    if (!user?.id) {
      setNotifications({ 
        error: 'Usuario no identificado', 
        message: '' 
      });
      return;
    }
    
    try {
      // Obtener el siguiente color en la lista
      const currentIndex = profileState.customization.avatarColorIndex;
      const nextIndex = (currentIndex + 1) % AVATAR_COLORS.length;
      const nextColor = AVATAR_COLORS[nextIndex];
      
      console.log('🔍 Cambiando avatar:', {
        currentIndex,
        nextIndex,
        nextColor,
        nombre: profileState.personalInfo.nombre,
        apellido: profileState.personalInfo.apellido
      });
      
      // Generar nueva URL del avatar con el nuevo color
      const iniciales = `${profileState.personalInfo.nombre?.[0] || ''}${profileState.personalInfo.apellido?.[0] || ''}`.toUpperCase() || 
                       profileState.personalInfo.username?.[0]?.toUpperCase() || 'U';
      
      const newAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(iniciales)}&background=${nextColor.replace('#', '')}&color=fff&bold=true&size=200`;
      
      console.log('🖼️ Nueva URL del avatar:', newAvatarUrl);
      
      // Guardar el nuevo color en localStorage
      localStorage.setItem(`avatar_color_${user.id}`, nextIndex.toString());
      
      // Actualizar estado
      setProfileState(prev => ({
        ...prev,
        customization: {
          ...prev.customization,
          avatar: newAvatarUrl,
          avatarColorIndex: nextIndex,
          avatarColor: nextColor
        }
      }));
      
      setNotifications({ 
        message: `🎨 ¡Color cambiado a ${nextColor}!`, 
        error: '' 
      });
      
      setTimeout(() => {
        setNotifications(prev => ({ ...prev, message: '' }));
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error al cambiar avatar:', error);
      setNotifications({ 
        error: 'Error al cambiar el avatar', 
        message: '' 
      });
    }
  }, [user?.id, profileState.personalInfo, profileState.customization.avatarColorIndex]);

  // FUNCIÓN CORREGIDA: Cambiar biografía
  const cambiarBio = useCallback(() => {
    if (!user?.id) {
      setNotifications({ 
        error: 'Usuario no identificado', 
        message: '' 
      });
      return;
    }
    
    try {
      // Obtener índice actual de bio
      const currentBioIndex = parseInt(localStorage.getItem(`user_bio_index_${user.id}`) || '0');
      const nextBioIndex = (currentBioIndex + 1) % BIOS_PREDEFINIDAS.length;
      const nuevaBio = BIOS_PREDEFINIDAS[nextBioIndex];
      
      console.log('📝 Cambiando bio:', {
        currentBioIndex,
        nextBioIndex,
        nuevaBio
      });
      
      // Guardar nueva bio en localStorage
      localStorage.setItem(`user_bio_${user.id}`, nuevaBio);
      localStorage.setItem(`user_bio_index_${user.id}`, nextBioIndex.toString());
      
      // Actualizar estado
      setProfileState(prev => ({
        ...prev,
        customization: {
          ...prev.customization,
          bio: nuevaBio
        }
      }));
      
      setNotifications({ 
        message: '✨ ¡Biografía actualizada!', 
        error: '' 
      });
      
      setTimeout(() => {
        setNotifications(prev => ({ ...prev, message: '' }));
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error al cambiar bio:', error);
      setNotifications({ 
        error: 'Error al cambiar la biografía', 
        message: '' 
      });
    }
  }, [user?.id]);

  // Resto del código sigue igual hasta el render...
  // Guardar perfil con validación
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setUiState(prev => ({ ...prev, saving: true, hasUnsavedChanges: false }));
    setNotifications({ message: '', error: '' });
    
    try {
      const result = await profileService.updateProfile(profileState.personalInfo);
      
      if (result.success) {
        setNotifications({ 
          message: '✅ Perfil actualizado correctamente', 
          error: '' 
        });
        
        setUiState(prev => ({ 
          ...prev, 
          editing: false, 
          saving: false 
        }));
        
        // Actualizar datos locales
        if (result.data) {
          setProfileState(prev => ({
            ...prev,
            personalInfo: {
              ...prev.personalInfo,
              ...result.data
            }
          }));
        }
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          setNotifications(prev => ({ ...prev, message: '' }));
        }, 3000);
        
      } else {
        setNotifications({ 
          error: result.error || 'Error al actualizar el perfil', 
          message: '' 
        });
      }
    } catch (error) {
      setNotifications({ 
        error: 'Error de conexión con el servidor', 
        message: '' 
      });
    } finally {
      setUiState(prev => ({ ...prev, saving: false }));
    }
  };

  // Cambiar contraseña
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    setUiState(prev => ({ ...prev, saving: true }));
    setNotifications({ message: '', error: '' });
    
    try {
      const result = await profileService.changePassword(passwordData);
      
      if (result.success) {
        setNotifications({ 
          message: '✅ Contraseña actualizada exitosamente', 
          error: '' 
        });
        
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        setTimeout(() => {
          setUiState(prev => ({ ...prev, showPasswordForm: false }));
          setNotifications(prev => ({ ...prev, message: '' }));
        }, 2000);
      } else {
        setNotifications({ 
          error: result.error || 'Error al cambiar la contraseña', 
          message: '' 
        });
      }
    } catch (error) {
      setNotifications({ 
        error: 'Error de conexión con el servidor', 
        message: '' 
      });
    } finally {
      setUiState(prev => ({ ...prev, saving: false }));
    }
  };

  // Cerrar sesión con confirmación
  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      logout();
      navigate('/login');
    }
  };

  // Cancelar edición con confirmación si hay cambios
  const handleCancel = () => {
    if (uiState.hasUnsavedChanges && 
        !window.confirm('Tienes cambios sin guardar. ¿Seguro que quieres cancelar?')) {
      return;
    }
    
    setUiState(prev => ({ 
      ...prev, 
      editing: false, 
      hasUnsavedChanges: false 
    }));
    setNotifications({ message: '', error: '' });
    fetchUserProfile(); // Recargar datos originales
  };

  // Toggle edición
  const toggleEdit = () => {
    if (uiState.editing && uiState.hasUnsavedChanges) {
      if (!window.confirm('Tienes cambios sin guardar. ¿Seguro que quieres salir del modo edición?')) {
        return;
      }
    }
    setUiState(prev => ({ 
      ...prev, 
      editing: !prev.editing,
      hasUnsavedChanges: false 
    }));
  };

  // Loading state simplificado
  if (uiState.loading) {
    return (
      <div className="pf-profile-container">
        <div className="pf-profile-loading">
          <div className="pf-spinner-large"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-profile-container">
      {/* Header */}
      <header className="pf-profile-header">
        <div className="pf-header-top">
          <h1 className="pf-page-title">
            <span className="pf-title-icon">👤</span>
            Mi Perfil
          </h1>
          <div className="pf-header-actions">
            <button 
              onClick={() => navigate('/dashboard')}
              className="pf-btn-secondary"
            >
              <span className="pf-back-arrow">←</span>
              Volver al Dashboard
            </button>
          </div>
        </div>
        
        <div className="pf-header-main">
          <p className="pf-header-subtitle">Gestiona tu información personal y preferencias</p>
          
          {/* Estadísticas memoizadas */}
          <div className="pf-stats-summary">
            {memoizedStats.map(stat => (
              <div key={stat.key} className={`pf-stat-card ${stat.className}`}>
                <span className="pf-stat-number">{stat.value}</span>
                <span className="pf-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Notificaciones */}
      {notifications.message && (
        <div className="pf-success-message">
          <span className="pf-message-icon">✅</span>
          {notifications.message}
        </div>
      )}
      
      {notifications.error && (
        <div className="pf-error-message">
          <span className="pf-message-icon">⚠️</span>
          {notifications.error}
        </div>
      )}

      <main className="pf-profile-content">
        {/* Sidebar */}
        <aside className="pf-profile-sidebar">
          <div className="pf-avatar-section">
            <div className="pf-avatar-container">
              <img 
                src={profileState.customization.avatar} 
                alt={`${profileState.personalInfo.nombre} ${profileState.personalInfo.apellido}`}
                className="pf-profile-avatar"
                onError={(e) => {
                  console.error('❌ Error cargando avatar:', e);
                  // Fallback a un avatar por defecto
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileState.personalInfo.nombre?.[0] || 'U')}&background=10B981&color=fff&bold=true`;
                }}
              />
              <button 
                onClick={cambiarAvatar}
                className="pf-avatar-change-btn"
                title="Cambiar color de avatar"
                disabled={uiState.saving}
              >
                🎨
              </button>
            </div>
            
            <div className="pf-user-info">
              <h2 className="pf-user-name">
                {profileState.personalInfo.nombre} {profileState.personalInfo.apellido}
              </h2>
              <p className="pf-username">@{profileState.personalInfo.username}</p>
              
              <div className="pf-member-info">
                <span className="pf-member-icon">📅</span>
                <span className="pf-member-text">
                  Miembro desde: {profileState.personalInfo.fecha_registro}
                </span>
              </div>
            </div>
          </div>

          <div className="pf-bio-section">
            <div className="pf-bio-header">
              <h3 className="pf-bio-title">Bio Personal</h3>
              <button 
                onClick={cambiarBio}
                className="pf-bio-change-btn"
                title="Cambiar biografía"
                disabled={uiState.saving}
              >
                🔄
              </button>
            </div>
            <p className="pf-bio-text">{profileState.customization.bio}</p>
          </div>

          <div className="pf-sidebar-actions">
            {uiState.hasUnsavedChanges && uiState.editing && (
              <div className="pf-unsaved-changes">
                <span className="pf-unsaved-icon">💾</span>
                <span className="pf-unsaved-text">Tienes cambios sin guardar</span>
              </div>
            )}
            
            <button 
              onClick={toggleEdit}
              className={`pf-btn-edit-sidebar ${uiState.editing ? 'pf-editing-active' : ''}`}
              disabled={uiState.saving}
            >
              <span className="pf-icon">✏️</span>
              {uiState.editing ? 'Modo Edición' : 'Editar Perfil'}
            </button>
            
            {uiState.editing && (
              <div className="pf-edit-actions-sidebar">
                <button 
                  onClick={handleCancel}
                  className="pf-btn-cancel-sidebar"
                  disabled={uiState.saving}
                >
                  <span className="pf-icon">❌</span>
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  form="pf-profile-form"
                  className="pf-btn-save-sidebar"
                  disabled={uiState.saving || !uiState.hasUnsavedChanges}
                >
                  <span className="pf-icon">💾</span>
                  {uiState.saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            )}
            
            <button 
              onClick={() => setUiState(prev => ({ 
                ...prev, 
                showPasswordForm: !prev.showPasswordForm 
              }))}
              className={`pf-btn-change-password ${uiState.showPasswordForm ? 'pf-active' : ''}`}
              disabled={uiState.editing || uiState.saving}
            >
              <span className="pf-icon">🔐</span>
              {uiState.showPasswordForm ? 'Ocultar Contraseña' : 'Cambiar Contraseña'}
            </button>
            
            <button 
              onClick={handleLogout}
              className="pf-btn-logout"
              disabled={uiState.saving}
            >
              <span className="pf-icon">🚪</span>
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="pf-profile-main">
          {/* Personal Info Form */}
          <div className="pf-form-section">
            <div className="pf-form-header">
              <h2 className="pf-form-title">
                <span className="pf-form-icon">👤</span>
                Información Personal
              </h2>
            </div>

            <form id="pf-profile-form" onSubmit={handleSubmit} className="pf-profile-form">
              <div className="pf-form-grid">
                <div className="pf-form-group">
                  <label className="pf-form-label" htmlFor="pf-nombre">
                    <span className="pf-label-icon">👤</span>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    id="pf-nombre"
                    name="nombre"
                    value={profileState.personalInfo.nombre}
                    onChange={(e) => handleChange('nombre', e.target.value)}
                    required
                    disabled={!uiState.editing || uiState.saving}
                    className={`pf-form-input ${!uiState.editing ? 'pf-disabled' : ''}`}
                    maxLength="50"
                  />
                </div>

                <div className="pf-form-group">
                  <label className="pf-form-label" htmlFor="pf-apellido">
                    <span className="pf-label-icon">👥</span>
                    Apellido
                  </label>
                  <input
                    type="text"
                    id="pf-apellido"
                    name="apellido"
                    value={profileState.personalInfo.apellido}
                    onChange={(e) => handleChange('apellido', e.target.value)}
                    disabled={!uiState.editing || uiState.saving}
                    className={`pf-form-input ${!uiState.editing ? 'pf-disabled' : ''}`}
                    maxLength="50"
                  />
                </div>

                <div className="pf-form-group">
                  <label className="pf-form-label" htmlFor="pf-email">
                    <span className="pf-label-icon">📧</span>
                    Email *
                  </label>
                  <input
                    type="email"
                    id="pf-email"
                    name="email"
                    value={profileState.personalInfo.email}
                    disabled={true}
                    className="pf-form-input pf-disabled"
                  />
                  <div className="pf-field-note">El email no se puede cambiar</div>
                </div>

                <div className="pf-form-group">
                  <label className="pf-form-label" htmlFor="pf-username">
                    <span className="pf-label-icon">👤</span>
                    Nombre de Usuario *
                  </label>
                  <input
                    type="text"
                    id="pf-username"
                    name="username"
                    value={profileState.personalInfo.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    required
                    disabled={!uiState.editing || uiState.saving}
                    className={`pf-form-input ${!uiState.editing ? 'pf-disabled' : ''}`}
                    pattern="[a-zA-Z0-9_]+"
                    title="Solo letras, números y guiones bajos"
                    maxLength="30"
                  />
                </div>

                <div className="pf-form-group pf-full-width">
                  <label className="pf-form-label" htmlFor="pf-telefono">
                    <span className="pf-label-icon">📱</span>
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="pf-telefono"
                    name="telefono"
                    value={profileState.personalInfo.telefono}
                    onChange={(e) => handleChange('telefono', e.target.value)}
                    disabled={!uiState.editing || uiState.saving}
                    className={`pf-form-input ${!uiState.editing ? 'pf-disabled' : ''}`}
                    placeholder="Ej: +34 123 456 789"
                    pattern="[\d\s+()-]{10,15}"
                  />
                </div>
              </div>
              
              {uiState.editing && (
                <div className="pf-form-actions">
                  <button 
                    type="submit" 
                    className="pf-btn-save"
                    disabled={uiState.saving || !uiState.hasUnsavedChanges}
                  >
                    <span className="pf-icon">💾</span>
                    {uiState.saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Password Change Form */}
          {uiState.showPasswordForm && (
            <div className="pf-password-section">
              <div className="pf-section-header">
                <h3 className="pf-section-title">
                  <span className="pf-section-icon">🔐</span>
                  Cambiar Contraseña
                </h3>
              </div>

              <form onSubmit={handlePasswordChange} className="pf-password-form">
                <div className="pf-form-grid">
                  <div className="pf-form-group">
                    <label className="pf-form-label" htmlFor="pf-oldPassword">
                      <span className="pf-label-icon">🔑</span>
                      Contraseña Actual *
                    </label>
                    <input
                      type="password"
                      id="pf-oldPassword"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData(prev => ({...prev, oldPassword: e.target.value}))}
                      required
                      disabled={uiState.saving}
                      className="pf-form-input"
                    />
                  </div>

                  <div className="pf-form-group">
                    <label className="pf-form-label" htmlFor="pf-newPassword">
                      <span className="pf-label-icon">🔄</span>
                      Nueva Contraseña *
                    </label>
                    <input
                      type="password"
                      id="pf-newPassword"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({...prev, newPassword: e.target.value}))}
                      required
                      minLength="6"
                      disabled={uiState.saving}
                      className="pf-form-input"
                    />
                    <div className="pf-field-note">Mínimo 6 caracteres</div>
                  </div>

                  <div className="pf-form-group">
                    <label className="pf-form-label" htmlFor="pf-confirmPassword">
                      <span className="pf-label-icon">✅</span>
                      Confirmar Contraseña *
                    </label>
                    <input
                      type="password"
                      id="pf-confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({...prev, confirmPassword: e.target.value}))}
                      required
                      disabled={uiState.saving}
                      className="pf-form-input"
                    />
                  </div>
                </div>

                <div className="pf-form-actions">
                  <button 
                    type="button" 
                    className="pf-btn-cancel"
                    onClick={() => setUiState(prev => ({ ...prev, showPasswordForm: false }))}
                    disabled={uiState.saving}
                  >
                    <span className="pf-icon">❌</span>
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="pf-btn-save"
                    disabled={uiState.saving}
                  >
                    <span className="pf-icon">🔐</span>
                    {uiState.saving ? 'Cambiando...' : 'Cambiar Contraseña'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Customization Section */}
          <div className="pf-customization-section">
            <div className="pf-section-header">
              <h3 className="pf-section-title">
                <span className="pf-section-icon">🎨</span>
                Personalización
              </h3>
            </div>

            <div className="pf-customization-content">
              <div className="pf-customization-item">
                <div className="pf-customization-icon">🖼️</div>
                <div className="pf-customization-details">
                  <h4 className="pf-customization-title">Avatar</h4>
                  <p className="pf-customization-description">
                    Color actual: <span 
                      style={{ 
                        color: profileState.customization.avatarColor,
                        fontWeight: 'bold',
                        backgroundColor: `${profileState.customization.avatarColor}20`,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        marginLeft: '8px'
                      }}
                    >
                      {profileState.customization.avatarColor}
                    </span>
                  </p>
                  <div className="pf-avatar-color-preview">
                    <div className="pf-current-color" style={{ 
                      backgroundColor: profileState.customization.avatarColor 
                    }}></div>
                    <span className="pf-color-name">
                      Color {profileState.customization.avatarColorIndex + 1} de {AVATAR_COLORS.length}
                    </span>
                  </div>
                  <button 
                    onClick={cambiarAvatar}
                    className="pf-btn-customization"
                    disabled={uiState.saving}
                  >
                    <span className="pf-icon">🎨</span>
                    Cambiar color
                  </button>
                </div>
              </div>

              <div className="pf-customization-item">
                <div className="pf-customization-icon">📝</div>
                <div className="pf-customization-details">
                  <h4 className="pf-customization-title">Biografía</h4>
                  <p className="pf-customization-description">
                    {profileState.customization.bio}
                  </p>
                  <button 
                    onClick={cambiarBio}
                    className="pf-btn-customization"
                    disabled={uiState.saving}
                  >
                    <span className="pf-icon">🔄</span>
                    Nueva bio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Perfil;