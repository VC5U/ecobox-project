// src/components/plants/PlantEdit.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { plantasService } from '../../services/plantasService';
import './PlantEdit.css';

const PlantEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [planta, setPlanta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nombrePersonalizado: '',
    especie: '',
    descripcion: '',
    estado: 'normal',
    aspecto: 'normal'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const cargarPlanta = async () => {
      try {
        const data = await plantasService.getPlanta(id);
        setPlanta(data);
        setFormData({
          nombrePersonalizado: data.nombrePersonalizado || '',
          especie: data.especie || '',
          descripcion: data.descripcion || '',
          estado: data.estado || 'normal',
          aspecto: data.aspecto || 'normal'
        });
      } catch (error) {
        console.error('Error cargando planta:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarPlanta();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await plantasService.actualizarPlanta(id, formData);
      alert('✅ Planta actualizada correctamente');
      navigate(`/plantas/${id}`);
    } catch (error) {
      console.error('Error actualizando planta:', error);
      alert('❌ Error al actualizar la planta');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/plantas/${id}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando información de la planta...</p>
      </div>
    );
  }

  return (
    <div className="plant-edit-container">
      <div className="edit-header">
        <h1>✏️ Editar Planta: {planta?.nombrePersonalizado}</h1>
        <p>ID: {id}</p>
      </div>

      <form onSubmit={handleSubmit} className="plant-edit-form">
        <div className="form-group">
          <label htmlFor="nombrePersonalizado">Nombre de la Planta *</label>
          <input
            type="text"
            id="nombrePersonalizado"
            name="nombrePersonalizado"
            value={formData.nombrePersonalizado}
            onChange={handleChange}
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="especie">Especie</label>
          <input
            type="text"
            id="especie"
            name="especie"
            value={formData.especie}
            onChange={handleChange}
            className="form-input"
          />
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
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="estado">Estado</label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="form-select"
            >
              <option value="saludable">🌿 Saludable</option>
              <option value="normal">✅ Normal</option>
              <option value="necesita_agua">💧 Necesita Agua</option>
              <option value="peligro">⚠️ En Peligro</option>
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
            >
              <option value="normal">Normal</option>
              <option value="floreciendo">Floreciendo</option>
              <option value="con_frutos">Con Frutos</option>
              <option value="exuberante">Exuberante</option>
              <option value="hojas_amarillas">Hojas Amarillas</option>
              <option value="crecimiento_lento">Crecimiento Lento</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleCancel}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlantEdit;