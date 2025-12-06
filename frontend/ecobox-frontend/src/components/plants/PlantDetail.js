// src/components/plants/PlantDetail.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { plantasService } from '../../services/plantasService';
import './PlantDetail.css';

const PlantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [planta, setPlanta] = useState(null);
  const [sensores, setSensores] = useState([]);
  const [configuracion, setConfiguracion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cargarDatosPlanta = useCallback(async () => {
    console.log("🚀 cargarDatosPlanta iniciando...");
    console.log("🔍 ID de la URL (useParams):", id);
    
    if (!id || id === "undefined") {
      console.error("❌ ID de planta no válido desde URL");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const idNumerico = parseInt(id);
      if (isNaN(idNumerico)) {
        throw new Error("ID de la URL no es un número válido");
      }
      
      console.log("🔢 Cargando datos para planta ID:", idNumerico);
      
      const [plantaData, sensoresData, configData] = await Promise.all([
        plantasService.getPlanta(idNumerico),
        plantasService.getSensoresPlanta(idNumerico),
        plantasService.getConfiguracionPlanta(idNumerico)
      ]);
      
      console.log("✅ Datos cargados exitosamente");
      setPlanta(plantaData);
      setSensores(sensoresData || []);
      setConfiguracion(configData);
      
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      const plantaDemo = demoData.plantas.find(p => p.id === parseInt(id)) || demoData.plantas[0];
      setPlanta(plantaDemo);
      setSensores(demoData.sensores.filter(s => s.idPlanta === parseInt(id)));
      setConfiguracion(demoData.configuraciones?.find(c => c.idPlanta === parseInt(id)));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      cargarDatosPlanta();
    }
  }, [id, cargarDatosPlanta]);

  const handleBack = () => {
    navigate('/plantas');
  };

  const handleEdit = () => {
    navigate(`/plantas/${id}/editar`);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    
    try {
      console.log(`🗑️ Eliminando planta ID: ${id}`);
      const resultado = await plantasService.eliminarPlanta(id);
      
      console.log("✅ Resultado de eliminación:", resultado);
      
      if (resultado.success) {
        alert(`✅ ${resultado.message}`);
        navigate('/plantas');
      } else {
        alert(`❌ ${resultado.message}`);
        setShowDeleteModal(false);
      }
      
    } catch (error) {
      console.error('❌ Error eliminando planta:', error);
      alert('❌ Error al eliminar la planta. Intenta nuevamente.');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const getStatusInfo = (estado) => {
    const statusInfo = {
      saludable: { color: '#4CAF50', icon: '🌱', label: 'Saludable' },
      necesita_agua: { color: '#FF9800', icon: '💧', label: 'Necesita Agua' },
      peligro: { color: '#F44336', icon: '⚠️', label: 'En Peligro' },
      normal: { color: '#2196F3', icon: '✅', label: 'Normal' }
    };
    return statusInfo[estado] || statusInfo.normal;
  };

  const getAspectoLabel = (aspecto) => {
    const aspectos = {
      normal: 'Normal',
      floreciendo: 'Floreciendo',
      con_frutos: 'Con Frutos',
      hojas_amarillas: 'Hojas Amarillas',
      crecimiento_lento: 'Crecimiento Lento',
      exuberante: 'Exuberante'
    };
    return aspectos[aspecto] || aspecto;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando información de la planta ID: {id}...</p>
      </div>
    );
  }

  if (!planta) {
    return (
      <div className="error-container">
        <h3>🌿 Planta no encontrada</h3>
        <p>No se encontró una planta con el ID: <strong>{id || 'No especificado'}</strong></p>
        <div className="error-actions">
          <button onClick={handleBack} className="btn btn-primary">
            ← Volver a la lista
          </button>
          <button onClick={() => navigate('/plantas/nueva')} className="btn btn-secondary">
            + Crear nueva planta
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(planta.estado);

  return (
    <div className="plant-detail">
      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <div className="modal-header">
              <h3>🗑️ Eliminar Planta</h3>
              <button 
                onClick={handleDeleteCancel}
                className="modal-close"
                disabled={deleting}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-warning">
                <div className="warning-icon">⚠️</div>
                <h4>¿Estás seguro de que quieres eliminar esta planta?</h4>
                <p>
                  <strong>{planta.nombrePersonalizado}</strong> (ID: {id})
                </p>
                <p className="warning-text">
                  Esta acción no se puede deshacer. Se eliminarán todos los datos 
                  asociados a esta planta, incluyendo sensores y registros.
                </p>
                
                {sensores.length > 0 && (
                  <div className="sensors-warning">
                    <p>📡 <strong>Atención:</strong> Esta planta tiene {sensores.length} sensor(es) asociado(s).</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={handleDeleteCancel}
                className="btn btn-secondary"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="btn btn-danger"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <span className="spinner-small"></span>
                    Eliminando...
                  </>
                ) : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="plant-detail-header">
        <button onClick={handleBack} className="back-button">
          ← Volver a Mis Plantas
        </button>
        <div className="header-actions">
          <button onClick={handleEdit} className="btn btn-secondary">
            ✏️ Editar Planta
          </button>
          <button 
            onClick={handleDeleteClick} 
            className="btn btn-danger"
          >
            🗑️ Eliminar
          </button>
        </div>
      </div>

      {/* Plant Overview */}
      <div className="plant-overview">
        <div className="plant-image-section">
          {planta.foto ? (
            <img src={planta.foto} alt={planta.nombrePersonalizado} className="plant-main-image" />
          ) : (
            <div className="plant-image-placeholder">
              <span className="placeholder-icon">🌿</span>
              <span className="placeholder-text">Sin imagen</span>
            </div>
          )}
          <div className="plant-status-badge" style={{ backgroundColor: statusInfo.color }}>
            <span className="status-icon">{statusInfo.icon}</span>
            <span className="status-label">{statusInfo.label}</span>
          </div>
        </div>

        <div className="plant-info">
          <div className="plant-title-section">
            <h1 className="plant-name">{planta.nombrePersonalizado}</h1>
            <span className="plant-id-badge">ID: {id}</span>
          </div>
          <p className="plant-scientific-name">
            {planta.especie || 'Especie no especificada'}
          </p>
          <p className="plant-description">{planta.descripcion || 'Sin descripción disponible'}</p>
          
          <div className="plant-meta-grid">
            <div className="meta-item">
              <span className="meta-label">Aspecto</span>
              <span className="meta-value">{getAspectoLabel(planta.aspecto)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Fecha de creación</span>
              <span className="meta-value">
                {new Date(planta.fecha_creacion).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Sensores activos</span>
              <span className="meta-value">{sensores.length}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Familia</span>
              <span className="meta-value">{planta.familia || 'No especificada'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="plant-detail-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Resumen
        </button>
        <button 
          className={`tab-button ${activeTab === 'sensors' ? 'active' : ''}`}
          onClick={() => setActiveTab('sensors')}
        >
          📡 Sensores ({sensores.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          ⚙️ Configuración
        </button>
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📈 Historial
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <OverviewTab planta={planta} sensores={sensores} configuracion={configuracion} />
        )}
        
        {activeTab === 'sensors' && (
          <SensorsTab sensores={sensores} />
        )}
        
        {activeTab === 'config' && (
          <ConfigTab configuracion={configuracion} plantId={id} />
        )}
        
        {activeTab === 'history' && (
          <HistoryTab plantId={id} />
        )}
      </div>

      {/* Debug Info */}
      <div className="debug-section">
        <details>
          <summary>🔍 Información de Debug</summary>
          <div className="debug-content">
            <p><strong>ID:</strong> {id}</p>
            <p><strong>URL:</strong> {window.location.href}</p>
            <p><strong>Sensores:</strong> {sensores.length}</p>
            <pre>{JSON.stringify(planta, null, 2)}</pre>
          </div>
        </details>
      </div>
    </div>
  );
};

// Componente para la pestaña de Resumen
const OverviewTab = ({ planta, sensores, configuracion }) => {
  return (
    <div className="overview-tab">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">💧</div>
          <div className="metric-info">
            <span className="metric-value">
              {sensores.find(s => s.idTipoSensor === 1)?.ultimaMedicion?.valor || '--'}%
            </span>
            <span className="metric-label">Humedad Actual</span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">🌡️</div>
          <div className="metric-info">
            <span className="metric-value">
              {sensores.find(s => s.idTipoSensor === 2)?.ultimaMedicion?.valor || '--'}°C
            </span>
            <span className="metric-label">Temperatura</span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-info">
            <span className="metric-value">{sensores.length}</span>
            <span className="metric-label">Sensores Activos</span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-info">
            <span className="metric-value">
              {configuracion ? `${configuracion.humedadObjetivo}%` : '--'}
            </span>
            <span className="metric-label">Humedad Objetivo</span>
          </div>
        </div>
      </div>

      {/* Información General */}
      <div className="info-section">
        <h3>Información General</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Familia</span>
            <span className="info-value">{planta.familia || 'No especificada'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Última actualización</span>
            <span className="info-value">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Alertas rápidas */}
      <div className="alerts-section">
        <h3>Estado Actual</h3>
        <div className="alert-item info">
          <span className="alert-icon">ℹ️</span>
          <div className="alert-content">
            <span className="alert-title">Planta {planta.estado}</span>
            <span className="alert-message">
              {planta.estado === 'necesita_agua' 
                ? 'Tu planta necesita riego urgente' 
                : 'Tu planta se encuentra en buen estado'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para la pestaña de Sensores
const SensorsTab = ({ sensores }) => {
  const getTipoSensor = (idTipoSensor) => {
    const tipos = {
      1: { nombre: 'Humedad', unidad: '%', icon: '💧' },
      2: { nombre: 'Temperatura', unidad: '°C', icon: '🌡️' },
      3: { nombre: 'Luz', unidad: 'lux', icon: '💡' }
    };
    return tipos[idTipoSensor] || { nombre: 'Desconocido', unidad: '', icon: '📡' };
  };

  const getEstadoSensor = (idEstadoSensor) => {
    const estados = {
      1: { label: 'Activo', color: '#4CAF50' },
      2: { label: 'Inactivo', color: '#757575' },
      3: { label: 'Error', color: '#f44336' }
    };
    return estados[idEstadoSensor] || estados[2];
  };

  return (
    <div className="sensors-tab">
      <div className="sensors-header">
        <h3>Sensores Conectados</h3>
        <button className="btn btn-primary btn-sm">
          + Agregar Sensor
        </button>
      </div>

      {sensores.length === 0 ? (
        <div className="empty-sensors">
          <div className="empty-icon">📡</div>
          <h4>No hay sensores conectados</h4>
          <p>Conecta un sensor para comenzar a monitorear tu planta</p>
          <button className="btn btn-primary">
            Configurar Primer Sensor
          </button>
        </div>
      ) : (
        <div className="sensors-grid">
          {sensores.map(sensor => {
            const tipo = getTipoSensor(sensor.idTipoSensor);
            const estado = getEstadoSensor(sensor.idEstadoSensor);
            
            return (
              <div key={sensor.id} className="sensor-card">
                <div className="sensor-header">
                  <div className="sensor-icon">{tipo.icon}</div>
                  <div className="sensor-status" style={{ backgroundColor: estado.color }}>
                    {estado.label}
                  </div>
                </div>
                
                <div className="sensor-info">
                  <h4 className="sensor-name">{tipo.nombre}</h4>
                  <p className="sensor-mac">{sensor.macAddress}</p>
                  
                  {sensor.ultimaMedicion && (
                    <div className="sensor-reading">
                      <span className="reading-value">
                        {sensor.ultimaMedicion.valor}{tipo.unidad}
                      </span>
                      <span className="reading-time">
                        {new Date(sensor.ultimaMedicion.fechaHora).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Componente para la pestaña de Configuración
const ConfigTab = ({ configuracion, plantId }) => {
  return (
    <div className="config-tab">
      <h3>Configuración de Monitoreo</h3>
      
      {configuracion ? (
        <div className="config-form">
          <div className="config-item">
            <label>Humedad Objetivo</label>
            <div className="config-value">
              <span className="value">{configuracion.humedadObjetivo}%</span>
            </div>
          </div>
          
          <div className="config-item">
            <label>Temperatura Máxima</label>
            <div className="config-value">
              <span className="value">{configuracion.tempMax}°C</span>
            </div>
          </div>
          
          <div className="config-item">
            <label>Temperatura Mínima</label>
            <div className="config-value">
              <span className="value">{configuracion.tempMin}°C</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-config">
          <div className="empty-icon">⚙️</div>
          <h4>No hay configuración establecida</h4>
          <p>Configura los parámetros ideales para tu planta</p>
          <button className="btn btn-primary">
            Establecer Configuración
          </button>
        </div>
      )}
    </div>
  );
};

// Componente para la pestaña de Historial
const HistoryTab = ({ plantId }) => {
  return (
    <div className="history-tab">
      <h3>Historial de la Planta</h3>
      <div className="history-empty">
        <div className="empty-icon">📈</div>
        <h4>Próximamente</h4>
        <p>El historial detallado de mediciones y eventos estará disponible pronto</p>
      </div>
    </div>
  );
};

// Datos demo locales para fallback
const demoData = {
  plantas: [
    {
      id: 1,
      idPlanta: 1,
      nombrePersonalizado: "Lavanda del Jardín",
      especie: "Lavandula",
      estado: "saludable",
      aspecto: "floreciendo",
      fecha_creacion: "2024-01-15",
      foto: "/images/lavanda.jpg",
      descripcion: "Lavanda francesa en maceta de terracota",
      familia: 1
    }
  ],
  sensores: [
    {
      id: 1,
      idPlanta: 1,
      idTipoSensor: 1,
      idEstadoSensor: 1,
      macAddress: "AA:BB:CC:DD:EE:01",
      ultimaMedicion: {
        valor: 65,
        fechaHora: "2024-03-20T10:30:00Z"
      }
    }
  ],
  configuraciones: [
    {
      id: 1,
      idPlanta: 1,
      humedadObjetivo: 60,
      tempMax: 30,
      tempMin: 15
    }
  ]
};

export default PlantDetail;