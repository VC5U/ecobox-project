// Seguimiento.js - VERSIÓN COMPLETA CON IMÁGENES
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Seguimiento.css';

const Seguimiento = ({ plantaId, onBack, onAddSeguimiento }) => {
  const [planta, setPlanta] = useState(null);
  const [seguimientos, setSeguimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (plantaId) {
      fetchPlantData();
    }
  }, [plantaId]);

  const fetchPlantData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Cargando datos para planta:', plantaId);
      
      // Obtener datos de la planta
      const plantResponse = await api.get(`/plantas/${plantaId}/`);
      console.log('✅ Datos planta:', plantResponse.data);
      setPlanta(plantResponse.data);
      
      // Obtener TODOS los seguimientos primero
      console.log('📊 Obteniendo todos los seguimientos...');
      const trackingResponse = await api.get(`/seguimientos-estado/`);
      
      console.log(`✅ ${trackingResponse.data.length} seguimientos obtenidos en total`);
      
      // Filtrar MANUALMENTE por planta
      const seguimientosFiltrados = trackingResponse.data.filter(
        seguimiento => seguimiento.planta === parseInt(plantaId)
      );
      
      console.log(`🔍 ${seguimientosFiltrados.length} seguimientos para planta ${plantaId} después de filtrar`);
      
      // Ordenar por fecha (más reciente primero)
      const seguimientosOrdenados = seguimientosFiltrados.sort(
        (a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro)
      );
      
      setSeguimientos(seguimientosOrdenados);
      
      // Si no hay seguimientos, mostrar mensaje
      if (seguimientosOrdenados.length === 0) {
        console.log(`📭 No hay seguimientos para la planta ${plantaId}`);
      }
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      
      // Manejar error específico
      if (error.response) {
        console.error('📊 Detalles error:', error.response.status);
        
        if (error.response.status === 404) {
          setError('No se encontraron seguimientos');
          setSeguimientos([]);
        } else if (error.response.status === 403) {
          setError('No tienes permisos para ver los seguimientos');
        } else {
          setError(`Error ${error.response.status}`);
        }
      } else if (error.request) {
        setError('No se pudo conectar con el servidor');
      } else {
        setError(error.message || 'Error desconocido');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // Función para refrescar los datos
  const handleRefresh = () => {
    fetchPlantData();
  };

  // Función para obtener la clase CSS según el estado
  const getEstadoClass = (estado) => {
    if (!estado) return '';
    
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('saludable') || estadoLower.includes('excelente') || estadoLower.includes('bueno')) {
      return 'estado-bueno';
    } else if (estadoLower.includes('necesita') || estadoLower.includes('atencion') || estadoLower.includes('cuidado')) {
      return 'estado-atencion';
    } else if (estadoLower.includes('enferm') || estadoLower.includes('critic') || estadoLower.includes('problema')) {
      return 'estado-critico';
    } else {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando seguimientos...</p>
      </div>
    );
  }

  return (
    <div className="seguimiento-container">
      {/* Encabezado con botón de refrescar */}
      <div className="seguimiento-header">
        <button 
          className="back-button"
          onClick={onBack}
          aria-label="Volver"
        >
          ←
        </button>
        <div className="header-text">
          <h1 className="plant-name">{planta?.nombrePersonalizado || 'Planta'}</h1>
          <p className="plant-subtitle">
            Seguimiento visual 
            <span className="seguimiento-count">
              ({seguimientos.length} seguimientos)
            </span>
          </p>
        </div>
        <button 
          className="refresh-button"
          onClick={handleRefresh}
          aria-label="Refrescar"
          title="Refrescar seguimientos"
        >
          🔄
        </button>
      </div>

      {/* Botón flotante de agregar seguimiento */}
      <button 
        className="floating-add-button"
        onClick={onAddSeguimiento}
        aria-label="Agregar seguimiento"
      >
        <span className="button-icon">📝</span>
        Agregar Seguimiento
      </button>

      {/* Mostrar error si existe */}
      {error && (
        <div className="alert alert-warning">
          <strong>⚠️ Atención:</strong> {error}
          <button 
            onClick={fetchPlantData}
            className="btn-retry"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Historial de seguimientos */}
      <main className="seguimiento-content">
        <div className="section-header">
          <h2 className="section-title">Historial de seguimientos</h2>
          {seguimientos.length > 0 && (
            <span className="seguimiento-total">
              {seguimientos.length} {seguimientos.length === 1 ? 'registro' : 'registros'}
            </span>
          )}
        </div>
        
        {seguimientos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No hay seguimientos registrados</h3>
            <p>Aún no has registrado ningún seguimiento para esta planta.</p>
            <button 
              className="primary-button"
              onClick={onAddSeguimiento}
            >
              <span className="button-icon">➕</span>
              Agregar primer seguimiento
            </button>
          </div>
        ) : (
          <div className="seguimiento-cards-container">
            {seguimientos.map((seguimiento, index) => (
              <div key={seguimiento.id} className="seguimiento-card">
                {/* Indicador de orden si es el más reciente */}
                {index === 0 && (
                  <div className="seguimiento-reciente-badge">
                    <span className="badge-icon">🆕</span>
                    Más reciente
                  </div>
                )}
                
                {/* Imagen del seguimiento si existe */}
                {seguimiento.imagen_url && (
                  <div 
                    className="seguimiento-imagen-container"
                    onClick={() => openImageModal(seguimiento.imagen_url)}
                  >
                    <img 
                      src={seguimiento.imagen_url} 
                      alt={`Estado: ${seguimiento.estado}`}
                      className="seguimiento-imagen"
                      loading="lazy"
                    />
                    <div className="imagen-overlay">
                      <span className="zoom-icon">🔍</span>
                      <span className="zoom-text">Click para ampliar</span>
                    </div>
                  </div>
                )}
                
                <div className="seguimiento-info">
                  <div className="estado-header">
                    <div className={`estado-badge ${getEstadoClass(seguimiento.estado)}`}>
                      {seguimiento.estado}
                    </div>
                    <span className="seguimiento-id">#{seguimiento.id}</span>
                  </div>
                  
                  <h3 className="seguimiento-titulo">
                    Estado: {seguimiento.estado}
                  </h3>
                  
                  {seguimiento.observaciones && (
                    <div className="seguimiento-observaciones-container">
                      <h4>Observaciones:</h4>
                      <p className="seguimiento-observaciones">
                        {seguimiento.observaciones}
                      </p>
                    </div>
                  )}
                  
                  <div className="seguimiento-meta">
                    <div className="seguimiento-fecha">
                      <span className="date-icon">📅</span>
                      <span>{formatDate(seguimiento.fecha_registro)}</span>
                    </div>
                    
                    {/* Indicadores */}
                    <div className="seguimiento-indicators">
                      {seguimiento.imagen_url && (
                        <span className="imagen-indicator" title="Este seguimiento tiene una imagen">
                          📸 Con imagen
                        </span>
                      )}
                      
                      {/* Mostrar si pertenece a otra planta (debería ser raro con el filtro) */}
                      {seguimiento.planta && seguimiento.planta !== parseInt(plantaId) && (
                        <span className="planta-id-warning" title="Este seguimiento pertenece a otra planta">
                          ⚠️ Planta ID: {seguimiento.planta}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal para imagen ampliada */}
      {selectedImage && (
        <div className="imagen-modal" onClick={closeImageModal}>
          <div className="imagen-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="imagen-modal-close"
              onClick={closeImageModal}
              aria-label="Cerrar"
            >
              ✕
            </button>
            <img 
              src={selectedImage} 
              alt="Vista ampliada" 
              className="imagen-modal-img"
            />
            <div className="imagen-modal-info">
              <p>Haz clic fuera de la imagen para cerrar</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Seguimiento;