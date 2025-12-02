import React, { useState, useEffect } from 'react';
import './PlantForm.css';

const PlantForm = ({ plantaExistente, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    nombrePersonalizado: '',
    idTipoPlanta: '',
    fecha_creacion: new Date().toISOString().split('T')[0],
    descripcion: '',
    aspecto: 'Normal',
    estado: 'normal',
    foto: null
  });

  const [errores, setErrores] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  // Tipos de plantas compatibles con PlantCard
  const tiposPlanta = [
    { id: 1, nombre: 'Aromática' },
    { id: 2, nombre: 'Suculenta' },
    { id: 3, nombre: 'Hortaliza' },
    { id: 4, nombre: 'Floral' },
    { id: 5, nombre: 'Frutal' },
    { id: 6, nombre: 'Ornamental' }
  ];

  // Estados compatibles con PlantCard
  const estadosPlanta = [
    { valor: 'saludable', etiqueta: '🌱 Saludable' },
    { valor: 'necesita_agua', etiqueta: '💧 Necesita Agua' },
    { valor: 'peligro', etiqueta: '⚠️ En Peligro' },
    { valor: 'normal', etiqueta: '✅ Normal' }
  ];

  const aspectosPlanta = ['Excelente', 'Bueno', 'Normal', 'Regular', 'Malo'];

  useEffect(() => {
    if (plantaExistente) {
      setFormData({
        nombrePersonalizado: plantaExistente.nombrePersonalizado || '',
        idTipoPlanta: plantaExistente.idTipoPlanta || '',
        fecha_creacion: plantaExistente.fecha_creacion || new Date().toISOString().split('T')[0],
        descripcion: plantaExistente.descripcion || '',
        aspecto: plantaExistente.aspecto || 'Normal',
        estado: plantaExistente.estado || 'normal',
        foto: plantaExistente.foto || null
      });
      
      if (plantaExistente.foto) {
        setImagePreview(plantaExistente.foto);
      }
    }
  }, [plantaExistente]);

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.nombrePersonalizado.trim()) {
      nuevosErrores.nombrePersonalizado = 'El nombre personalizado es requerido';
    }

    if (!formData.idTipoPlanta) {
      nuevosErrores.idTipoPlanta = 'El tipo de planta es requerido';
    }

    if (!formData.fecha_creacion) {
      nuevosErrores.fecha_creacion = 'La fecha es requerida';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const manejarCambio = (campo) => (event) => {
    const value = event.target.type === 'number' ? parseInt(event.target.value) : event.target.value;
    
    setFormData({
      ...formData,
      [campo]: value
    });
    
    if (errores[campo]) {
      setErrores({
        ...errores,
        [campo]: ''
      });
    }
  };

  const manejarImagen = (event) => {
    const file = event.target.files[0];
    if (file) {
      // En una aplicación real, aquí subirías la imagen y obtendrías la URL
      // Por ahora, simulamos con una URL local
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setFormData({
          ...formData,
          foto: imageUrl
        });
        setImagePreview(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const eliminarImagen = () => {
    setFormData({
      ...formData,
      foto: null
    });
    setImagePreview(null);
  };

  const manejarEnvio = (event) => {
    event.preventDefault();
    
    if (validarFormulario()) {
      onSubmit(formData);
    }
  };

  const manejarCancelar = () => {
    setFormData({
      nombrePersonalizado: '',
      idTipoPlanta: '',
      fecha_creacion: new Date().toISOString().split('T')[0],
      descripcion: '',
      aspecto: 'Normal',
      estado: 'normal',
      foto: null
    });
    setImagePreview(null);
    setErrores({});
    onCancel();
  };

  return (
    <div className="plant-form-container">
      <div className="plant-form-header">
        <h2>{plantaExistente ? 'Editar Planta' : 'Nueva Planta'}</h2>
        <p>Completa la información de tu planta</p>
      </div>

      <form onSubmit={manejarEnvio} className="plant-form">
        <div className="form-grid">
          {/* Primera fila - 2 columnas */}
          <div className="form-group">
            <label className="form-label">Nombre Personalizado *</label>
            <input
              type="text"
              className={`form-input ${errores.nombrePersonalizado ? 'error' : ''}`}
              value={formData.nombrePersonalizado}
              onChange={manejarCambio('nombrePersonalizado')}
              placeholder="Ej: Mi Rosa Favorita, Tomates del Balcón"
            />
            {errores.nombrePersonalizado && <span className="error-message">{errores.nombrePersonalizado}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de Planta *</label>
            <select
              className={`form-select ${errores.idTipoPlanta ? 'error' : ''}`}
              value={formData.idTipoPlanta}
              onChange={manejarCambio('idTipoPlanta')}
            >
              <option value="">Seleccionar tipo</option>
              {tiposPlanta.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
            {errores.idTipoPlanta && <span className="error-message">{errores.idTipoPlanta}</span>}
          </div>

          {/* Segunda fila - 2 columnas */}
          <div className="form-group">
            <label className="form-label">Fecha *</label>
            <input
              type="date"
              className={`form-input ${errores.fecha_creacion ? 'error' : ''}`}
              value={formData.fecha_creacion}
              onChange={manejarCambio('fecha_creacion')}
            />
            {errores.fecha_creacion && <span className="error-message">{errores.fecha_creacion}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Estado</label>
            <select
              className="form-select"
              value={formData.estado}
              onChange={manejarCambio('estado')}
            >
              {estadosPlanta.map((estado) => (
                <option key={estado.valor} value={estado.valor}>
                  {estado.etiqueta}
                </option>
              ))}
            </select>
          </div>

          {/* Tercera fila - 1 columna */}
          <div className="form-group full-width">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={formData.descripcion}
              onChange={manejarCambio('descripcion')}
              placeholder="Describe tu planta, cuidados especiales, etc."
            />
          </div>

          {/* Cuarta fila - 2 columnas */}
          <div className="form-group">
            <label className="form-label">Aspecto</label>
            <select
              className="form-select"
              value={formData.aspecto}
              onChange={manejarCambio('aspecto')}
            >
              {aspectosPlanta.map((aspecto) => (
                <option key={aspecto} value={aspecto}>
                  {aspecto}
                </option>
              ))}
            </select>
          </div>

          {/* Upload de imagen */}
          <div className="form-group full-width">
            <label className="form-label">Imagen de la planta</label>
            <div className="image-upload-container">
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button 
                    type="button" 
                    className="remove-image"
                    onClick={eliminarImagen}
                  >
                    ×
                  </button>
                </div>
              )}
              <label className="file-upload-label">
                <span className="upload-icon">📷</span>
                {imagePreview ? 'Cambiar imagen' : 'Seleccionar imagen'}
                <input
                  type="file"
                  className="file-input"
                  accept="image/*"
                  onChange={manejarImagen}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={manejarCancelar}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading && <div className="spinner-small"></div>}
            {plantaExistente ? 'Actualizar Planta' : 'Crear Planta'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlantForm;