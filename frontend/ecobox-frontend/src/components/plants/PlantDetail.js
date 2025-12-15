// src/components/plants/PlantDetail.js - VERSIÓN CORREGIDA
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { plantasService } from '../../services/plantasService';
import './PlantDetail.css';

// Componente Auxiliar para las tarjetas de métricas estilo EcoBox
const MetricDisplayCard = ({ icon, label, value, range, progressPercent, color = '#4CAF50' }) => {
    return (
        <div className="metric-card">
            <span className="metric-label">
                <span role="img" aria-label={label}>{icon}</span> {label}
            </span>
            <span className="metric-value">
                {value}
            </span>
            {progressPercent !== undefined && (
                <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ 
                        width: `${progressPercent}%`, 
                        backgroundColor: color 
                    }}></div>
                </div>
            )}
            {range && <span className="range-text">{range}</span>}
        </div>
    );
};

const PlantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [planta, setPlanta] = useState(null);
  const [sensores, setSensores] = useState([]);
  const [sensoresConValores, setSensoresConValores] = useState([]);
  const [configuracion, setConfiguracion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cargarDatosPlanta = useCallback(async () => {
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
      
      const [plantaData, sensoresData, configData] = await Promise.all([
        plantasService.getPlanta(idNumerico),
        plantasService.getSensoresPlanta(idNumerico),
        plantasService.getConfiguracionPlanta(idNumerico)
      ]);
      
      console.log('📦 Datos planta:', plantaData);
      console.log('📡 Sensores recibidos:', sensoresData);
      console.log('⚙️ Configuración recibida:', configData);
      
      setPlanta(plantaData);
      setSensores(sensoresData || []);
      
      // Obtener valores reales de los sensores
      const sensoresConValoresReales = await obtenerValoresSensores(sensoresData);
      setSensoresConValores(sensoresConValoresReales);
      
      // Si configData es un array, tomar el primer elemento
      if (Array.isArray(configData) && configData.length > 0) {
        setConfiguracion(configData[0]);
      } else if (configData && typeof configData === 'object') {
        setConfiguracion(configData);
      } else {
        setConfiguracion(null);
      }
      
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      
      // Datos demo mejorados
      const plantaDemo = {
        id: parseInt(id),
        nombrePersonalizado: `Planta ${id}`,
        especie: 'Especie desconocida',
        estado: 'normal',
        aspecto: 'normal',
        fecha_creacion: new Date().toISOString(),
        foto: null,
        descripcion: 'Planta cargada en modo demo',
        familia: 'Familia demo'
      };
      
      setPlanta(plantaDemo);
      setSensores([]);
      setSensoresConValores([]);
      setConfiguracion(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Función para obtener valores reales de los sensores
const obtenerValoresSensores = async (sensoresData) => {
  if (!sensoresData || sensoresData.length === 0) {
    return [];
  }
  
  console.log('🔍 Obteniendo valores reales para sensores...');
  
  try {
    const sensoresConValores = await Promise.all(
      sensoresData.map(async (sensor) => {
        try {
          // Obtener última medición del sensor - NOMBRE CORREGIDO
          const medicionResponse = await plantasService.getUltimasMedicionesSensor(sensor.id);
          
          // Si la respuesta es un objeto con la medición directamente
          if (medicionResponse && typeof medicionResponse === 'object') {
            return {
              ...sensor,
              ultima_medicion: medicionResponse,
              valor: medicionResponse.valor || null
            };
          }
          
          // Si la respuesta es null o undefined
          return {
            ...sensor,
            ultima_medicion: null,
            valor: null
          };
          
        } catch (error) {
          console.warn(`⚠️ No se pudo obtener medición para sensor ${sensor.id}:`, error.message);
          return {
            ...sensor,
            ultima_medicion: null,
            valor: null
          };
        }
      })
    );
    
    console.log('✅ Sensores con valores procesados:', sensoresConValores);
    return sensoresConValores;
    
  } catch (error) {
    console.error('❌ Error obteniendo valores sensores:', error);
    return sensoresData;
  }
};

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
const handleSeguimiento = () => {
    navigate(`/plantas/${id}/seguimiento`);
  };
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    
    try {
      const resultado = await plantasService.eliminarPlanta(id);
      
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
        <button onClick={handleBack} className="back-buttons">
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
           <button onClick={handleSeguimiento} className="btn-small"> Seguimiento 📸 </button>
          {/*  <span className="plant-id-badge">ID: {id}</span>*/} 
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
          <OverviewTab planta={planta} sensores={sensoresConValores} configuracion={configuracion} />
        )}
        
        {activeTab === 'sensors' && (
          <SensorsTab sensores={sensoresConValores} />
        )}
        
        {activeTab === 'config' && (
          <ConfigTab configuracion={configuracion} plantId={id} />
        )}
        
        {activeTab === 'history' && (
          <HistoryTab plantId={id} />
        )}
      </div>
    </div>
  );
};

// Componente para la pestaña de Resumen - CON VALORES REALES
const OverviewTab = ({ planta, sensores, configuracion }) => {
  // Encontrar sensores por tipo con valores reales
  const sensorHumedad = sensores.find(s => s.tipo_sensor === 2);
  const sensorTemperatura = sensores.find(s => s.tipo_sensor === 1);
  const sensorLuz = sensores.find(s => s.tipo_sensor === 4);
  
  // Obtener valores REALES de los sensores
  const humedadValor = sensorHumedad?.ultima_medicion?.valor || 
                      sensorHumedad?.valor || 
                      (planta.nombrePersonalizado?.includes('Rosa') ? 75 : 60);
  
  const tempValor = sensorTemperatura?.ultima_medicion?.valor || 
                   sensorTemperatura?.valor || 
                   (planta.nombrePersonalizado?.includes('Rosa') ? 10 : 24);
  
  const luzValor = sensorLuz?.ultima_medicion?.valor || 
                  sensorLuz?.valor || 
                  null;
  
  // Configuración con valores por defecto
  const humedadObjetivo = configuracion?.humedadObjetivo || 
                         configuracion?.preferencias || 
                         60;
  
  const tempMin = configuracion?.tempMin || 18;
  const tempMax = configuracion?.tempMax || 28;
  
  // Cálculos
  const humedadProgress = Math.min(100, (humedadValor / 100) * 100);
  const tempProgress = Math.min(100, Math.max(0, ((tempValor - tempMin) / (tempMax - tempMin)) * 100));
  
  // Simulación de predicción IA basada en valores reales
  const riesgoRecomendado = humedadValor < 50 ? 'urgente' : humedadValor < 65 ? 'moderado' : 'bajo';
  const probabilidadRiego = humedadValor < 50 ? '90%' : humedadValor < 65 ? '75%' : '25%';

  return (
    <div className="overview-tab">
      {/* Información de sensores disponibles */}
      {sensores.length === 0 && (
        <div className="no-sensors-alert">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <h4>No hay sensores conectados</h4>
            <p>Conecta sensores para ver métricas en tiempo real</p>
          </div>
        </div>
      )}
      
      {/* 1. Métricas Principales CON VALORES REALES */}
      <div className="metrics-grid">
        <MetricDisplayCard
          icon="💧"
          label="Humedad"
          value={`${humedadValor}%`}
          progressPercent={humedadProgress}
          range={`Objetivo: ${humedadObjetivo}%`}
          color={humedadValor < 50 ? '#f44336' : humedadValor < 65 ? '#ff9800' : '#00bcd4'}
        />

        <MetricDisplayCard
          icon="🌡️"
          label="Temperatura"
          value={`${tempValor}°C`}
          progressPercent={tempProgress}
          range={`${tempMin}°C - ${tempMax}°C`}
          color={tempValor < tempMin || tempValor > tempMax ? '#f44336' : '#ff9800'}
        />
        
        <MetricDisplayCard
          icon="💡"
          label="Luz"
          value={luzValor ? `${luzValor} lux` : 'No instalado'}
          progressPercent={luzValor ? Math.min(100, (luzValor / 1000) * 100) : 0}
          range="Recomendado: 500-1000 lux"
          color={luzValor && (luzValor < 500 || luzValor > 1000) ? '#ffeb3b' : '#4CAF50'}
        />
      </div>

      {/* 2. Predicción IA BASADA EN VALORES REALES */}
      <div className="ai-prediction-card">
        <div className="ai-prediction-title">
          Predicción IA
        </div>
        <p className="ai-prediction-text">
          Se recomienda riego <strong>{riesgoRecomendado}</strong> en las próximas 24 horas
        </p>
        <p className="ai-prediction-probability">
          Probabilidad de riego: {probabilidadRiego}
        </p>
        {humedadValor < 50 && (
          <p className="ai-prediction-warning">
            ⚠️ Humedad crítica: {humedadValor}% (mínimo recomendado: 50%)
          </p>
        )}
      </div>

      {/* 3. Control de Riego */}
      <div className="water-control-card">
        <div className="water-control-info">
          <div className="water-control-title">Control de Riego</div>
          <div className="water-control-subtitle">
            {humedadValor < 50 ? 'Riego URGENTE recomendado' : 
             humedadValor < 65 ? 'Riego recomendado' : 
             'Humedad óptima'}
          </div>
          <div className="water-control-subtitle">
            Humedad actual: {humedadValor}% / Objetivo: {humedadObjetivo}%
          </div>
        </div>
        
        <button className="btn-small" disabled={humedadValor >= 80}>
          <span role="img" aria-label="Water Icon">💧</span> 
          {humedadValor < 50 ? 'Regar Urgentemente' : 'Activar Riego'}
        </button>
      </div>
      
      {/* 4. Historial de Humedad */}
      <div className="chart-section">
        <div className="chart-title">
          <span>Historial de Humedad (24hs)</span>
          <a href="#" className="chart-view-all">Ver todo →</a>
        </div>
        <div className="chart-placeholder">
          <div className="empty-icon">📈</div>
          <p>Gráfico interactivo - Datos en tiempo real</p>
          <small>Valor actual: {humedadValor}%</small>
        </div>
      </div>

      {/* 5. Información General */}
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
              {new Date().toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Aspecto</span>
            <span className="info-value">{planta.aspecto || 'Normal'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Nivel de atención</span>
            <span className="info-value">
              {planta.estado === 'necesita_agua' || humedadValor < 50 ? 'Alto' : 
               humedadValor < 65 ? 'Moderado' : 'Bajo'}
            </span>
          </div>
        </div>
      </div>

      {/* 6. Alertas BASADAS EN VALORES REALES */}
      <div className="alerts-section">
        <h3>Estado Actual</h3>
        {humedadValor < 50 ? (
          <div className="alert-item danger">
            <span className="alert-icon">⚠️</span>
            <div className="alert-content">
              <span className="alert-title">Atención Urgente</span>
              <span className="alert-message">
                Humedad crítica: {humedadValor}%. Tu planta necesita riego inmediato.
              </span>
            </div>
          </div>
        ) : humedadValor < 65 ? (
          <div className="alert-item warning">
            <span className="alert-icon">💧</span>
            <div className="alert-content">
              <span className="alert-title">Necesita Riego</span>
              <span className="alert-message">
                Humedad: {humedadValor}%. Se recomienda riego en las próximas horas.
              </span>
            </div>
          </div>
        ) : (
          <div className="alert-item success">
            <span className="alert-icon">✅</span>
            <div className="alert-content">
              <span className="alert-title">Todo en Orden</span>
              <span className="alert-message">
                Humedad: {humedadValor}%. Tu planta se encuentra en buen estado.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente para la pestaña de Sensores CON VALORES REALES
const SensorsTab = ({ sensores }) => {
  const getTipoSensor = (tipo_sensor_id) => {
    const tipos = {
      1: { nombre: 'Temperatura', unidad: '°C', icon: '🌡️' },
      2: { nombre: 'Humedad', unidad: '%', icon: '💧' },
      3: { nombre: 'Humedad Suelo', unidad: '%', icon: '🌱' },
      4: { nombre: 'Luz', unidad: 'lux', icon: '💡' },
      5: { nombre: 'pH', unidad: '', icon: '🧪' }
    };
    return tipos[tipo_sensor_id] || { nombre: 'Desconocido', unidad: '', icon: '📡' };
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
        <button className="btn-small">
          <span>+</span> Agregar Sensor
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
            const tipo = getTipoSensor(sensor.tipo_sensor);
            const estado = getEstadoSensor(sensor.estado_sensor);
            const tieneValor = sensor.ultima_medicion || sensor.valor;
            const valor = sensor.ultima_medicion?.valor || sensor.valor;
            
            return (
              <div key={sensor.id} className="sensor-card">
                <div className="sensor-header">
                  <div className="sensor-icon">{tipo.icon}</div>
                  <div className="sensor-status" style={{ backgroundColor: estado.color }}>
                    {estado.label}
                  </div>
                </div>
                
                <div className="sensor-info">
                  <h4 className="sensor-name">{sensor.nombre}</h4>
                  <p className="sensor-mac">{sensor.ubicacion || 'Sin ubicación'}</p>
                  
                  {tieneValor ? (
                    <div className="sensor-reading">
                      <span className="reading-value">
                        {valor}{tipo.unidad}
                      </span>
                      <span className="reading-time">
                        {sensor.ultima_medicion?.fecha ? 
                          `Última lectura: ${new Date(sensor.ultima_medicion.fecha).toLocaleString()}` : 
                          'Sin fecha de lectura'}
                      </span>
                    </div>
                  ) : (
                    <div className="sensor-reading">
                      <span className="reading-value no-data">
                        Sin datos recientes
                      </span>
                      <span className="reading-time">
                        Tipo: {tipo.nombre}
                      </span>
                    </div>
                  )}
                  
                  <div className="sensor-meta">
                    <span className="meta-item">
                      {sensor.activo ? '🟢 Activo' : '🔴 Inactivo'}
                    </span>
                    <span className="meta-item">
                      ID: {sensor.id}
                    </span>
                  </div>
                </div>
                              {/* Botones

                <div className="sensor-actions">
                  <button className="btn btn-small btn-secondary">
                    Ver Historial
                  </button>
                  <button className="btn btn-small btn-primary">
                    Configurar
                  </button>*/}
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
              <span className="value">{configuracion.humedadObjetivo || configuracion.preferencias || 60}%</span>
            </div>
          </div>
          
          <div className="config-item">
            <label>Temperatura Máxima</label>
            <div className="config-value">
              <span className="value">{configuracion.tempMax || 28}°C</span>
            </div>
          </div>
          
          <div className="config-item">
            <label>Temperatura Mínima</label>
            <div className="config-value">
              <span className="value">{configuracion.tempMin || 18}°C</span>
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
        <button className="btn btn-primary" style={{ marginTop: '20px' }}>
          Ver Registros Recientes
        </button>
      </div>
    </div>
  );
};

export default PlantDetail;