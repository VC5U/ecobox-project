// src/components/plants/PlantHistory.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { plantasService } from '../../services/plantasService';
import './PlantHistory.css';

const PlantHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [historial, setHistorial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('timeline'); // timeline, charts, events, export
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d, 1y, all
  const [selectedSensor, setSelectedSensor] = useState('all');

  useEffect(() => {
    cargarHistorial();
  }, [id, dateRange]);

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const data = await plantasService.getHistorialPlanta(id);
      setHistorial(data);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/plantas/${id}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventIcon = (tipo) => {
    const icons = {
      riego: '💧',
      fertilizacion: '🌱',
      poda: '✂️',
      trasplante: '🔄',
      alerta: '⚠️',
      medicion: '📊',
      configuracion: '⚙️'
    };
    return icons[tipo] || '📝';
  };

  const getEventColor = (tipo) => {
    const colors = {
      riego: '#2196F3',
      fertilizacion: '#4CAF50',
      poda: '#FF9800',
      trasplante: '#9C27B0',
      alerta: '#F44336',
      medicion: '#00BCD4',
      configuracion: '#607D8B'
    };
    return colors[tipo] || '#757575';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando historial...</p>
      </div>
    );
  }

  return (
    <div className="plant-history">
      {/* Header */}
      <div className="history-header">
        <button onClick={handleBack} className="back-button">
          ← Volver a Planta
        </button>
        <h1>Historial Completo</h1>
        <div className="history-actions">
          <button className="btn btn-secondary">
            📄 Exportar
          </button>
          <button className="btn btn-primary" onClick={() => navigate(`/plantas/${id}/historial/graficos`)}>
            📈 Ver Gráficos
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="history-filters">
        <div className="filter-group">
          <label>Período:</label>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="filter-select"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
            <option value="all">Todo el historial</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Tipo:</label>
          <select 
            value={selectedSensor} 
            onChange={(e) => setSelectedSensor(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos los eventos</option>
            <option value="humedad">Humedad</option>
            <option value="temperatura">Temperatura</option>
            <option value="luz">Luz</option>
            <option value="riego">Riegos</option>
            <option value="alerta">Alertas</option>
          </select>
        </div>

        <div className="view-toggles">
          <button 
            className={`view-toggle ${activeView === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveView('timeline')}
          >
            📅 Línea de tiempo
          </button>
          <button 
            className={`view-toggle ${activeView === 'charts' ? 'active' : ''}`}
            onClick={() => setActiveView('charts')}
          >
            📊 Gráficos
          </button>
          <button 
            className={`view-toggle ${activeView === 'events' ? 'active' : ''}`}
            onClick={() => setActiveView('events')}
          >
            📋 Eventos
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="history-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{historial?.resumen?.totalRegistros || 0}</div>
            <div className="stat-label">Registros totales</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💧</div>
          <div className="stat-content">
            <div className="stat-value">{historial?.estadisticas?.riegosRealizados || 0}</div>
            <div className="stat-label">Riegos realizados</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{historial?.estadisticas?.alertasGeneradas || 0}</div>
            <div className="stat-label">Alertas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">
              {historial?.resumen?.primerRegistro ? 
                new Date(historial.resumen.primerRegistro).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }) : 
                '--'
              }
            </div>
            <div className="stat-label">Desde</div>
          </div>
        </div>
      </div>

      {/* Contenido principal según vista activa */}
      <div className="history-content">
        {activeView === 'timeline' && (
          <TimelineView 
            eventos={historial?.eventos || []} 
            mediciones={historial?.ultimasMediciones || []}
            formatDate={formatDate}
            getEventIcon={getEventIcon}
            getEventColor={getEventColor}
          />
        )}

        {activeView === 'charts' && (
          <ChartsView 
            mediciones={historial?.ultimasMediciones || []}
            estadisticas={historial?.estadisticas || {}}
          />
        )}

        {activeView === 'events' && (
          <EventsView 
            eventos={historial?.eventos || []}
            formatDate={formatDate}
          />
        )}
      </div>
    </div>
  );
};

// Componente para vista de línea de tiempo
const TimelineView = ({ eventos, mediciones, formatDate, getEventIcon, getEventColor }) => {
  // Combinar y ordenar eventos y mediciones
  const timelineItems = [...eventos, ...mediciones.map(m => ({
    ...m,
    tipo: 'medicion'
  }))].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <div className="timeline-view">
      <h3>Línea de Tiempo</h3>
      <div className="timeline-container">
        {timelineItems.slice(0, 50).map((item, index) => (
          <div key={item.id || index} className="timeline-item">
            <div 
              className="timeline-marker"
              style={{ backgroundColor: getEventColor(item.tipo) }}
            >
              {getEventIcon(item.tipo)}
            </div>
            
            <div className="timeline-content">
              <div className="timeline-header">
                <span className="timeline-title">
                  {item.tipo === 'medicion' ? 
                    `Medición de ${item.tipo_sensor}: ${item.valor}${item.unidad}` :
                    item.descripcion}
                </span>
                <span className="timeline-date">
                  {formatDate(item.fecha)}
                </span>
              </div>
              
              <div className="timeline-body">
                {item.tipo === 'medicion' ? (
                  <div className="measurement-info">
                    <span className="sensor-type">Sensor: {item.tipo_sensor}</span>
                    <span className="measurement-value">
                      Valor: <strong>{item.valor}{item.unidad}</strong>
                    </span>
                  </div>
                ) : (
                  <p className="event-details">{item.detalles}</p>
                )}
                
                {item.usuario && (
                  <div className="user-info">
                    <span className="user-icon">👤</span>
                    <span>{item.usuario}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente para vista de gráficos
const ChartsView = ({ mediciones, estadisticas }) => {
  // Agrupar mediciones por tipo de sensor
  const medicionesPorTipo = mediciones.reduce((acc, medicion) => {
    const tipo = medicion.tipo_sensor;
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(medicion);
    return acc;
  }, {});

  return (
    <div className="charts-view">
      <h3>Análisis de Datos</h3>
      
      <div className="charts-grid">
        {/* Gráfico de humedad */}
        <div className="chart-card">
          <div className="chart-header">
            <h4>📈 Humedad - Últimas 24 horas</h4>
          </div>
          <div className="chart-container">
            <div className="chart-placeholder interactive">
              <div className="chart-info">
                <div className="chart-stat">
                  <span className="stat-value">{estadisticas.humedadPromedio || 0}%</span>
                  <span className="stat-label">Promedio</span>
                </div>
                <div className="chart-stat">
                  <span className="stat-value">65%</span>
                  <span className="stat-label">Máximo</span>
                </div>
                <div className="chart-stat">
                  <span className="stat-value">45%</span>
                  <span className="stat-label">Mínimo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de temperatura */}
        <div className="chart-card">
          <div className="chart-header">
            <h4>🌡️ Temperatura - Últimas 24 horas</h4>
          </div>
          <div className="chart-container">
            <div className="chart-placeholder interactive">
              <div className="chart-info">
                <div className="chart-stat">
                  <span className="stat-value">{estadisticas.temperaturaPromedio || 0}°C</span>
                  <span className="stat-label">Promedio</span>
                </div>
                <div className="chart-stat">
                  <span className="stat-value">28°C</span>
                  <span className="stat-label">Máximo</span>
                </div>
                <div className="chart-stat">
                  <span className="stat-value">18°C</span>
                  <span className="stat-label">Mínimo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de eventos */}
        <div className="chart-card">
          <div className="chart-header">
            <h4>📊 Distribución de Eventos</h4>
          </div>
          <div className="chart-container">
            <div className="event-distribution">
              <div className="event-category">
                <div className="category-bar" style={{ width: '40%', backgroundColor: '#2196F3' }}></div>
                <span className="category-label">Riegos</span>
              </div>
              <div className="event-category">
                <div className="category-bar" style={{ width: '25%', backgroundColor: '#4CAF50' }}></div>
                <span className="category-label">Fertilización</span>
              </div>
              <div className="event-category">
                <div className="category-bar" style={{ width: '15%', backgroundColor: '#FF9800' }}></div>
                <span className="category-label">Poda</span>
              </div>
              <div className="event-category">
                <div className="category-bar" style={{ width: '10%', backgroundColor: '#F44336' }}></div>
                <span className="category-label">Alertas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para vista de eventos
const EventsView = ({ eventos, formatDate }) => {
  return (
    <div className="events-view">
      <h3>Registro de Eventos</h3>
      
      <div className="events-table">
        <table>
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Usuario</th>
              <th>Detalles</th>
            </tr>
          </thead>
          <tbody>
            {eventos.slice(0, 20).map((evento, index) => (
              <tr key={evento.id || index}>
                <td className="event-date">{formatDate(evento.fecha)}</td>
                <td>
                  <span className={`event-type-badge type-${evento.tipo}`}>
                    {evento.tipo}
                  </span>
                </td>
                <td className="event-description">{evento.descripcion}</td>
                <td className="event-user">{evento.usuario || 'Sistema'}</td>
                <td className="event-details">{evento.detalles}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlantHistory;