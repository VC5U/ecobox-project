// src/components/plants/PlantForm.js - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { plantasService } from '../../services/plantasService';
import { familiasService } from '../../services/familiasService';
import './PlantForm.css';

const PlantForm = ({ plantaId = null, onSuccess }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [familias, setFamilias] = useState([]);
  const [loadingFamilias, setLoadingFamilias] = useState(true);

  // Datos del formulario - ESTADO INICIAL CORREGIDO
  const [formData, setFormData] = useState({
    nombrePersonalizado: '',
    especie: '',
    descripcion: '',
    familia: '', // Este es el ID de la familia, no el nombre
    estado: 'saludable', // CAMBIADO: 'nueva' no es válido, usar 'saludable'
    aspecto: 'normal',
    foto: null // CAMBIADO: Para manejar archivo
  });

  // Cargar familias DEL USUARIO ACTUAL
  useEffect(() => {
    const cargarFamiliasUsuario = async () => {
      try {
        setLoadingFamilias(true);
        console.log('🔍 Cargando familias del usuario...');
        
        const familiasUsuario = await familiasService.getFamilias();
        console.log('✅ Familias cargadas:', familiasUsuario);
        
        if (Array.isArray(familiasUsuario) && familiasUsuario.length > 0) {
          const familiasFormatted = familiasUsuario.map(familia => ({
            id: familia.idFamilia, // ID numérico
            nombre: familia.nombreFamilia // Nombre para mostrar
          }));
          setFamilias(familiasFormatted);
        } else {
          console.warn('⚠️ No se encontraron familias para el usuario');
          setFamilias([]);
        }
      } catch (error) {
        console.error('❌ Error cargando familias:', error);
        setFamilias([]);
      } finally {
        setLoadingFamilias(false);
      }
    };

    cargarFamiliasUsuario();
  }, []);

  // Si estamos editando, cargar datos de la planta
  useEffect(() => {
    if (plantaId) {
      const cargarPlanta = async () => {
        try {
          setLoading(true);
          const planta = await plantasService.getPlanta(plantaId);
          console.log('📥 Planta cargada para edición:', planta);
          
          if (planta) {
            setFormData({
              nombrePersonalizado: planta.nombrePersonalizado || '',
              especie: planta.especie || '',
              descripcion: planta.descripcion || '',
              familia: planta.familia || planta.id_familia || '',
              estado: planta.estado || 'saludable',
              aspecto: planta.aspecto || 'normal',
              foto: planta.foto || null
            });
          }
        } catch (error) {
          console.error('Error cargando planta:', error);
          setError('No se pudo cargar la información de la planta');
        } finally {
          setLoading(false);
        }
      };

      cargarPlanta();
    }
  }, [plantaId]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      // Para archivos, tomar el primer archivo
      setFormData(prev => ({
        ...prev,
        [name]: files[0] || null
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (error) setError(null);
  };

// En PlantForm.js - MODIFICAR handleSubmit
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validación básica
  if (!formData.nombrePersonalizado.trim()) {
    setError('El nombre de la planta es requerido');
    return;
  }
  
  if (!formData.familia) {
    setError('Debes seleccionar una familia');
    return;
  }
  
  // Validar que el usuario tenga familias disponibles
  if (familias.length === 0) {
    setError('No tienes familias disponibles. Crea o únete a una familia primero.');
    return;
  }
  
  setLoading(true);
  setError(null);
  
  try {
    console.log('🌱 Datos del formulario:', formData);
    
    // Preparar datos para enviar
    const plantaData = {
      nombrePersonalizado: formData.nombrePersonalizado,
      especie: formData.especie,
      descripcion: formData.descripcion,
      familia: parseInt(formData.familia), // <-- ¡IMPORTANTE! Enviar como 'familia'
      estado: formData.estado,
      aspecto: formData.aspecto,
      foto: formData.foto // Puede ser File o null
    };
    
    console.log('📦 Enviando datos para crear planta:', plantaData);
    
    let resultado;
    
    if (plantaId) {
      // Para editar, usar actualizarPlanta
      resultado = await plantasService.actualizarPlanta(plantaId, plantaData);
    } else {
      // Para crear, usar crearPlanta
      resultado = await plantasService.crearPlanta(plantaData);
    }
    
    console.log('✅ Operación exitosa:', resultado);
    setSuccess(true);
    
    // Redirigir después de guardar
    setTimeout(() => {
      if (onSuccess) onSuccess();
      if (plantaId) {
        navigate(`/plantas/${plantaId}`);
      } else {
        navigate('/plantas');
      }
    }, 1500);
    
  } catch (error) {
    console.error('❌ Error completo:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
  const handleCancel = () => {
    if (plantaId) {
      navigate(`/plantas/${plantaId}`);
    } else {
      navigate('/plantas');
    }
  };

  if (loading && plantaId) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando información de la planta...</p>
      </div>
    );
  }

  return (
      <div className="plant-form-container">
      <div className="form-header">
        <h1>{plantaId ? '✏️ Editar Planta' : '🌱 Crear Nueva Planta'}</h1>
        <p className="form-subtitle">
          {plantaId ? 'Modifica los datos de tu planta' : 'Completa los datos para agregar una nueva planta a tu colección'}
        </p>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          ✅ {plantaId ? '¡Planta actualizada correctamente!' : '¡Planta creada exitosamente!'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="plant-form" encType="multipart/form-data">
        <div className="form-section">
          <h3>Información Básica</h3>
          
          <div className="form-group">
            <label htmlFor="nombrePersonalizado">
              Nombre de la Planta *
              <span className="field-help">(Ej: "Rosa del jardín", "Suculenta de oficina")</span>
            </label>
            <input
              type="text"
              id="nombrePersonalizado"
              name="nombrePersonalizado"
              value={formData.nombrePersonalizado}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Ingresa un nombre personalizado"
              disabled={loading || success}
              maxLength="100"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="especie">Especie</label>
              <input
                type="text"
                id="especie"
                name="especie"
                value={formData.especie}
                onChange={handleChange}
                className="form-input"
                placeholder="Ej: Rosa hybrida, Echeveria, etc."
                disabled={loading || success}
                maxLength="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="familia">
                Familia *
                {loadingFamilias && <span className="loading-small"> (cargando...)</span>}
                {!loadingFamilias && familias.length === 0 && (
                  <span className="error-small"> (No tienes familias)</span>
                )}
              </label>
              <select
                id="familia"
                name="familia"
                value={formData.familia}
                onChange={handleChange}
                required
                className="form-select"
                disabled={loading || success || loadingFamilias || familias.length === 0}
              >
                <option value="">Seleccionar familia</option>
                {familias.map(familia => (
                  <option key={familia.id} value={familia.id}>
                    {familia.nombre}
                  </option>
                ))}
              </select>
              <p className="field-help">
                {familias.length === 0 
                  ? 'No tienes familias disponibles. Ve a "Familias" para crear o unirte a una.'
                  : 'La familia determina quiénes pueden ver y cuidar esta planta'}
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows="4"
              className="form-textarea"
              placeholder="Describe tu planta, cuidados especiales, ubicación, etc."
              disabled={loading || success}
              maxLength="500"
            />
            <div className="char-counter">
              {formData.descripcion.length}/500 caracteres
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Estado y Características</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="estado">Estado Inicial</label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="form-select"
                disabled={loading || success}
              >
                <option value="saludable">🌿 Saludable</option>
                <option value="normal">✅ Normal</option>
                <option value="necesita_agua">💧 Necesita Agua</option>
                <option value="enferma">😷 Enferma</option>
                <option value="marchita">🍂 Marchita</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="aspecto">Aspecto</label>
              <select
                id="aspecto"
                name="aspecto"
                value={formData.aspecto}
                onChange={handleChange}
                className="form-select"
                disabled={loading || success}
              >
                <option value="normal">Normal</option>
                <option value="floreciendo">Floreciendo 🌸</option>
                <option value="con_frutos">Con Frutos 🍅</option>
                <option value="exuberante">Exuberante 🌿</option>
                <option value="hojas_amarillas">Hojas Amarillas 🍂</option>
                <option value="crecimiento_lento">Crecimiento Lento 🐌</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Imagen (Opcional)</h3>
          
          <div className="form-group">
            <label htmlFor="foto">Subir imagen</label>
            <input
              type="file"
              id="foto"
              name="foto"
              onChange={handleChange}
              className="form-file"
              disabled={loading || success}
              accept="image/*"
            />
            <p className="field-help">
              Puedes subir una imagen de tu planta. Formatos aceptados: JPG, PNG, GIF
            </p>
            
            {formData.foto instanceof File && (
              <div className="image-preview">
                <p>Vista previa:</p>
                <img 
                  src={URL.createObjectURL(formData.foto)} 
                  alt="Vista previa" 
                  className="preview-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML += '<p class="preview-error">❌ No se pudo cargar la imagen</p>';
                  }}
                />
                <p className="file-info">
                  Archivo: {formData.foto.name} ({Math.round(formData.foto.size / 1024)} KB)
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          
          <button 
            type="submit" 
            disabled={loading || success || !formData.nombrePersonalizado.trim() || !formData.familia || familias.length === 0}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                {plantaId ? 'Actualizando...' : 'Creando...'}
              </>
            ) : success ? (
              '✅ Guardado'
            ) : plantaId ? (
              '💾 Guardar Cambios'
            ) : (
              '🌱 Crear Planta'
            )}
          </button>
        </div>
      </form>

      <div className="form-help">
        <h4>📝 Consejos para crear tu planta:</h4>
        <ul>
          <li>Usa un nombre que te ayude a identificar fácilmente tu planta</li>
          <li>La especie es opcional pero útil para identificar cuidados específicos</li>
          <li>Selecciona la familia correcta para compartir el cuidado con otros miembros</li>
          <li>Puedes cambiar el estado y aspecto más adelante según evolucione tu planta</li>
        </ul>
      </div>
    </div>
  );
};

export default PlantForm;