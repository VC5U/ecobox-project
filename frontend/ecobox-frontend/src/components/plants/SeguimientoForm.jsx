// SeguimientoForm.jsx - VERSIÓN COMPLETA CON FOTOS
import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import './SeguimientoForm.css';

const SeguimientoForm = ({ plantaId, onBack, onCancel }) => {
  const [planta, setPlanta] = useState(null);
  const [formData, setFormData] = useState({
    estado: '',
    observaciones: '',
  });
  
  const [imagen, setImagen] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (plantaId) {
      fetchPlanta();
    }
  }, [plantaId]);

  const fetchPlanta = async () => {
    try {
      const response = await api.get(`/plantas/${plantaId}/`);
      setPlanta(response.data);
    } catch (error) {
      console.error('Error cargando planta:', error);
      setError('No se pudo cargar la información de la planta');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Formato de imagen no válido. Usa JPG, PNG, GIF o WebP.');
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar los 5MB');
      return;
    }

    setImagen(file);
    setError(null);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Simular cambio en el input file
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        const event = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
    }
  };

  const removeImage = () => {
    setImagen(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    // Validación básica
    if (!formData.estado.trim()) {
      setError('La descripción del estado es obligatoria');
      setSubmitting(false);
      return;
    }

    try {
      console.log('📤 Enviando seguimiento con imagen...');
      
      // Crear FormData para enviar archivo
      const formDataToSend = new FormData();
      
      // Datos básicos
      formDataToSend.append('planta', parseInt(plantaId));
      formDataToSend.append('estado', formData.estado);
      formDataToSend.append('observaciones', formData.observaciones || '');
      
      // Imagen si existe
      if (imagen) {
        formDataToSend.append('imagen', imagen);
        console.log('📷 Imagen adjunta:', imagen.name, imagen.type, imagen.size);
      } else {
        console.log('📭 Sin imagen adjunta');
      }
      
      // Enviar con headers multipart/form-data
      const response = await api.post('/seguimientos-estado/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ Seguimiento creado con éxito:', response.data);
      setSuccess(true);
      
      // Esperar un momento y redirigir
      setTimeout(() => {
        if (onBack) {
          onBack();
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error al guardar seguimiento:', error);
      
      if (error.response) {
        console.error('📊 Detalles error:', error.response.data);
        
        if (error.response.status === 413) {
          setError('La imagen es demasiado grande. Máximo 5MB.');
        } else if (error.response.status === 400) {
          const errorData = error.response.data;
          if (typeof errorData === 'object') {
            // Manejar errores de validación específicos
            if (errorData.imagen) {
              setError(`Error en la imagen: ${Array.isArray(errorData.imagen) ? errorData.imagen.join(', ') : errorData.imagen}`);
            } else {
              const errorMessages = Object.entries(errorData)
                .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                .join('; ');
              setError(`Errores de validación: ${errorMessages}`);
            }
          } else {
            setError(errorData || 'Error de validación');
          }
        } else if (error.response.status === 403) {
          setError('No tienes permisos para crear seguimientos');
        } else {
          setError(`Error ${error.response.status}: ${error.response.data?.detail || 'Error desconocido'}`);
        }
      } else if (error.request) {
        setError('No se pudo conectar con el servidor');
      } else {
        setError(error.message || 'Error desconocido');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="seguimiento-form-container">
      {/* Encabezado */}
      <div className="seguimiento-header">
        <button 
          className="back-button"
          onClick={onCancel || onBack}
          aria-label="Volver"
        >
          ←
        </button>
        <div className="header-text">
          <h1 className="plant-name">{planta?.nombrePersonalizado || 'Planta'}</h1>
          <p className="plant-subtitle">Nuevo seguimiento</p>
        </div>
      </div>

      {/* Formulario */}
      <form className="seguimiento-form" onSubmit={handleSubmit}>
        <h2 className="form-title">Nuevo Seguimiento</h2>
        
        {/* Mensaje de éxito */}
        {success && (
          <div className="alert alert-success">
            <div className="success-content">
              <span className="success-icon">✅</span>
              <div>
                <strong>Seguimiento creado correctamente</strong>
                <p>Redirigiendo al historial...</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Mensaje de error */}
        {error && (
          <div className="alert alert-error">
            <div className="error-content">
              <span className="error-icon">❌</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Campo: Estado */}
        <div className="form-group">
          <label htmlFor="estado" className="form-label">
            Descripción del estado <span className="required">*</span>
          </label>
          <input
            type="text"
            id="estado"
            name="estado"
            value={formData.estado}
            onChange={handleInputChange}
            placeholder="Ej: Nueva hoja brotando, hojas amarillas, etc."
            className="form-input"
            required
            disabled={submitting || success}
          />
          <small className="form-help">
            Describe el estado actual de la planta
          </small>
        </div>

        {/* Campo: Observaciones */}
        <div className="form-group">
          <label htmlFor="observaciones" className="form-label">
            Observaciones
          </label>
          <textarea
            id="observaciones"
            name="observaciones"
            value={formData.observaciones}
            onChange={handleInputChange}
            placeholder="Notas adicionales sobre el estado de la planta..."
            className="form-textarea"
            rows="4"
            disabled={submitting || success}
          />
          <small className="form-help">
            Puedes añadir detalles sobre cuidados, cambios observados, etc.
          </small>
        </div>

        {/* Campo: Foto */}
        <div className="form-group">
          <label className="form-label">
            Foto (opcional)
          </label>
          
          {previewImage ? (
            <div className="image-preview-container">
              <div className="image-preview-wrapper">
                <img 
                  src={previewImage} 
                  alt="Vista previa" 
                  className="image-preview"
                />
                <button 
                  type="button"
                  className="remove-image-btn"
                  onClick={removeImage}
                  disabled={submitting || success}
                  aria-label="Eliminar imagen"
                >
                  ✕
                </button>
              </div>
              <div className="image-info">
                <span className="image-name">{imagen?.name}</span>
                <span className="image-size">
                  {(imagen?.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          ) : (
            <div 
              className="file-upload-area"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={triggerFileInput}
            >
              <div className="upload-content">
                <div className="upload-icon">📷</div>
                <div className="upload-text">
                  <p className="upload-main-text">Haz clic para subir una foto</p>
                  <p className="upload-sub-text">o arrastra y suelta aquí</p>
                </div>
                <div className="upload-info">
                  <p>Formatos: JPG, PNG, GIF, WebP</p>
                  <p>Tamaño máximo: 5MB</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg, image/jpg, image/png, image/gif, image/webp"
                onChange={handleFileChange}
                className="file-input-hidden"
                disabled={submitting || success}
              />
            </div>
          )}
          
          <small className="form-help">
            Una imagen ayuda a documentar mejor el estado de la planta
          </small>
        </div>

        {/* Información de la planta */}
        {planta && (
          <div className="plant-info-card">
            <h4>📋 Información de la planta</h4>
            <div className="plant-info-details">
              <div className="info-row">
                <span className="info-label">Nombre:</span>
                <span className="info-value">{planta.nombrePersonalizado}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Especie:</span>
                <span className="info-value">{planta.especie}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Estado actual:</span>
                <span className="info-value">{planta.estado || 'No especificado'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel || onBack}
            disabled={submitting || success}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={submitting || success || !formData.estado.trim()}
          >
            {submitting ? (
              <>
                <span className="spinner-small"></span>
                Guardando...
              </>
            ) : success ? (
              <>
                <span className="success-icon">✅</span>
                Guardado
              </>
            ) : (
              <>
                <span className="save-icon">💾</span>
                Guardar Seguimiento
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SeguimientoForm;