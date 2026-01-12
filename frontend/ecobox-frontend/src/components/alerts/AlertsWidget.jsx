// src/components/alerts/AlertsWidget.jsx
import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';
import './AlertsWidget.css';
import { Link } from 'react-router-dom';

const AlertsWidget = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Obteniendo alertas...');
      
      const response = await API.get('/alerts/', {
        params: {
          limit: 10,
          no_resueltas: true
        }
      });
      
      if (response.data && response.data.status === 'success') {
        const data = response.data;
        
        setAlerts(data.alertas || []);
        setStats({
          total: data.total || 0,
          unread: data.no_leidas || 0,
          critical: data.criticas_pendientes || 0
        });
      } else {
        throw new Error('Formato de respuesta inesperado');
      }
    } catch (error) {
      console.error('⚠️ Error cargando alertas:', error);
      
      // Datos de ejemplo para desarrollo
      const exampleAlerts = [
        {
          id: 1,
          titulo: 'Alerta en Suculenta Mía',
          mensaje: 'Humedad muy baja (20%). Necesita riego inmediato.',
          tipo: 'CRITICA',
          prioridad: 'URGENTE',
          leida: false,
          resuelta: false,
          creada_en: new Date(Date.now() - 2 * 3600000).toISOString(),
          plant_nombre: 'Suculenta Mía',
          icono: '🚨',
          color: '#dc3545'
        },
        {
          id: 2,
          titulo: 'Alerta en Orquídea Blanca',
          mensaje: 'Temperatura baja (15°C). Considerar mover a lugar más cálido.',
          tipo: 'ADVERTENCIA',
          prioridad: 'ADVERTENCIA',
          leida: false,
          resuelta: false,
          creada_en: new Date(Date.now() - 5 * 3600000).toISOString(),
          plant_nombre: 'Orquídea Blanca',
          icono: '⚠️',
          color: '#ffc107'
        },
        {
          id: 3,
          titulo: 'Alerta en Lavanda',
          mensaje: 'Sensor de humedad requiere calibración.',
          tipo: 'INFO',
          prioridad: 'INFO',
          leida: true,
          resuelta: false,
          creada_en: new Date(Date.now() - 24 * 3600000).toISOString(),
          plant_nombre: 'Lavanda',
          icono: 'ℹ️',
          color: '#17a2b8'
        }
      ];
      
      setAlerts(exampleAlerts);
      setStats({
        total: 3,
        unread: 2,
        critical: 1
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = async (alertId) => {
    try {
      const response = await API.post('/alerts/mark-read/', {
        alert_id: alertId
      });
      
      if (response.data && response.data.status === 'success') {
        setAlerts(alerts.map(alert => 
          alert.id === alertId ? { ...alert, leida: true } : alert
        ));
        
        if (stats) {
          setStats({
            ...stats,
            unread: Math.max(0, stats.unread - 1)
          });
        }
      }
    } catch (error) {
      console.error('⚠️ Error marcando como leída:', error);
    }
  };

  const markAsResolved = async (alertId) => {
    try {
      const response = await API.post('/alerts/mark-resolved/', {
        alert_id: alertId
      });
      
      if (response.data && response.data.status === 'success') {
        setAlerts(alerts.filter(alert => alert.id !== alertId));
        
        if (stats) {
          setStats({
            ...stats,
            total: Math.max(0, stats.total - 1),
            unread: Math.max(0, stats.unread - 1),
            critical: Math.max(0, stats.critical - 1)
          });
        }
      }
    } catch (error) {
      console.error('⚠️ Error resolviendo alerta:', error);
    }
  };

  const createTestAlert = async () => {
    try {
      const response = await API.post('/alerts/test/');
      
      if (response.data && response.data.status === 'success') {
        const data = response.data;
        setAlerts([data.alerta, ...alerts]);
        
        if (stats) {
          setStats({
            ...stats,
            total: stats.total + 1,
            unread: stats.unread + 1,
            critical: stats.critical + 1
          });
        }
        
        showBrowserNotification(data.alerta.titulo, data.alerta.mensaje);
      }
    } catch (error) {
      console.error('⚠️ Error creando alerta de prueba:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        showBrowserNotification(
          '🔔 Sistema de alertas activado',
          'Recibirás notificaciones importantes sobre tus plantas'
        );
      }
    }
  };

  const showBrowserNotification = (title, message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'ecobox-alert',
        requireInteraction: true
      });
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  useEffect(() => {
    if (stats && stats.critical > 0) {
      const criticalAlert = alerts.find(a => !a.leida && a.tipo === 'CRITICA');
      if (criticalAlert) {
        showBrowserNotification(
          `🚨 ${criticalAlert.plant_nombre}`,
          criticalAlert.mensaje
        );
      }
    }
  }, [alerts, stats]);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <div className="aw-alerts-widget aw-loading">
        <div className="aw-spinner"></div>
        <p>Cargando alertas...</p>
      </div>
    );
  }

  const displayedAlerts = showAll ? alerts : alerts.slice(0, 3);

  return (
    <div className="aw-alerts-widget">
      {/* Header */}
      <div className="aw-header">
        <div className="aw-header-left">
          <h3 className="aw-title">
            <span className="aw-title-icon">🔔</span>
            Alertas de Plantas
          </h3>
          {stats && stats.unread > 0 && (
            <span className="aw-unread-badge">
              {stats.unread}
            </span>
          )}
        </div>
        
        <div className="aw-header-right">
          <div className="aw-stats">
            <span className={`aw-stat aw-stat-critical ${stats?.critical > 0 ? 'aw-active' : ''}`}>
              🚨 {stats?.critical || 0}
            </span>
            <span className="aw-stat aw-stat-total">
              📋 {stats?.total || 0}
            </span>
          </div>
          
          <button 
            onClick={createTestAlert}
            className="aw-btn-test"
            title="Crear alerta de prueba"
          >
            🧪 Probar
          </button>
        </div>
      </div>

      {/* Alertas */}
      {alerts.length === 0 ? (
        <div className="aw-no-alerts">
          <div className="aw-empty-icon">✅</div>
          <h4 className="aw-empty-title">Sin alertas</h4>
          <p className="aw-empty-message">Todas tus plantas están saludables</p>
        </div>
      ) : (
        <>
          <div className="aw-alerts-list">
            {displayedAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`aw-alert-item ${alert.leida ? 'aw-read' : 'aw-unread'} aw-priority-${alert.prioridad.toLowerCase()}`}
              >
                <div 
                  className="aw-alert-icon"
                  style={{ 
                    backgroundColor: `${alert.color}15`,
                    borderColor: alert.color,
                    color: alert.color 
                  }}
                >
                  {alert.icono || '📢'}
                </div>
                
                <div className="aw-alert-content">
                  <div className="aw-alert-header">
                    <div className="aw-alert-info">
                      <h4 className="aw-alert-title">{alert.titulo}</h4>
                      <div className="aw-alert-meta">
                        <span className="aw-alert-plant">
                          <span className="aw-plant-icon">🌿</span>
                          {alert.plant_nombre}
                        </span>
                        <span className="aw-alert-time">
                          {formatTimeAgo(alert.creada_en)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="aw-alert-status">
                      <span className={`aw-priority-badge aw-priority-${alert.prioridad.toLowerCase()}`}>
                        {alert.tipo}
                      </span>
                      {!alert.leida && (
                        <span className="aw-unread-dot"></span>
                      )}
                    </div>
                  </div>
                  
                  <p className="aw-alert-message">{alert.mensaje}</p>
                  
                  <div className="aw-alert-actions">
                    {!alert.leida && (
                      <button 
                        onClick={() => markAsRead(alert.id)}
                        className="aw-btn-mark-read"
                      >
                        <span className="aw-btn-icon">👁️</span>
                        Marcar como leída
                      </button>
                    )}
                    <button 
                      onClick={() => markAsResolved(alert.id)}
                      className="aw-btn-resolve"
                    >
                      <span className="aw-btn-icon">✅</span>
                      Resolver
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mostrar más/menos */}
          {alerts.length > 3 && (
            <button 
              onClick={() => setShowAll(!showAll)}
              className="aw-btn-toggle"
            >
              {showAll ? (
                <>
                  <span className="aw-toggle-icon">↑</span>
                  Mostrar menos
                </>
              ) : (
                <>
                  <span className="aw-toggle-icon">↓</span>
                  Ver todas ({alerts.length})
                </>
              )}
            </button>
          )}

          {/* Footer */}
          <div className="aw-footer">
            <div className="aw-footer-left">
              {notificationPermission === 'default' && (
                <button 
                  onClick={requestNotificationPermission}
                  className="aw-btn-notifications"
                >
                  🔔 Activar notificaciones
                </button>
              )}
            </div>
            
            <div className="aw-footer-right">
              <button 
                onClick={fetchAlerts}
                className="aw-btn-refresh"
              >
                <span className="aw-refresh-icon">🔄</span>
                Actualizar
              </button>
              <Link to="/alerts" className="aw-link-view-all">
                Historial completo →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AlertsWidget;