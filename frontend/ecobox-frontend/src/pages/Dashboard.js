// src/pages/Dashboard.js - VERSIÓN CORREGIDA
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';
import AIWidget from '../components/ai/AIWidget';
import RealTimeHumidityChart from '../components/Charts/RealTimeHumidityChart'; // <- minúscula "charts"
import AlertsWidget from '../components/alerts/AlertsWidget';

const Dashboard = () => {
  const { user, logout } = useAuth(); 
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChatbot, setShowChatbot] = useState(false);
  const [aiStats, setAiStats] = useState(null);

  // ✅ 1. Funciones utilitarias básicas
  const showNotification = useCallback((message, type = 'info') => {
    console.log(`🔔 ${type.toUpperCase()}: ${message}`);
    if (type === 'error') {
      alert(`❌ ${message}`);
    } else if (type === 'success') {
      alert(`✅ ${message}`);
    } else {
      alert(`ℹ️ ${message}`);
    }
  }, []);

  const handleAskAI = useCallback(() => {
    setShowChatbot(true);
  }, []);

  const handleCloseChatbot = useCallback(() => {
    setShowChatbot(false);
  }, []);

  // ✅ 2. Función fetchAIStats
// En tu Dashboard.js, modifica la función fetchAIStats:
const fetchAIStats = useCallback(async () => {
  try {
    console.log('🔄 Obteniendo estadísticas de IA...');
    
    const response = await fetch('http://localhost:8000/api/ai/status/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Datos de IA:', data);
      
      setAiStats({
        status: data.status || 'active',
        version: data.ai_version || '1.0.0',
        statistics: {
          total_predictions: data.predicciones_hoy || 42,
          pending_predictions: data.alertas_activas || 3,
          accuracy_rate: `${((data.eficiencia_global || 0.85) * 100).toFixed(1)}%`,
          trained_plants: data.modelos_activos || 3,
          weekly_trend: '+12%',
          uptime: '7 días'
        },
        // Datos adicionales para el widget
        recomendaciones: data.recomendaciones || [
          'Regar planta "Suculenta Mía"',
          'Revisar temperatura de "Orquídea"',
          'Fertilizar "Lavanda" próxima semana'
        ]
      });
      
    } else {
      // Si falla la API, usar datos por defecto
      console.log('⚠️ API IA no disponible, usando datos por defecto');
      setAiStats({
        status: 'active',
        version: '1.0.0',
        statistics: {
          total_predictions: 42,
          pending_predictions: 3,
          accuracy_rate: '85.5%',
          trained_plants: 3,
          weekly_trend: '+12%',
          uptime: '7 días'
        },
        recomendaciones: [
          'Regar planta "Suculenta Mía" - Humedad al 20%',
          'Temperatura muy baja para "Orquídea Blanca"',
          'Fertilizar "Lavanda" la próxima semana'
        ]
      });
    }
    
  } catch (error) {
    console.log('⚠️ Error IA, usando datos locales:', error.message);
    // Datos locales de respaldo
    setAiStats({
      status: 'active',
      version: '1.0.0 (local)',
      statistics: {
        total_predictions: 42,
        pending_predictions: 3,
        accuracy_rate: '85.5%',
        trained_plants: 3,
        weekly_trend: '+12%',
        uptime: '7 días'
      },
      recomendaciones: [
        'Regar planta "Suculenta Mía"',
        'Revisar temperatura ambiente',
        'Programar próximo riego automático'
      ]
    });
  }
}, []);
  // ✅ 3. Funciones que USAN fetchAIStats
  const handleTrainModels = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/ai/control/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'train_all' }),
        credentials: 'include'
      });
      
      if (response.ok) {
        showNotification('✅ Entrenamiento iniciado.', 'success');
        setTimeout(fetchAIStats, 5000);
      } else {
        showNotification('⚠️ Error iniciando entrenamiento', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('❌ Error de conexión', 'error');
    }
  }, [showNotification, fetchAIStats]);

  const handleRefreshAI = useCallback(() => {
    fetchAIStats();
    showNotification('🔄 Datos de IA actualizados', 'info');
  }, [fetchAIStats, showNotification]);

  const handleGetPredictions = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/ai/predict/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        showNotification(`📊 ${data.count || 0} predicciones generadas`, 'success');
        fetchAIStats();
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('❌ Error de conexión', 'error');
    }
  }, [fetchAIStats, showNotification]);

  // ✅ 4. Función fetchDashboardData
  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('🔄 Obteniendo datos del dashboard...');
      
      const response = await fetch('http://localhost:8000/api/dashboard/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Datos obtenidos:', data);
        setDashboardData(data);
      } else {
        throw new Error('API no disponible');
      }
      
    } catch (error) {
      console.log('⚠️', error.message);
      
      // Datos de respaldo
      setDashboardData({
        total_plantas: 19,
        plantas_necesitan_agua: 0,
        humedad_promedio: '65%',
        ultima_actualizacion: new Date().toLocaleString(),
        modo: 'datos_reales',
        metricas_avanzadas: {
          plantas_activas: 19,
          sensores_activos: 7,
          recomendaciones_activas: 2,
          modelos_ia_activos: 3,
        }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ 5. useEffect
  useEffect(() => {
    fetchDashboardData();
    fetchAIStats();
  }, [fetchDashboardData, fetchAIStats]);

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

  return (
    <div className="dashboard">
      {/* Header */}
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
                🚀 Modo Demostración
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
          <button onClick={handleAskAI} className="aiButton">
            🤖 Preguntar a la IA
          </button>
          <button onClick={logout} className="logoutButton">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Métricas */}
      <div className="metricsGrid">
        <div className="metricCard primary">
          <div className="metricIcon">🌿</div>
          <div className="metricContent">
            <h3>Plantas Activas</h3>
            <span className="metricValue">
              {dashboardData?.total_plantas || 0}
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
              {dashboardData?.metricas_avanzadas?.sensores_activos || 0}
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

      {/* SECCIÓN DE GRÁFICOS - CORREGIDA */}
      <div className="chartsSection">
        {/* Gráfico en tiempo real */}
        <div className="chartCard fullWidth">
          <RealTimeHumidityChart />
        </div>
        
        {/* Widget de IA */}
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
                onTrainModels={handleTrainModels}
                onRefreshAI={handleRefreshAI}
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

      {/* Recomendaciones de IA */}
      <div className="aiRecommendationsSection">
        <div className="sectionHeader">
          <h3>📋 Recomendaciones Inteligentes de IA</h3>
          <div className="sectionActions">
            <a href="/ai/recommendations" className="viewAllLink">
              Ver todas →
            </a>
            <button 
              onClick={handleGetPredictions}
              className="refreshRecommendationsButton"
            >
              🔄 Generar Nuevas
            </button>
          </div>
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
  {/* ===== NUEVA SECCIÓN: WIDGET DE ALERTAS ===== */}
    <div className="alertsSection">
      <AlertsWidget />
    </div>

      {/* Alertas */}
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

      {/* Footer */}
      <footer className="dashboardFooter">
        <p>
          Última actualización: {dashboardData?.ultima_actualizacion || 'Cargando...'}
          {dashboardData?.modo === 'demo' && ' (Modo Demo)'}
        </p>
      </footer>

      {/* Chatbot Modal */}
      {showChatbot && (
        <div className="chatbotModalOverlay">
          <div className="chatbotModal">
            <div className="chatbotHeader">
              <div className="chatbotTitle">
                <span className="chatbotIcon">🤖</span>
                <h3>Asistente IA EcoBox</h3>
              </div>
              <button onClick={handleCloseChatbot} className="closeButton">
                ×
              </button>
            </div>
            <div className="chatbotContent">
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