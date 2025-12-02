// src/components/plants/PlantDetail.js
import React, { useState, useEffect } from 'react';
import { plantasService, sensoresService } from '../../services/plantasService';
import './PlantDetail.css';

const PlantDetail = ({ plantId, onEdit, onBack }) => {
  const [planta, setPlanta] = useState(null);
  const [sensores, setSensores] = useState([]);
  const [configuracion, setConfiguracion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    cargarDatosPlanta();
  }, [plantId]);

  const cargarDatosPlanta = async () => {
    try {
      setLoading(true);
      const [plantaData, sensoresData, configData] = await Promise.all([
        plantasService.getPlanta(plantId),
        plantasService.getSensoresPlanta(plantId),
        plantasService.getConfiguracionPlanta(plantId)
      ]);

      setPlanta(plantaData);
      setSensores(sensoresData);
      setConfiguracion(configData);
    } catch (error) {
      console.error('Error cargando datos de planta:', error);
    } finally {
      setLoading(false);
    }
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
        <p>Cargando información de la planta...</p>
      </div>
    );
  }

  if (!planta) {
    return (
      <div className="error-container">
        <h3>Planta no encontrada</h3>
        <button onClick={onBack} className="btn btn-secondary">
          Volver a la lista
        </button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(planta.estado);

  return (
    <div className="plant-detail">
      {/* Header */}
      <div className="plant-detail-header">
        <button onClick={onBack} className="back-button">
          ← Volver
        </button>
        <div className="header-actions">
          <button onClick={onEdit} className="btn btn-secondary">
            Editar
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
            </div>
          )}
          <div className="plant-status-badge" style={{ backgroundColor: statusInfo.color }}>
            <span className="status-icon">{statusInfo.icon}</span>
            <span className="status-label">{statusInfo.label}</span>
          </div>
        </div>

        <div className="plant-info">
          <h1 className="plant-name">{planta.nombrePersonalizado}</h1>
          <p className="plant-description">{planta.descripcion}</p>
          
          <div className="plant-meta-grid">
            <div className="meta-item">
              <span className="meta-label">Aspecto</span>
              <span className="meta-value">{getAspectoLabel(planta.aspecto)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Fecha de creación</span>
              <span className="meta-value">
                {new Date(planta.fecha_creacion).toLocaleDateString()}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Sensores activos</span>
              <span className="meta-value">{sensores.length}</span>
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
          📡 Sensores
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
          <ConfigTab configuracion={configuracion} plantaId={plantId} />
        )}
        
        {activeTab === 'history' && (
          <HistoryTab plantaId={plantId} />
        )}
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
              <div key={sensor.idSensor} className="sensor-card">
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
                
                <div className="sensor-actions">
                  <button className="btn-icon" title="Ver historial">
                    📈
                  </button>
                  <button className="btn-icon" title="Configurar">
                    ⚙️
                  </button>
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
const ConfigTab = ({ configuracion, plantaId }) => {
  return (
    <div className="config-tab">
      <h3>Configuración de Monitoreo</h3>
      
      {configuracion ? (
        <div className="config-form">
          <div className="config-item">
            <label>Humedad Objetivo</label>
            <div className="config-value">
              <span className="value">{configuracion.humedadObjetivo}%</span>
              <button className="btn btn-secondary btn-sm">
                Modificar
              </button>
            </div>
          </div>
          
          <div className="config-item">
            <label>Temperatura Máxima</label>
            <div className="config-value">
              <span className="value">{configuracion.tempMax}°C</span>
              <button className="btn btn-secondary btn-sm">
                Modificar
              </button>
            </div>
          </div>
          
          <div className="config-item">
            <label>Temperatura Mínima</label>
            <div className="config-value">
              <span className="value">{configuracion.tempMin}°C</span>
              <button className="btn btn-secondary btn-sm">
                Modificar
              </button>
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
const HistoryTab = ({ plantaId }) => {
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

export default PlantDetail;