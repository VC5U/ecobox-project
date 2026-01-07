// src/components/alerts/AlertsWidget.jsx
import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api'; // ¡IMPORTA AXIOS!
import './AlertsWidget.css';

const AlertsWidget = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      console.log('🔍 Iniciando fetchAlerts...');
      
      // ¡USAR AXIOS EN LUGAR DE FETCH!
      const response = await API.get('/alerts/', {
        params: {
          limit: 10,
          no_resueltas: true
        }
      });
      
      console.log('✅ Respuesta completa del servidor:', response);
      
      if (response.data && response.data.status === 'success') {
        const data = response.data;
        console.log('📦 Datos recibidos:', data);
        
        setAlerts(data.alertas || []);
        setStats({
          total: data.total || 0,
          unread: data.no_leidas || 0,
          critical: data.criticas_pendientes || 0
        });
      } else {
        console.warn('⚠️ Respuesta inesperada:', response.data);
        throw new Error('Formato de respuesta inesperado');
      }
    } catch (error) {
      console.log('⚠️ Error cargando alertas:', error);
      
      // Datos de ejemplo usando TU estructura
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
      // ¡USAR AXIOS!
      const response = await API.post('/alerts/mark-read/', {
        alert_id: alertId
      });
      
      if (response.data && response.data.status === 'success') {
        // Actualizar localmente
        setAlerts(alerts.map(alert => 
          alert.id === alertId ? { ...alert, leida: true } : alert
        ));
        
        // Actualizar estadísticas
        if (stats) {
          setStats({
            ...stats,
            unread: Math.max(0, stats.unread - 1)
          });
        }
      }
    } catch (error) {
      console.log('⚠️ Error marcando como leída:', error);
    }
  };

  const markAsResolved = async (alertId) => {
    try {
      // ¡USAR AXIOS!
      const response = await API.post('/alerts/mark-resolved/', {
        alert_id: alertId
      });
      
      if (response.data && response.data.status === 'success') {
        // Remover de la lista
        setAlerts(alerts.filter(alert => alert.id !== alertId));
        
        // Actualizar estadísticas
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
      console.log('⚠️ Error resolviendo alerta:', error);
    }
  };

  const createTestAlert = async () => {
    try {
      // ¡USAR AXIOS!
      const response = await API.post('/alerts/test/');
      
      if (response.data && response.data.status === 'success') {
        const data = response.data;
        // Agregar la nueva alerta al principio
        setAlerts([data.alerta, ...alerts]);
        
        // Actualizar estadísticas
        if (stats) {
          setStats({
            ...stats,
            total: stats.total + 1,
            unread: stats.unread + 1,
            critical: stats.critical + 1
          });
        }
        
        // Mostrar notificación del navegador
        showBrowserNotification(data.alerta.titulo, data.alerta.mensaje);
      }
    } catch (error) {
      console.log('⚠️ Error creando alerta de prueba:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('✅ Permiso para notificaciones concedido');
        showBrowserNotification('Sistema de alertas activado', 'Recibirás notificaciones importantes sobre tus plantas');
      }
    }
  };

  const showBrowserNotification = (title, message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'ecobox-alert'
      });
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Solicitar permiso para notificaciones
    requestNotificationPermission();
    
    // Configurar polling cada 60 segundos
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Mostrar notificación cuando hay alertas críticas nuevas
  useEffect(() => {
    if (stats && stats.critical > 0) {
      const criticalAlert = alerts.find(a => !a.leida && a.tipo === 'CRITICA');
      if (criticalAlert && !criticalAlert.notificada) {
        showBrowserNotification(`🚨 ${criticalAlert.plant_nombre}`, criticalAlert.mensaje);
        // Marcar como notificada (en un sistema real, esto se haría en el backend)
      }
    }
  }, [alerts, stats]);

  if (loading) {
    return (
      <div className="alerts-widget loading">
        <div className="spinner"></div>
        <p>Cargando alertas...</p>
      </div>
    );
  }

  const displayedAlerts = showAll ? alerts : alerts.slice(0, 3);

  return (
    <div className="alerts-widget">
      <div className="alerts-header">
        <div className="alerts-title">
          <h3>🔔 Alertas de Plantas</h3>
          {stats && stats.unread > 0 && (
            <span className="unread-badge">{stats.unread}</span>
          )}
        </div>
        <div className="alerts-stats">
          <span className={`stat critical ${stats?.critical > 0 ? 'active' : ''}`}>
            🚨 {stats?.critical || 0} crítica{stats?.critical !== 1 ? 's' : ''}
          </span>
          <button 
            onClick={createTestAlert}
            className="btn-test-alert"
            title="Crear alerta de prueba"
          >
            🧪 Probar
          </button>
        </div>
      </div>
      
      {alerts.length === 0 ? (
        <div className="no-alerts">
          <div className="no-alerts-icon">✅</div>
          <p>No hay alertas pendientes</p>
          <small>Todas tus plantas están saludables</small>
        </div>
      ) : (
        <>
          <div className="alerts-list">
            {displayedAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`alert-item ${alert.leida ? 'read' : 'unread'} priority-${alert.prioridad.toLowerCase()}`}
              >
                <div className="alert-icon" style={{ color: alert.color }}>
                  {alert.icono || '📢'}
                </div>
                <div className="alert-content">
                  <div className="alert-header">
                    <div>
                      <h4 className="alert-title">{alert.titulo}</h4>
                      <p className="alert-plant">🌿 {alert.plant_nombre}</p>
                    </div>
                    <div className="alert-meta">
                      <span className={`alert-priority ${alert.prioridad.toLowerCase()}`}>
                        {alert.tipo}
                      </span>
                      <span className="alert-time">
                        {new Date(alert.creada_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <p className="alert-message">{alert.mensaje}</p>
                  <div className="alert-actions">
                    {!alert.leida && (
                      <button 
                        onClick={() => markAsRead(alert.id)}
                        className="btn-mark-read"
                      >
                        ✅ Leída
                      </button>
                    )}
                    <button 
                      onClick={() => markAsResolved(alert.id)}
                      className="btn-resolve"
                    >
                      ✔️ Resolver
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {alerts.length > 3 && (
            <button 
              onClick={() => setShowAll(!showAll)}
              className="btn-show-all"
            >
              {showAll ? '↑ Mostrar menos' : `↓ Ver todas (${alerts.length})`}
            </button>
          )}
          
          <div className="alerts-footer">
            <button 
              onClick={fetchAlerts}
              className="btn-refresh"
            >
              🔄 Actualizar
            </button>
            <a href="/alerts" className="link-view-all">
              Historial completo →
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export default AlertsWidget;