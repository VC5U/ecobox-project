// frontend/src/components/WateringControl.jsx
import React, { useState, useEffect } from 'react';
import './WateringControl.css';

const WateringControl = ({ plantId, plantName }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [watering, setWatering] = useState(false);
  const [history, setHistory] = useState([]);
  const [mode, setMode] = useState('assisted'); // manual, assisted, auto

  // Cargar predicción inicial
  useEffect(() => {
    fetchPrediction();
    fetchHistory();
  }, [plantId]);

  const fetchPrediction = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/ai/watering/predict/${plantId}/`);
      const data = await response.json();
      if (data.success) {
        setPrediction(data.prediction);
      }
    } catch (error) {
      console.error('Error fetching prediction:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/ai/watering/history/${plantId}/`);
      const data = await response.json();
      if (data.success) {
        setHistory(data.waterings || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const activateWatering = async (duration = null) => {
    setLoading(true);
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
        alert(`✅ Riego activado por ${durationToUse} segundos`);
        setWatering(true);
        // Actualizar historia después de 10 segundos
        setTimeout(() => {
          fetchHistory();
          fetchPrediction();
          setWatering(false);
        }, 10000);
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error activating watering:', error);
      alert('Error activando riego');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds} seg`;
    return `${Math.round(seconds / 60)} min`;
  };

  return (
    <div className="watering-control">
      <div className="watering-header">
        <h3>🚰 Control de Riego - {plantName}</h3>
        <div className="mode-selector">
          <label>Modo:</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="manual">Manual</option>
            <option value="assisted">Asistido por IA</option>
            <option value="auto">Automático</option>
          </select>
        </div>
      </div>

      {/* PREDICCIÓN ACTUAL */}
      {prediction && (
        <div className={`prediction-card ${prediction.action === 'WATER' ? 'needs-water' : 'no-water'}`}>
          <div className="prediction-header">
            <h4>🎯 Recomendación de IA</h4>
            <span className="confidence">
              Confianza: {(prediction.confidence * 100).toFixed(0)}%
            </span>
          </div>
          
          <div className="prediction-details">
            <p><strong>Decisión:</strong> {prediction.action === 'WATER' ? '✅ REGAR' : '⏸️ ESPERAR'}</p>
            <p><strong>Razón:</strong> {prediction.reason}</p>
            <p><strong>Humedad actual:</strong> {prediction.current_humidity?.toFixed(1) || 'N/A'}%</p>
            {prediction.duration_seconds > 0 && (
              <p><strong>Duración sugerida:</strong> {formatDuration(prediction.duration_seconds)}</p>
            )}
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="action-buttons">
            {mode === 'assisted' && prediction.action === 'WATER' && (
              <button 
                className="btn-primary"
                onClick={() => activateWatering()}
                disabled={loading || watering}
              >
                {loading ? 'Activando...' : watering ? 'Regando...' : '✅ Aceptar y Regar'}
              </button>
            )}
            
            {mode === 'manual' && (
              <>
                <button 
                  className="btn-secondary"
                  onClick={() => activateWatering(120)} // 2 min
                  disabled={loading || watering}
                >
                  Regar 2 min
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => activateWatering(300)} // 5 min
                  disabled={loading || watering}
                >
                  Regar 5 min
                </button>
              </>
            )}
            
            <button 
              className="btn-refresh"
              onClick={fetchPrediction}
              disabled={loading}
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      )}

      {/* HISTORIAL */}
      <div className="history-section">
        <h4>📜 Historial de Riegos</h4>
        {history.length > 0 ? (
          <div className="history-list">
            {history.map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-date">
                  {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                <div className="history-details">
                  <span className={`status ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                  <span className="duration">{formatDuration(item.duration)}</span>
                  {item.initial_humidity && (
                    <span className="humidity">
                      Humedad: {item.initial_humidity.toFixed(0)}% → {item.final_humidity?.toFixed(0) || '?'}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-history">No hay historial de riegos</p>
        )}
      </div>

      {/* NOTA DE DESARROLLO */}
      <div className="dev-note">
        <small>
          💡 <strong>Nota de desarrollo:</strong> El sistema está en modo simulado.
          La integración con ESP32/Arduino está en desarrollo.
        </small>
      </div>
    </div>
  );
};

export default WateringControl;