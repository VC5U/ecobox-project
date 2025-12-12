// src/pages/Dashboard.js - VERSIÓN CON IA INTEGRADA
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

// ✅ IMPORTAR COMPONENTES DE IA
import AIWidget from '../components/ai/AIWidget'; // Componente compacto de IA

const Dashboard = () => {
  const { user, logout } = useAuth(); 
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false); // Estado para mostrar chatbot
  const [aiStats, setAiStats] = useState(null); // Estadísticas de IA

  useEffect(() => {
    fetchDashboardData();
    fetchAIStats();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Iniciando fetch del dashboard...');
      
      const response = await fetch('http://localhost:8000/api/dashboard/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      console.log('📊 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Datos recibidos:', data);
      setDashboardData(data);
      
    } catch (error) {
      console.error('❌ Error fetching dashboard:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

 // En Dashboard.js, actualiza la función fetchAIStats:
const fetchAIStats = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('⚠️ No hay token, saltando fetchAIStats');
      return;
    }
    
    console.log('🔄 Obteniendo estadísticas de IA...');
    
    const response = await fetch('http://localhost:8000/api/ai/', {
      headers: {
        'Authorization': `Token ${token}`
      }
    });
    
    if (!response.ok) {
      console.log(`⚠️ Error ${response.status} en estadísticas de IA`);
      // No hacer nada, solo loggear el error
      return;
    }
    
    const data = await response.json();
    console.log('✅ Estadísticas de IA:', data);
    // Actualizar estado si es necesario
    
  } catch (error) {
    console.log('⚠️ Error obteniendo estadísticas de IA:', error.message);
    // No crashar la app por este error
  }
};

  const handleAskAI = () => {
    setShowChatbot(true);
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loadingContainer">
          <div className="spinner"></div>
          <p>Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="errorContainer">
          <div className="errorIcon">⚠️</div>
          <h3>Error al cargar el dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retryButton">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header con diseño Figma */}
      <header className="dashboardHeader">
        <div className="headerLeft">
          <div className="logo">
            <span className="logoIcon">🌱</span>
            <h1>EcoBox</h1>
          </div>
          <div className="welcomeSection">
            <h2>Hola, {user?.nombre || user?.email || 'Usuario'}</h2>
            <p>Resumen del estado de tus plantas</p>
            {dashboardData?.modo === 'demo' && (
              <div className="demoBadge">
                🚀 Modo Demostración - Base de datos vacía
              </div>
            )}
            {dashboardData?.modo === 'datos_reales' && (
              <div className="realDataBadge">
                ✅ Mostrando datos reales
              </div>
            )}
          </div>
        </div>
        <div className="headerRight">
          {/* Botón de IA en el header */}
          <button onClick={handleAskAI} className="aiButton">
            🤖 Preguntar a la IA
          </button>
          <button onClick={logout} className="logoutButton">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Grid de Métricas Principales - AGREGAR MÉTRICA DE IA */}
      <div className="metricsGrid">
        <div className="metricCard primary">
          <div className="metricIcon">🌿</div>
          <div className="metricContent">
            <h3>Plantas Activas</h3>
            <span className="metricValue">
              {dashboardData?.metricas_avanzadas?.plantas_activas || dashboardData?.total_plantas || 0}
            </span>
            <p className="metricTrend">
              {dashboardData?.modo === 'demo' ? 'Datos de ejemplo' : '+2 esta semana'}
            </p>
          </div>
        </div>

        <div className="metricCard success">
          <div className="metricIcon">📡</div>
          <div className="metricContent">
            <h3>Sensores Conectados</h3>
            <span className="metricValue">
              {dashboardData?.metricas_avanzadas?.sensores_activos || dashboardData?.total_sensores || 0}
            </span>
            <p className="metricTrend">
              {dashboardData?.modo === 'demo' ? 'Datos de ejemplo' : 'Todos funcionando'}
            </p>
          </div>
        </div>

        <div className="metricCard warning">
          <div className="metricIcon">💧</div>
          <div className="metricContent">
            <h3>Plantas Necesitan Agua</h3>
            <span className="metricValue">
              {dashboardData?.plantas_necesitan_agua || 0}
            </span>
            <p className="metricTrend">
              {dashboardData?.modo === 'demo' ? 'Datos de ejemplo' : 'Requieren atención'}
            </p>
          </div>
        </div>

        {/* ✅ NUEVA MÉTRICA DE IA */}
        <div className="metricCard ai">
          <div className="metricIcon">🤖</div>
          <div className="metricContent">
            <h3>Predicciones IA</h3>
            <span className="metricValue">
              {aiStats?.statistics?.total_predictions || 0}
            </span>
            <p className="metricTrend">
              {aiStats?.statistics?.pending_predictions || 0} pendientes
            </p>
          </div>
        </div>
      </div>

      {/* Sección de Gráficos y Datos Adicionales */}
      <div className="chartsSection">
        <div className="chartCard">
          <div className="chartHeader">
            <h3>Estado de Humedad</h3>
            <span className="chartSubtitle">
              {dashboardData?.humedad_promedio || '65%'} promedio
            </span>
          </div>
          <div className="chartPlaceholder">
            <div className="chartVisual">
              <div className="humidityBar">
                <div 
                  className="humidityFill"
                  style={{ width: '65%' }}
                ></div>
              </div>
            </div>
            <div className="chartLegend">
              <span>Baja</span>
              <span>Óptima</span>
              <span>Alta</span>
            </div>
          </div>
        </div>

        {/* ✅ NUEVO WIDGET DE IA */}
        <div className="chartCard">
          <div className="chartHeader">
            <h3>Asistente IA</h3>
            <span className="chartSubtitle">Recomendaciones inteligentes</span>
          </div>
          <div className="aiWidgetContainer">
            {aiStats ? (
              <AIWidget 
                stats={aiStats}
                onChatClick={handleAskAI}
                onViewRecommendations={() => window.location.href = '/ai/recommendations'}
              />
            ) : (
              <div className="aiPlaceholder">
                <p>Cargando asistente de IA...</p>
                <button onClick={handleAskAI} className="aiButtonSmall">
                  Preguntar a la IA
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ NUEVA SECCIÓN: RECOMENDACIONES DE IA */}
      <div className="aiRecommendationsSection">
        <div className="sectionHeader">
          <h3>📋 Recomendaciones de IA</h3>
          <a href="/ai/recommendations" className="viewAllLink">
            Ver todas →
          </a>
        </div>
        
        <div className="recommendationsGrid">
          <div className="recommendationCard urgent">
            <div className="recHeader">
              <span className="recBadge">URGENTE</span>
              <span className="recTime">Hace 2h</span>
            </div>
            <p className="recText">Regar planta "Suculenta Mía" - Humedad al 20%</p>
            <button className="recAction">Marcar como hecho</button>
          </div>
          
          <div className="recommendationCard warning">
            <div className="recHeader">
              <span className="recBadge">ADVERTENCIA</span>
              <span className="recTime">Hoy</span>
            </div>
            <p className="recText">Temperatura muy baja para "Orquídea Blanca"</p>
            <button className="recAction">Ver detalles</button>
          </div>
          
          <div className="recommendationCard info">
            <div className="recHeader">
              <span className="recBadge">SUGERENCIA</span>
              <span className="recTime">Ayer</span>
            </div>
            <p className="recText">Fertilizar "Lavanda" la próxima semana</p>
            <button className="recAction">Programar</button>
          </div>
        </div>
      </div>

      {/* Alertas y Recomendaciones */}
      {(dashboardData?.plantas_necesitan_agua > 0 || dashboardData?.metricas_avanzadas?.recomendaciones_activas > 0) && (
        <div className="alertsSection">
          <div className="alertCard">
            <div className="alertHeader">
              <div className="alertIcon">🚨</div>
              <div>
                <h4>Acciones Recomendadas</h4>
                <p>Revisa las siguientes plantas que requieren atención</p>
              </div>
            </div>
            <div className="alertActions">
              <button className="primaryButton">Ver Detalles</button>
              <button className="secondaryButton">Ignorar</button>
            </div>
          </div>
        </div>
      )}

      {/* Botón de recarga para modo demo */}
      {dashboardData?.modo === 'demo' && (
        <div className="demoActions">
          <button onClick={fetchDashboardData} className="refreshButton">
            🔄 Actualizar Datos
          </button>
          <p className="demoHint">
            💡 Ejecuta el script de datos de prueba para ver datos reales
          </p>
        </div>
      )}

      {/* Footer con última actualización */}
      <footer className="dashboardFooter">
        <p>
          Última actualización: {dashboardData?.ultima_actualizacion || 'Cargando...'}
          {dashboardData?.modo === 'demo' && ' (Modo Demo)'}
        </p>
      </footer>

      {/* ✅ CHATBOT MODAL */}
      {showChatbot && (
        <div className="chatbotModalOverlay">
          <div className="chatbotModal">
            <div className="chatbotHeader">
              <h3>Asistente de IA</h3>
              <button 
                onClick={() => setShowChatbot(false)} 
                className="closeButton"
              >
                ×
              </button>
            </div>
            <div className="chatbotContent">
              {/* Aquí iría el componente ChatbotMini */}
              <p>Próximamente: Chatbot de IA integrado</p>
              <p>Puedes acceder al asistente completo en <a href="/ai/chat">/ai/chat</a></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;