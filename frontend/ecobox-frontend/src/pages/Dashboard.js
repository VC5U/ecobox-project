// src/pages/Dashboard.js - VERSIÓN CORREGIDA CON CSS NORMAL
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth(); 
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
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
          <button onClick={logout} className="logoutButton">
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Grid de Métricas Principales */}
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

        <div className="metricCard info">
          <div className="metricIcon">🌡️</div>
          <div className="metricContent">
            <h3>Temperatura Promedio</h3>
            <span className="metricValue">
              {dashboardData?.temperatura_promedio || '24°C'}
            </span>
            <p className="metricTrend">
              {dashboardData?.modo === 'demo' ? 'Datos de ejemplo' : 'Óptima'}
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

        <div className="chartCard">
          <div className="chartHeader">
            <h3>Plantas por Estado</h3>
            <span className="chartSubtitle">Resumen general</span>
          </div>
          <div className="statsGrid">
            <div className="statItem">
              <span className="statNumber">
                {dashboardData?.plantas_saludables || 0}
              </span>
              <span className="statLabel">Saludables</span>
            </div>
            <div className="statItem">
              <span className="statNumber">
                {dashboardData?.plantas_criticas || 0}
              </span>
              <span className="statLabel">Críticas</span>
            </div>
            <div className="statItem">
              <span className="statNumber">
                {dashboardData?.metricas_avanzadas?.alertas_24h || 0}
              </span>
              <span className="statLabel">Alertas Hoy</span>
            </div>
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
    </div>
  );
};

export default Dashboard;