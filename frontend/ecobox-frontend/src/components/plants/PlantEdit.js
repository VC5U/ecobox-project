import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { plantasService } from '../../services/plantasService';
import './PlantEdit.css';

const PlantEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombrePersonalizado: '',
    especie: '',
    descripcion: '',
    estado: 'normal',
    aspecto: 'normal'
  });

  useEffect(() => {
    const cargarPlanta = async () => {
      try {
        const data = await plantasService.getPlanta(id);
        setFormData({
          nombrePersonalizado: data.nombrePersonalizado || '',
          especie: data.especie || '',
          descripcion: data.descripcion || '',
          estado: data.estado || 'normal',
          aspecto: data.aspecto || 'normal'
        });
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarPlanta();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await plantasService.actualizarPlanta(id, formData);
      navigate(`/plantas/${id}`);
    } catch (error) {
      alert('Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Cargando datos de tu planta...</p>
    </div>
  );

  return (
    <div className="plant-edit-wrapper">
      <div className="plant-edit-container">
        <div className="edit-header">
          <div className="header-icon">🌿</div>
          <h1>Editar Planta</h1>
          <p>Modifica los detalles de <strong>{formData.nombrePersonalizado}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="plant-edit-form">
          
          <div className="form-section">
            <h3 className="section-title">📋 Información General</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre de la Planta *</label>
                <input
                  type="text"
                  name="nombrePersonalizado"
                  value={formData.nombrePersonalizado}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Ej: Mi Rosa Favorita"
                />
              </div>

              <div className="form-group">
                <label>Especie</label>
                <input
                  type="text"
                  name="especie"
                  value={formData.especie}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ej: Rosa hybrida"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">✨ Estado y Aspecto</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Nivel de Salud</label>
                <select name="estado" value={formData.estado} onChange={handleChange} className="form-select">
                  <option value="saludable">🌿 Saludable</option>
                  <option value="normal">✅ Normal</option>
                  <option value="necesita_agua">💧 Necesita Agua</option>
                  <option value="enferma">😷 Enferma</option>
                </select>
              </div>

              <div className="form-group">
                <label>Aspecto Visual</label>
                <select name="aspecto" value={formData.aspecto} onChange={handleChange} className="form-select">
                  <option value="normal">Normal</option>
                  <option value="floreciendo">🌸 Floreciendo</option>
                  <option value="con_frutos">🍅 Con Frutos</option>
                  <option value="crecimiento_lento">🐌 Crecimiento Lento</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">📝 Notas de Cuidado</h3>
            <div className="form-group">
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows="3"
                className="form-textarea"
                placeholder="Escribe aquí notas sobre el riego, luz o cambios que notes..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlantEdit;