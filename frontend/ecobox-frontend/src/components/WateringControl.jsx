// frontend/src/components/WateringControl.jsx
import React, { useState, useEffect } from 'react';
import './WateringControl.css';

const WateringControl = ({ plantId, plantName }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [watering, setWatering] = useState(false);
  const [history, setHistory] = useState([]);
  const [mode, setMode] = useState('assisted');
  const [error, setError] = useState(null);

  // Cargar predicción inicial
  useEffect(() => {
    if (plantId) {
      fetchPrediction();
      fetchHistory();
    }
  }, [plantId]);

  const fetchPrediction = async () => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:8000/api/ai/watering/predict/${plantId}/`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setPrediction(data.prediction);
      } else {
        setError(data.message || 'Error obteniendo predicción');
      }
    } catch (error) {
      console.error('Error fetching prediction:', error);
      setError('No se pudo conectar con el servidor de IA');
      
      // Datos de ejemplo para desarrollo
      setPrediction({
        action: Math.random() > 0.5 ? 'WATER' : 'WAIT',
        confidence: 0.85,
        reason: 'Humedad baja detectada por sensores',
        current_humidity: 35.5,
        duration_seconds: 180,
        timestamp: new Date().toISOString()
      });
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/ai/watering/history/${plantId}/`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setHistory(data.waterings || []);
      } else {
        setError(data.message || 'Error obteniendo historial');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      
      // Datos de ejemplo para desarrollo
      const exampleHistory = [
        {
          id: 1,
          date: new Date(Date.now() - 86400000).toISOString(),
          status: 'COMPLETADO',
          duration: 180,
          initial_humidity: 35,
          final_humidity: 65,
          mode: 'assisted',
          confidence: 0.92
        },
        {
          id: 2,
          date: new Date(Date.now() - 172800000).toISOString(),
          status: 'COMPLETADO',
          duration: 120,
          initial_humidity: 40,
          final_humidity: 70,
          mode: 'manual',
          confidence: null
        },
        {
          id: 3,
          date: new Date(Date.now() - 259200000).toISOString(),
          status: 'EJECUTANDO',
          duration: 150,
          initial_humidity: 30,
          final_humidity: null,
          mode: 'auto',
          confidence: 0.88
        }
      ];
      setHistory(exampleHistory);
    }
  };

  const activateWatering = async (duration = null) => {
    setLoading(true);
    setError(null);
    
    try {
      const durationToUse = duration || (prediction?.duration_seconds || 180);
      
      const response = await fetch(`http://localhost:8000/api/ai/watering/activate/${plantId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          duration_seconds: durationToUse,
          mode: mode,
          prediction_data: prediction
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Simular el riego (en desarrollo)
        setWatering(true);
        
        // Actualizar historia después de 5 segundos
        setTimeout(() => {
          fetchHistory();
          fetchPrediction();
          setWatering(false);
        }, 5000);
      } else {
        setError(data.message || 'Error activando riego');
      }
    } catch (error) {
      console.error('Error activating watering:', error);
      setError('Error de conexión al activar riego');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds} seg`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? 
      `${minutes} min ${remainingSeconds} seg` : 
      `${minutes} min`;
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  return (
    <div className="wc-watering-control">
      {/* Header */}
      <div className="wc-control-header">
        <h3 className="wc-control-title">
          <span className="wc-title-icon">🚰</span>
          Control de Riego
        </h3>
        
        <div className="wc-plant-info">
          <span className="wc-plant-name">🌿 {plantName || 'Selecciona una planta'}</span>
        </div>
      </div>

      {/* Modo de Control */}
      <div className="wc-mode-section">
        <div className="wc-mode-header">
          <h4 className="wc-mode-title">
            <span className="wc-mode-icon">⚙️</span>
            Modo de Control
          </h4>
        </div>
        
        <div className="wc-mode-selector">
          <div className="wc-mode-options">
            <button 
              className={`wc-mode-btn ${mode === 'manual' ? 'wc-mode-active' : ''}`}
              onClick={() => setMode('manual')}
            >
              <span className="wc-mode-btn-icon">👨‍🔧</span>
              Manual
            </button>
            
            <button 
              className={`wc-mode-btn ${mode === 'assisted' ? 'wc-mode-active' : ''}`}
              onClick={() => setMode('assisted')}
            >
              <span className="wc-mode-btn-icon">🤖</span>
              Asistido por IA
            </button>
            
            <button 
              className={`wc-mode-btn ${mode === 'auto' ? 'wc-mode-active' : ''}`}
              onClick={() => setMode('auto')}
            >
              <span className="wc-mode-btn-icon">🔄</span>
              Automático
            </button>
          </div>
          
          <div className="wc-mode-description">
            {mode === 'manual' && (
              <p className="wc-mode-desc">
                <strong>Manual:</strong> Tú decides cuándo y cuánto regar. Total control sobre el proceso.
              </p>
            )}
            {mode === 'assisted' && (
              <p className="wc-mode-desc">
                <strong>Asistido por IA:</strong> La IA recomienda, tú decides. Perfecto para aprendizaje.
              </p>
            )}
            {mode === 'auto' && (
              <p className="wc-mode-desc">
                <strong>Automático:</strong> El sistema decide por ti. Ideal cuando no puedes supervisar.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recomendación de IA */}
      {prediction && mode === 'assisted' && (
        <div className="wc-prediction-section">
          <div className="wc-section-header">
            <h4 className="wc-section-title">
              <span className="wc-section-icon">🎯</span>
              Recomendación de IA
            </h4>
            <span className="wc-confidence-badge">
              Confianza: {(prediction.confidence * 100).toFixed(0)}%
            </span>
          </div>
          
          <div className={`wc-prediction-card ${prediction.action === 'WATER' ? 'wc-needs-water' : 'wc-no-water'}`}>
            <div className="wc-prediction-content">
              <div className="wc-prediction-decision">
                <span className="wc-decision-icon">
                  {prediction.action === 'WATER' ? '💧' : '⏸️'}
                </span>
                <div className="wc-decision-text">
                  <h5 className="wc-decision-title">
                    {prediction.action === 'WATER' ? 'REGAR AHORA' : 'ESPERAR'}
                  </h5>
                  <p className="wc-decision-reason">{prediction.reason}</p>
                </div>
              </div>
              
              <div className="wc-prediction-details">
                <div className="wc-detail-item">
                  <span className="wc-detail-label">Humedad actual:</span>
                  <span className="wc-detail-value">
                    {prediction.current_humidity?.toFixed(1) || 'N/A'}%
                  </span>
                </div>
                
                {prediction.duration_seconds > 0 && prediction.action === 'WATER' && (
                  <div className="wc-detail-item">
                    <span className="wc-detail-label">Duración sugerida:</span>
                    <span className="wc-detail-value wc-duration">
                      {formatDuration(prediction.duration_seconds)}
                    </span>
                  </div>
                )}
                
                <div className="wc-detail-item">
                  <span className="wc-detail-label">Actualizado:</span>
                  <span className="wc-detail-value wc-timestamp">
                    {getTimeAgo(prediction.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="wc-prediction-actions">
            {prediction.action === 'WATER' ? (
              <button 
                className="wc-btn-primary"
                onClick={() => activateWatering()}
                disabled={loading || watering}
              >
                <span className="wc-btn-icon">✅</span>
                {loading ? 'Activando...' : watering ? 'Regando...' : 'Aceptar recomendación y regar'}
              </button>
            ) : (
              <div className="wc-wait-message">
                <span className="wc-wait-icon">🕒</span>
                <p>La IA recomienda esperar. Revisa de nuevo más tarde.</p>
              </div>
            )}
            
            <button 
              className="wc-btn-secondary"
              onClick={fetchPrediction}
              disabled={loading}
            >
              <span className="wc-btn-icon">🔄</span>
              Actualizar recomendación
            </button>
          </div>
        </div>
      )}

      {/* Control Manual */}
      {mode === 'manual' && (
        <div className="wc-manual-section">
          <div className="wc-section-header">
            <h4 className="wc-section-title">
              <span className="wc-section-icon">👨‍🔧</span>
              Control Manual
            </h4>
          </div>
          
          <div className="wc-manual-controls">
            <p className="wc-manual-desc">
              Selecciona la duración del riego manual:
            </p>
            
            <div className="wc-duration-buttons">
              <button 
                className="wc-duration-btn"
                onClick={() => activateWatering(60)}
                disabled={loading || watering}
              >
                <span className="wc-duration-icon">💧</span>
                1 min
              </button>
              
              <button 
                className="wc-duration-btn"
                onClick={() => activateWatering(120)}
                disabled={loading || watering}
              >
                <span className="wc-duration-icon">💧💧</span>
                2 min
              </button>
              
              <button 
                className="wc-duration-btn"
                onClick={() => activateWatering(180)}
                disabled={loading || watering}
              >
                <span className="wc-duration-icon">💧💧💧</span>
                3 min
              </button>
              
              <button 
                className="wc-duration-btn"
                onClick={() => activateWatering(300)}
                disabled={loading || watering}
              >
                <span className="wc-duration-icon">💧💧💧💧💧</span>
                5 min
              </button>
            </div>
            
            <div className="wc-custom-duration">
              <label className="wc-custom-label">Duración personalizada (segundos):</label>
              <div className="wc-custom-input-group">
                <input 
                  type="number" 
                  min="10" 
                  max="600" 
                  defaultValue="180" 
                  className="wc-custom-input" 
                  id="customDuration"
                />
                <button 
                  className="wc-custom-btn"
                  onClick={() => {
                    const input = document.getElementById('customDuration');
                    const duration = parseInt(input.value);
                    if (duration >= 10 && duration <= 600) {
                      activateWatering(duration);
                    }
                  }}
                  disabled={loading || watering}
                >
                  <span className="wc-btn-icon">🚀</span>
                  Regar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modo Automático */}
      {mode === 'auto' && (
        <div className="wc-auto-section">
          <div className="wc-section-header">
            <h4 className="wc-section-title">
              <span className="wc-section-icon">🤖</span>
              Modo Automático
            </h4>
            <span className="wc-status-badge wc-status-active">ACTIVO</span>
          </div>
          
          <div className="wc-auto-info">
            <div className="wc-auto-icon">🔄</div>
            <div className="wc-auto-content">
              <h5 className="wc-auto-title">Riego Automático Activado</h5>
              <p className="wc-auto-desc">
                El sistema regará automáticamente según las necesidades detectadas por sensores.
                No se requieren acciones manuales.
              </p>
              
              <div className="wc-auto-stats">
                <div className="wc-stat-item">
                  <span className="wc-stat-label">Último riego:</span>
                  <span className="wc-stat-value">Hace 2 horas</span>
                </div>
                <div className="wc-stat-item">
                  <span className="wc-stat-label">Próximo riego:</span>
                  <span className="wc-stat-value">En ~4 horas</span>
                </div>
                <div className="wc-stat-item">
                  <span className="wc-stat-label">Estado planta:</span>
                  <span className="wc-stat-value wc-status-good">✅ Óptima</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="wc-auto-warning">
            <span className="wc-warning-icon">⚠️</span>
            <p>
              <strong>Nota:</strong> El modo automático requiere sensores de humedad funcionales.
              Verifica regularmente el estado de tus plantas.
            </p>
          </div>
        </div>
      )}

      {/* Estado de Riego Actual */}
      {watering && (
        <div className="wc-watering-active">
          <div className="wc-watering-header">
            <div className="wc-watering-icon">💧</div>
            <div className="wc-watering-info">
              <h5 className="wc-watering-title">Riego en progreso</h5>
              <p className="wc-watering-desc">
                Regando <strong>{plantName}</strong> por <strong>{formatDuration(prediction?.duration_seconds || 180)}</strong>
              </p>
            </div>
          </div>
          
          <div className="wc-watering-progress">
            <div className="wc-progress-bar">
              <div className="wc-progress-fill"></div>
            </div>
            <div className="wc-progress-text">Finalizando en 3 segundos...</div>
          </div>
        </div>
      )}

      {/* Historial de Riegos */}
      <div className="wc-history-section">
        <div className="wc-section-header">
          <h4 className="wc-section-title">
            <span className="wc-section-icon">📜</span>
            Historial de Riegos
          </h4>
          <button 
            className="wc-btn-secondary wc-btn-small"
            onClick={fetchHistory}
            disabled={loading}
          >
            <span className="wc-btn-icon">🔄</span>
            Actualizar
          </button>
        </div>
        
        {history.length > 0 ? (
          <div className="wc-history-list">
            {history.map((item) => (
              <div key={item.id} className="wc-history-item">
                <div className="wc-history-main">
                  <div className="wc-history-date">
                    {new Date(item.date).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="wc-history-meta">
                    <span className={`wc-history-status wc-status-${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                    <span className="wc-history-duration">{formatDuration(item.duration)}</span>
                    <span className="wc-history-mode">{item.mode}</span>
                    {item.confidence && (
                      <span className="wc-history-confidence">
                        {Math.round(item.confidence * 100)}% conf
                      </span>
                    )}
                  </div>
                </div>
                
                {item.initial_humidity && (
                  <div className="wc-history-humidity">
                    <span className="wc-humidity-label">Humedad:</span>
                    <span className="wc-humidity-value">{item.initial_humidity.toFixed(0)}%</span>
                    <span className="wc-humidity-arrow">→</span>
                    <span className="wc-humidity-value">
                      {item.final_humidity ? `${item.final_humidity.toFixed(0)}%` : 'Regando...'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="wc-no-history">
            <span className="wc-empty-icon">📭</span>
            <p>No hay historial de riegos para esta planta</p>
          </div>
        )}
      </div>

      {/* Mensajes de Error */}
      {error && (
        <div className="wc-error-message">
          <span className="wc-error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {/* Nota de Desarrollo */}
      <div className="wc-dev-note">
        <div className="wc-dev-header">
          <span className="wc-dev-icon">💡</span>
          <h5>Nota de desarrollo</h5>
        </div>
        <p className="wc-dev-text">
          <strong>Sistema en desarrollo:</strong> La integración con ESP32/Arduino está en progreso.
          Actualmente en modo simulado para pruebas y demostración.
        </p>
      </div>
    </div>
  );
};

export default WateringControl;