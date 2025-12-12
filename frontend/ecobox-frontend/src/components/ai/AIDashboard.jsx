import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import './AIDashboard.css';

const AIDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [aiStats, setAiStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setAiStats({
        total_predictions: 12,
        pending_predictions: 3,
        user_plants_count: 5,
        status: 'operational'
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="aiDashboard">
        <div className="loading">Cargando dashboard de IA...</div>
      </div>
    );
  }

  return (
    <div className="aiDashboard">
      <header className="dashboardHeader">
        <h1>🤖 Dashboard de Inteligencia Artificial</h1>
        <p>Bienvenido, {user?.nombre || 'Usuario'}. Centro de control de IA.</p>
      </header>

      <div className="statsGrid">
        <div className="statCard">
          <div className="statValue">{aiStats.total_predictions}</div>
          <div className="statLabel">Predicciones Totales</div>
        </div>
        <div className="statCard">
          <div className="statValue">{aiStats.pending_predictions}</div>
          <div className="statLabel">Pendientes</div>
        </div>
        <div className="statCard">
          <div className="statValue">{aiStats.user_plants_count}</div>
          <div className="statLabel">Plantas Analizadas</div>
        </div>
        <div className="statCard">
          <div className="statValue">100%</div>
          <div className="statLabel">Disponibilidad</div>
        </div>
      </div>

      <div className="quickActions">
        <h2>Acciones Rápidas</h2>
        <div className="actionsGrid">
          <button className="actionButton primary" onClick={() => navigate('/ai/chat')}>
            <span className="actionIcon">💬</span>
            <span className="actionText">Chatear con IA</span>
          </button>
          <button className="actionButton secondary" onClick={() => navigate('/ai/recommendations')}>
            <span className="actionIcon">📋</span>
            <span className="actionText">Ver Recomendaciones</span>
          </button>
          <button className="actionButton secondary" onClick={() => navigate('/plantas')}>
            <span className="actionIcon">🌿</span>
            <span className="actionText">Analizar Plantas</span>
          </button>
        </div>
      </div>

      <div className="infoSection">
        <h3>ℹ️ Acerca del Sistema de IA</h3>
        <p>
          El sistema de IA de EcoBox utiliza algoritmos avanzados para analizar datos de sensores,
          condiciones ambientales y patrones históricos. Genera recomendaciones personalizadas
          para el cuidado óptimo de tus plantas.
        </p>
      </div>
    </div>
  );
};

export default AIDashboard;