// src/pages/Perfil.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profileService';
import './Profile.css';

const Perfil = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    username: '',
    telefono: '',
    fecha_registro: '',
  });
  
  const [generatedBio, setGeneratedBio] = useState('');
  const [generatedAvatar, setGeneratedAvatar] = useState('');
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  
  // Estados para cambio de contraseña
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await profileService.getProfile();
      
      if (result.success) {
        const data = result.data;
        
        setFormData({
          nombre: data.nombre || data.first_name || '',
          apellido: data.apellido || data.last_name || '',
          email: data.email || '',
          username: data.username || '',
          telefono: data.telefono || '',
          fecha_registro: data.fecha_registro_formatted || 
                         (data.date_joined ? new Date(data.date_joined).toLocaleDateString() : ''),
        });
        
        // Generar avatar y bio usando el servicio
        const avatar = profileService.getAvatarUrl(
          data.nombre || data.first_name,
          data.apellido || data.last_name,
          data.username,
          data.id
        );
        const bio = profileService.getRandomBio(data.id);
        
        setGeneratedAvatar(avatar);
        setGeneratedBio(bio);
        
        // Guardar estadísticas
        if (data.estadisticas) {
          setStats(data.estadisticas);
        }
        
        // Actualizar user en localStorage si es necesario
        if (data && !localStorage.getItem('user')) {
          localStorage.setItem('user', JSON.stringify(data));
        }
      } else {
        setError(result.error || 'Error al cargar el perfil');
      }
      
    } catch (error) {
      console.error('❌ Error en la petición:', error);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Regenerar avatar si cambia nombre o apellido
    if (name === 'nombre' || name === 'apellido') {
      const nuevoAvatar = profileService.getAvatarUrl(
        name === 'nombre' ? value : formData.nombre,
        name === 'apellido' ? value : formData.apellido,
        formData.username,
        user?.id
      );
      setGeneratedAvatar(nuevoAvatar);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const result = await profileService.updateProfile(formData);
      
      if (result.success) {
        setMessage('✅ Perfil actualizado correctamente');
        setEditing(false);
        
        // Recargar datos del perfil
        setTimeout(() => {
          fetchUserProfile();
          setMessage('');
        }, 2000);
      } else {
        setError(result.error || 'Error al actualizar el perfil');
      }
    } catch (error) {
      setError('Error de conexión con el servidor');
    } finally {
      setSaving(false);
    }
  };

  // Manejar cambio de contraseña
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    setError('');
    setMessage('');

    try {
      const result = await profileService.changePassword(passwordData);
      
      if (result.success) {
        setMessage('✅ Contraseña actualizada exitosamente');
        
        // Limpiar formulario
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // Ocultar formulario después de 2 segundos
        setTimeout(() => {
          setShowPasswordForm(false);
          setMessage('');
        }, 2000);
      } else {
        setError(result.error || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      setError('Error de conexión con el servidor');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const cambiarAvatar = () => {
    // Generar nuevo avatar con color diferente
    const nuevoAvatar = profileService.getAvatarUrl(
      formData.nombre,
      formData.apellido,
      formData.username,
      user?.id
    );
    setGeneratedAvatar(nuevoAvatar);
    
    setMessage('🎨 ¡Avatar actualizado!');
    setTimeout(() => setMessage(''), 2000);
  };

  const cambiarBio = () => {
    const nuevaBio = profileService.getRandomBio(user?.id);
    setGeneratedBio(nuevaBio);
    
    setMessage('✨ ¡Bio actualizada!');
    setTimeout(() => setMessage(''), 2000);
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1><span className="icon">👤</span> Mi Perfil</h1>
        <p>Gestiona tu información personal</p>
      </div>

      <div className="profile-content">
        {/* Sidebar con información de cuenta */}
        <div className="profile-sidebar">
          <div className="avatar-section">
            <div className="avatar-container">
              <img 
                src={generatedAvatar} 
                alt={`${formData.nombre} ${formData.apellido}`}
                className="profile-avatar"
              />
              <button 
                className="avatar-change-btn"
                onClick={cambiarAvatar}
                title="Cambiar color de avatar"
              >
                🎨 Cambiar color
              </button>
            </div>
            <h2>{formData.nombre} {formData.apellido}</h2>
            <p className="username">@{formData.username}</p>
            <div className="bio-section">
              <p className="bio-text">{generatedBio}</p>
              <button 
                className="bio-change-btn"
                onClick={cambiarBio}
              >
                🔄 Nueva bio
              </button>
            </div>
            <p className="member-since">
              <span className="icon">📅</span> 
              Miembro desde: {formData.fecha_registro}
            </p>
          </div>

          {stats && (
            <div className="account-stats">
              <h3><span className="icon">📊</span> Estadísticas</h3>
              <div className="stat-item">
                <span className="stat-label">Plantas:</span>
                <span className="stat-value">{stats.plantas_count || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Mediciones:</span>
                <span className="stat-value">{stats.mediciones_count || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Riegos hoy:</span>
                <span className="stat-value">{stats.riegos_hoy || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Semanas activo:</span>
                <span className="stat-value">{stats.semanas_activo || 1}</span>
              </div>
            </div>
          )}

          <div className="sidebar-actions">
            <button 
              className="btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              ← Volver al Dashboard
            </button>
            
            <button 
              className="btn-change-password"
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              🔐 Cambiar Contraseña
            </button>
            
            <button 
              className="btn-logout"
              onClick={handleLogout}
            >
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Formulario principal */}
        <div className="profile-form-section">
          <div className="form-header">
            <h2>Información Personal</h2>
            {!editing ? (
              <button 
                className="btn-edit"
                onClick={() => setEditing(true)}
              >
                ✏️ Editar Perfil
              </button>
            ) : (
              <div className="edit-actions">
                <button 
                  className="btn-cancel"
                  onClick={() => {
                    setEditing(false);
                    fetchUserProfile();
                  }}
                >
                  ❌ Cancelar
                </button>
              </div>
            )}
          </div>

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nombre">Nombre *</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  disabled={!editing}
                />
              </div>
              <div className="form-group">
                <label htmlFor="apellido">Apellido</label>
                <input
                  type="text"
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled={true}
                  className="disabled-field"
                />
                <small className="field-note">El email no se puede cambiar</small>
              </div>
              <div className="form-group">
                <label htmlFor="username">Nombre de Usuario *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={!editing}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                disabled={!editing}
              />
            </div>

            {editing && (
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-save"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                </button>
              </div>
            )}
          </form>

          {/* Formulario de cambio de contraseña */}
          {showPasswordForm && (
            <div className="password-form-section">
              <h3><span className="icon">🔐</span> Cambiar Contraseña</h3>
              
              <form onSubmit={handlePasswordChange} className="password-form">
                <div className="form-group">
                  <label htmlFor="oldPassword">Contraseña Actual *</label>
                  <input
                    type="password"
                    id="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                    required
                    disabled={changingPassword}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="newPassword">Nueva Contraseña *</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    required
                    minLength="6"
                    disabled={changingPassword}
                  />
                  <small className="field-note">Mínimo 6 caracteres</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    required
                    disabled={changingPassword}
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowPasswordForm(false)}
                    disabled={changingPassword}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn-save"
                    disabled={changingPassword}
                  >
                    {changingPassword ? 'Cambiando...' : '🔐 Cambiar Contraseña'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Sección de personalización */}
          <div className="generation-section">
            <h3><span className="icon">🎨</span> Personalización</h3>
            <div className="generation-info">
              <p>
                <strong>Avatar:</strong> Generado automáticamente con tus iniciales. 
                Puedes cambiar el color cuando quieras.
              </p>
              <p>
                <strong>Bio:</strong> Seleccionada aleatoriamente de nuestras frases predefinidas. 
                ¡Cambia cuando quieras!
              </p>
              <div className="generation-buttons">
                <button onClick={cambiarAvatar} className="gen-btn">
                  🎨 Cambiar color de avatar
                </button>
                <button onClick={cambiarBio} className="gen-btn">
                  🔄 Generar nueva bio
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Perfil;