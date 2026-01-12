// src/pages/AlertsPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import './AlertsPage.css'; // CSS específico para esta página

const AlertsPage = () => {
  const [allAlerts, setAllAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    tipo: 'todos',
    prioridad: 'todos',
    estado: 'todos',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    criticas: 0,
    leidas: 0,
    pendientes: 0
  });

  // Cargar todas las alertas REALES desde el backend
  const fetchAllAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📊 Cargando historial completo de alertas...');
      
      // Intenta primero con la ruta del historial completo
      let response;
      try {
        response = await API.get('/alerts/history/', {
          params: {
            limit: 100,
            sort_by: 'created_desc'
          }
        });
      } catch (historyError) {
        // Si falla, intenta con la ruta normal de alertas
        console.log('⚠️ Usando endpoint alternativo...');
        response = await API.get('/alerts/', {
          params: {
            limit: 100,
            sort_by: 'created_desc',
            include_resueltas: true // Incluir todas, no solo pendientes
          }
        });
      }
      
      console.log('📦 Respuesta del servidor:', response.data);
      
      if (response.data && response.data.status === 'success') {
        // Manejar diferentes estructuras de respuesta
        let alertas = [];
        
        if (response.data.alertas) {
          alertas = response.data.alertas;
        } else if (response.data.data) {
          alertas = response.data.data;
        } else if (Array.isArray(response.data)) {
          alertas = response.data;
        }
        
        console.log(`✅ Cargadas ${alertas.length} alertas del historial`, alertas);
        
        // Asegurar que las alertas tengan los campos necesarios
        const processedAlerts = alertas.map(alert => ({
          ...alert,
          // Asegurar campos mínimos
          id: alert.id || alert._id || Math.random(),
          titulo: alert.titulo || alert.title || `Alerta en ${alert.plant_nombre || 'Planta'}`,
          mensaje: alert.mensaje || alert.message || 'Sin descripción',
          tipo: alert.tipo || alert.type || 'INFO',
          prioridad: alert.prioridad || alert.priority || alert.tipo || 'INFO',
          leida: alert.leida || alert.read || false,
          resuelta: alert.resuelta || alert.resolved || false,
          creada_en: alert.creada_en || alert.created_at || alert.fecha || new Date().toISOString(),
          plant_nombre: alert.plant_nombre || alert.plant_name || 'Planta no especificada',
          icono: alert.icono || alert.icon || getIconByType(alert.tipo || alert.type || 'INFO'),
          color: alert.color || getColorByType(alert.tipo || alert.type || 'INFO')
        }));
        
        setAllAlerts(processedAlerts);
        setFilteredAlerts(processedAlerts);
        
        // Calcular estadísticas
        calculateStats(processedAlerts);
      } else {
        // Si no hay datos o la estructura es diferente
        console.warn('⚠️ Estructura de respuesta diferente a la esperada');
        setAllAlerts([]);
        setFilteredAlerts([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('❌ Error cargando historial:', error);
      setError('No se pudo cargar el historial de alertas. Verifica tu conexión o intenta más tarde.');
      setAllAlerts([]);
      setFilteredAlerts([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Funciones auxiliares para iconos y colores
  const getIconByType = (tipo) => {
    switch(tipo.toUpperCase()) {
      case 'CRITICA': return '🚨';
      case 'ADVERTENCIA': return '⚠️';
      case 'INFO': return 'ℹ️';
      case 'SUGERENCIA': return '💡';
      default: return '📢';
    }
  };

  const getColorByType = (tipo) => {
    switch(tipo.toUpperCase()) {
      case 'CRITICA': return '#dc3545';
      case 'ADVERTENCIA': return '#ffc107';
      case 'INFO': return '#17a2b8';
      case 'SUGERENCIA': return '#28a745';
      default: return '#6c757d';
    }
  };

  const calculateStats = (alertas) => {
    const total = alertas.length;
    const criticas = alertas.filter(a => 
      (a.tipo && a.tipo.toUpperCase() === 'CRITICA') || 
      (a.prioridad && a.prioridad.toUpperCase() === 'CRITICA')
    ).length;
    const leidas = alertas.filter(a => a.leida).length;
    const pendientes = alertas.filter(a => !a.resuelta).length;
    
    setStats({ total, criticas, leidas, pendientes });
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...allAlerts];
    
    if (filters.tipo !== 'todos') {
      filtered = filtered.filter(a => 
        a.tipo && a.tipo.toUpperCase() === filters.tipo.toUpperCase()
      );
    }
    
    if (filters.prioridad !== 'todos') {
      filtered = filtered.filter(a => 
        a.prioridad && a.prioridad.toUpperCase() === filters.prioridad.toUpperCase()
      );
    }
    
    if (filters.estado !== 'todos') {
      if (filters.estado === 'leidas') {
        filtered = filtered.filter(a => a.leida);
      } else if (filters.estado === 'no-leidas') {
        filtered = filtered.filter(a => !a.leida);
      } else if (filters.estado === 'resueltas') {
        filtered = filtered.filter(a => a.resuelta);
      } else if (filters.estado === 'pendientes') {
        filtered = filtered.filter(a => !a.resuelta);
      }
    }
    
    if (filters.fechaDesde) {
      const desde = new Date(filters.fechaDesde);
      desde.setHours(0, 0, 0, 0);
      filtered = filtered.filter(a => {
        const fechaAlerta = new Date(a.creada_en);
        return fechaAlerta >= desde;
      });
    }
    
    if (filters.fechaHasta) {
      const hasta = new Date(filters.fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      filtered = filtered.filter(a => {
        const fechaAlerta = new Date(a.creada_en);
        return fechaAlerta <= hasta;
      });
    }
    
    setFilteredAlerts(filtered);
    calculateStats(filtered);
  }, [filters, allAlerts]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      tipo: 'todos',
      prioridad: 'todos',
      estado: 'todos',
      fechaDesde: '',
      fechaHasta: ''
    });
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Fecha', 'Planta', 'Tipo', 'Prioridad', 'Mensaje', 'Leída', 'Resuelta'];
    const csvContent = [
      headers.join(','),
      ...filteredAlerts.map(alert => [
        alert.id,
        new Date(alert.creada_en).toLocaleString('es-ES'),
        `"${alert.plant_nombre}"`,
        alert.tipo,
        alert.prioridad,
        `"${alert.mensaje.replace(/"/g, '""')}"`, // Escapar comillas
        alert.leida ? 'Sí' : 'No',
        alert.resuelta ? 'Sí' : 'No'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `alertas_ecobox_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const markAllAsRead = async () => {
    try {
      const response = await API.post('/alerts/mark-all-read/');
      if (response.data && response.data.status === 'success') {
        // Actualizar localmente
        const updatedAlerts = allAlerts.map(alert => ({ ...alert, leida: true }));
        setAllAlerts(updatedAlerts);
        setFilteredAlerts(updatedAlerts);
        calculateStats(updatedAlerts);
      }
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      // Actualizar localmente de todos modos
      const updatedAlerts = allAlerts.map(alert => ({ ...alert, leida: true }));
      setAllAlerts(updatedAlerts);
      setFilteredAlerts(updatedAlerts);
      calculateStats(updatedAlerts);
    }
  };

  const markAsRead = async (alertId) => {
    try {
      await API.post('/alerts/mark-read/', { alert_id: alertId });
      const updatedAlerts = allAlerts.map(alert => 
        alert.id === alertId ? { ...alert, leida: true } : alert
      );
      setAllAlerts(updatedAlerts);
      setFilteredAlerts(updatedAlerts.filter(a => 
        filters.estado !== 'no-leidas' || a.leida
      ));
      calculateStats(updatedAlerts);
    } catch (error) {
      console.error('Error marcando como leída:', error);
    }
  };

  const markAsResolved = async (alertId) => {
    try {
      await API.post('/alerts/mark-resolved/', { alert_id: alertId });
      const updatedAlerts = allAlerts.filter(alert => alert.id !== alertId);
      setAllAlerts(updatedAlerts);
      setFilteredAlerts(updatedAlerts);
      calculateStats(updatedAlerts);
    } catch (error) {
      console.error('Error resolviendo alerta:', error);
    }
  };

  useEffect(() => {
    fetchAllAlerts();
  }, []);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha no válida';
    }
  };

  const getTimeAgo = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours} h`;
      if (diffDays < 7) return `Hace ${diffDays} días`;
      return formatDate(dateString);
    } catch (error) {
      return 'Fecha desconocida';
    }
  };

  return (
    <div className="alerts-history-page">
      <header className="ah-header">
        <div className="ah-header-top">
          <Link to="/" className="ah-back-link">
            <span className="ah-back-arrow">←</span>
            Volver al Dashboard
          </Link>
          <div className="ah-header-actions">
            <button 
              onClick={fetchAllAlerts} 
              className="ah-btn-refresh"
              disabled={loading}
            >
              {loading ? '🔄 Cargando...' : '🔄 Actualizar'}
            </button>
            <button 
              onClick={exportToCSV} 
              className="ah-btn-export"
              disabled={filteredAlerts.length === 0}
            >
              📥 Exportar CSV
            </button>
          </div>
        </div>
        
        <div className="ah-header-main">
          <h1 className="ah-page-title">
            <span className="ah-title-icon">🔔</span>
            Historial Completo de Alertas
          </h1>
          
          <div className="ah-stats-summary">
            <div className="ah-stat-card ah-stat-total">
              <span className="ah-stat-number">{stats.total}</span>
              <span className="ah-stat-label">Total</span>
            </div>
            <div className="ah-stat-card ah-stat-critical">
              <span className="ah-stat-number">{stats.criticas}</span>
              <span className="ah-stat-label">Críticas</span>
            </div>
            <div className="ah-stat-card ah-stat-pending">
              <span className="ah-stat-number">{stats.pendientes}</span>
              <span className="ah-stat-label">Pendientes</span>
            </div>
            <div className="ah-stat-card ah-stat-read">
              <span className="ah-stat-number">{stats.leidas}</span>
              <span className="ah-stat-label">Leídas</span>
            </div>
          </div>
        </div>
      </header>

      <main className="ah-content">
        <div className="ah-filters-section">
          <div className="ah-filters-header">
            <h3>Filtros</h3>
            <button 
              onClick={clearFilters} 
              className="ah-btn-clear-filters"
              disabled={filters.tipo === 'todos' && filters.prioridad === 'todos' && filters.estado === 'todos' && !filters.fechaDesde && !filters.fechaHasta}
            >
              🗑️ Limpiar
            </button>
          </div>
          
          <div className="ah-filters-grid">
            <div className="ah-filter-group">
              <label>Tipo de Alerta</label>
              <select 
                value={filters.tipo}
                onChange={(e) => handleFilterChange('tipo', e.target.value)}
                className="ah-filter-select"
              >
                <option value="todos">Todos los tipos</option>
                <option value="CRITICA">🚨 Crítica</option>
                <option value="ADVERTENCIA">⚠️ Advertencia</option>
                <option value="INFO">ℹ️ Informativa</option>
                <option value="SUGERENCIA">💡 Sugerencia</option>
              </select>
            </div>
            
            <div className="ah-filter-group">
              <label>Prioridad</label>
              <select 
                value={filters.prioridad}
                onChange={(e) => handleFilterChange('prioridad', e.target.value)}
                className="ah-filter-select"
              >
                <option value="todos">Todas las prioridades</option>
                <option value="CRITICA">🚨 Urgente</option>
                <option value="ADVERTENCIA">⚠️ Alta</option>
                <option value="INFO">ℹ️ Media</option>
                <option value="SUGERENCIA">💡 Baja</option>
              </select>
            </div>
            
            <div className="ah-filter-group">
              <label>Estado</label>
              <select 
                value={filters.estado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                className="ah-filter-select"
              >
                <option value="todos">Todos los estados</option>
                <option value="pendientes">⏳ Pendientes</option>
                <option value="resueltas">✅ Resueltas</option>
                <option value="leidas">👁️ Leídas</option>
                <option value="no-leidas">👁️‍🗨️ No leídas</option>
              </select>
            </div>
            
            <div className="ah-filter-group">
              <label>Desde</label>
              <input 
                type="date"
                value={filters.fechaDesde}
                onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
                className="ah-filter-date"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="ah-filter-group">
              <label>Hasta</label>
              <input 
                type="date"
                value={filters.fechaHasta}
                onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
                className="ah-filter-date"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="ah-filter-group ah-filter-action">
              <button 
                onClick={markAllAsRead} 
                className="ah-btn-mark-all-read"
                disabled={allAlerts.filter(a => !a.leida).length === 0}
              >
                👁️ Marcar todas como leídas
              </button>
            </div>
          </div>
          
          <div className="ah-results-info">
            <span>
              Mostrando <strong>{filteredAlerts.length}</strong> de <strong>{allAlerts.length}</strong> alertas
            </span>
          </div>
        </div>

        {error && (
          <div className="ah-error-message">
            ⚠️ {error}
            <button onClick={fetchAllAlerts} className="ah-btn-retry">
              Reintentar
            </button>
          </div>
        )}

        {loading ? (
          <div className="ah-loading-container">
            <div className="ah-spinner-large"></div>
            <p>Cargando historial de alertas...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="ah-no-results">
            <div className="ah-no-results-icon">🔍</div>
            <h3>No se encontraron alertas</h3>
            <p>{allAlerts.length === 0 ? 'No hay alertas en el sistema' : 'Intenta con otros filtros'}</p>
            <button onClick={clearFilters} className="ah-btn-clear-filters">
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="ah-table-container">
            <div className="ah-table-wrapper">
              <table className="ah-alerts-table">
                <thead>
                  <tr>
                    <th className="ah-col-status">Estado</th>
                    <th className="ah-col-icon">Tipo</th>
                    <th className="ah-col-details">Detalles</th>
                    <th className="ah-col-plant">Planta</th>
                    <th className="ah-col-date">Fecha</th>
                    <th className="ah-col-actions">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map(alert => (
                    <tr 
                      key={alert.id} 
                      className={`ah-alert-row ${alert.leida ? 'ah-read' : 'ah-unread'} ${alert.resuelta ? 'ah-resolved' : 'ah-pending'}`}
                    >
                      <td className="ah-col-status">
                        <div className="ah-status-indicators">
                          {!alert.leida && <span className="ah-unread-dot" title="No leída"></span>}
                          {!alert.resuelta && <span className="ah-pending-dot" title="Pendiente"></span>}
                        </div>
                      </td>
                      <td className="ah-col-icon">
                        <div 
                          className="ah-alert-type-icon"
                          style={{ backgroundColor: alert.color + '20', color: alert.color }}
                          title={alert.tipo}
                        >
                          {alert.icono}
                        </div>
                      </td>
                      <td className="ah-col-details">
                        <div className="ah-alert-details">
                          <h4 className="ah-alert-title">{alert.titulo}</h4>
                          <p className="ah-alert-message">{alert.mensaje}</p>
                          <span className={`ah-alert-priority ah-priority-${alert.prioridad ? alert.prioridad.toLowerCase() : 'info'}`}>
                            {alert.prioridad || alert.tipo || 'INFO'}
                          </span>
                        </div>
                      </td>
                      <td className="ah-col-plant">
                        <div className="ah-plant-info">
                          <span className="ah-plant-icon">🌿</span>
                          <span className="ah-plant-name">{alert.plant_nombre}</span>
                        </div>
                      </td>
                      <td className="ah-col-date">
                        <div className="ah-date-info">
                          <div className="ah-date-full">{formatDate(alert.creada_en)}</div>
                          <div className="ah-date-ago">{getTimeAgo(alert.creada_en)}</div>
                        </div>
                      </td>
                      <td className="ah-col-actions">
                        <div className="ah-action-buttons">
                          {!alert.leida && (
                            <button 
                              onClick={() => markAsRead(alert.id)}
                              className="ah-btn-action ah-mark-read"
                              title="Marcar como leída"
                            >
                              👁️
                            </button>
                          )}
                          {!alert.resuelta && (
                            <button 
                              onClick={() => markAsResolved(alert.id)}
                              className="ah-btn-action ah-resolve"
                              title="Marcar como resuelta"
                            >
                              ✔️
                            </button>
                          )}
                          <button 
                            onClick={() => markAsResolved(alert.id)}
                            className="ah-btn-action ah-delete"
                            title="Resolver y eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="ah-table-footer">
              <div className="ah-pagination-info">
                Mostrando {filteredAlerts.length} alertas
              </div>
              <div className="ah-legend">
                <div className="ah-legend-item">
                  <span className="ah-unread-dot"></span> No leída
                </div>
                <div className="ah-legend-item">
                  <span className="ah-pending-dot"></span> Pendiente
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="ah-footer">
        <p className="ah-footer-info">
          💡 <strong>Consejo:</strong> Exporta regularmente tu historial para llevar un registro de la salud de tus plantas.
        </p>
        <div className="ah-footer-actions">
          <Link to="/" className="ah-link-widget">
            📊 Ver widget compacto
          </Link>
          <Link to="/plants" className="ah-link-plants">
            🌿 Ir a mis plantas
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default AlertsPage;