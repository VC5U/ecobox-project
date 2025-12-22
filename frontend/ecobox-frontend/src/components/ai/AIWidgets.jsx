// src/components/ai/AIWidget.jsx - VERSIÓN MEJORADA
import React, { useState } from 'react';
import './AIWidget2.css';

const AIWidget = ({ 
  stats, 
  onChatClick, 
  onViewRecommendations,
  onTrainModels,
  onRefreshAI 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!stats) {
    return (
      <div className="ai-widget">
        <div className="ai-loading">
          <div className="spinner"></div>
          <p>Cargando datos de IA...</p>
        </div>
      </div>
    );
  }

  // Calcular eficiencia con colores
  const getEfficiencyColor = (accuracy) => {
    if (accuracy >= 0.9) return '#4CAF50';
    if (accuracy >= 0.7) return '#FF9800';
    return '#F44336';
  };

  const getEfficiencyLabel = (accuracy) => {
    if (accuracy >= 0.9) return 'Excelente';
    if (accuracy >= 0.7) return 'Buena';
    if (accuracy >= 0.5) return 'Regular';
    return 'Baja';
  };

  return (
    <div className="ai-widget">
      {/* Header con versión */}
      <div className="ai-header">
        <div className="ai-title">
          <span className="ai-icon">🤖</span>
          <div>
            <h4>Asistente IA EcoBox</h4>
            <span className="ai-version">v{stats.version || '1.0.0'}</span>
          </div>
        </div>
        <div className="ai-status">
          <span 
            className={`status-dot ${stats.status === 'active' ? 'active' : 'inactive'}`}
          ></span>
          <span className="status-text">
            {stats.status === 'active' ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="ai-metrics-grid">
        <div className="ai-metric">
          <div className="metric-value">
            {stats.predicciones_hoy || 0}
          </div>
          <div className="metric-label">Predicciones</div>
        </div>
        
        <div className="ai-metric">
          <div className="metric-value" style={{ color: '#FF9800' }}>
            {stats.alertas_activas || 0}
          </div>
          <div className="metric-label">Pendientes</div>
        </div>
        
        <div className="ai-metric">
          <div className="metric-value">
            {stats.modelos_activos || 0}
          </div>
          <div className="metric-label">Plantas</div>
        </div>
      </div>

      {/* Barra de eficiencia */}
      <div className="efficiency-bar">
        <div className="efficiency-label">
          <span>Eficiencia IA:</span>
          <span 
            className="efficiency-value"
            style={{ color: getEfficiencyColor(stats.eficiencia_global || 0) }}
          >
            {getEfficiencyLabel(stats.eficiencia_global || 0)} 
            ({stats.eficiencia_global ? `${(stats.eficiencia_global * 100).toFixed(1)}%` : '0%'})
          </span>
        </div>
        <div className="efficiency-progress">
          <div 
            className="efficiency-fill"
            style={{ 
              width: `${(stats.eficiencia_global || 0) * 100}%`,
              backgroundColor: getEfficiencyColor(stats.eficiencia_global || 0)
            }}
          ></div>
        </div>
      </div>

      {/* Botón expandir */}
      <button 
        className="expand-button"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '▲ Ver menos detalles' : '▼ Ver más detalles'}
      </button>

      {/* Contenido expandido */}
      {isExpanded && (
        <div className="ai-expanded-content">
          {/* Modelos entrenados */}
          {stats.detalles_modelos && stats.detalles_modelos.length > 0 ? (
            <div className="expanded-section">
              <h5>📊 Modelos Entrenados</h5>
              <div className="models-list">
                {stats.detalles_modelos.map((modelo, index) => (
                  <div key={index} className="model-item">
                    <div className="model-info">
                      <span className="model-name">Planta {modelo.planta_id}</span>
                      <span className="model-type">{modelo.tipo}</span>
                    </div>
                    <div 
                      className="model-accuracy"
                      style={{ color: getEfficiencyColor(modelo.accuracy) }}
                    >
                      {(modelo.accuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="expanded-section">
              <h5>📊 Modelos IA</h5>
              <div className="no-models">
                <p>No hay modelos entrenados aún</p>
                <button onClick={onTrainModels} className="train-button">
                  🚀 Entrenar primeros modelos
                </button>
              </div>
            </div>
          )}

          {/* Clima actual */}
          {stats.clima_actual && (
            <div className="expanded-section">
              <h5>🌤️ Clima Actual</h5>
              <div className="weather-card">
                <div className="weather-main">
                  <span className="weather-temp">
                    {stats.clima_actual.temperature}°C
                  </span>
                  <span className="weather-desc">
                    {stats.clima_actual.description}
                  </span>
                </div>
                <div className="weather-details">
                  <div className="weather-detail">
                    <span className="detail-label">Humedad:</span>
                    <span className="detail-value">{stats.clima_actual.humidity}%</span>
                  </div>
                  <div className="weather-detail">
                    <span className="detail-label">Ciudad:</span>
                    <span className="detail-value">{stats.clima_actual.city}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Acciones rápidas */}
          <div className="expanded-section">
            <h5>⚡ Acciones Rápidas</h5>
            <div className="quick-actions">
              <button onClick={onTrainModels} className="quick-action">
                <span className="action-icon">🚀</span>
                <span className="action-text">Entrenar IA</span>
              </button>
              <button onClick={onRefreshAI} className="quick-action">
                <span className="action-icon">🔄</span>
                <span className="action-text">Actualizar</span>
              </button>
              <button onClick={() => window.open('/api/ai/control/', '_blank')} className="quick-action">
                <span className="action-icon">📊</span>
                <span className="action-text">Panel Control</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Acciones principales */}
      <div className="ai-actions">
        <button 
          className="ai-action-button primary"
          onClick={onChatClick}
        >
          <span className="action-icon">💬</span>
          <span className="action-text">Preguntar</span>
        </button>
        <button 
          className="ai-action-button secondary"
          onClick={onViewRecommendations}
        >
          <span className="action-icon">📋</span>
          <span className="action-text">Ver Todo</span>
        </button>
      </div>

      {/* Footer */}
      <div className="ai-footer">
        <div className="footer-left">
          <span className="update-time">
            Última actualización: {new Date().toLocaleTimeString()}
          </span>
        </div>
        <div className="footer-right">
          {stats.clima_actual?.success === false && (
            <span className="demo-badge">
              🔧 Modo Demo
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIWidget;