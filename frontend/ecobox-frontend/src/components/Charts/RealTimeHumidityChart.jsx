// src/components/charts/RealTimeHumidityChart.jsx - VERSIÓN MEJORADA
import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import './RealTimeHumidityChart.css';

const RealTimeHumidityChart = () => {
  const [humidityData, setHumidityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [stats, setStats] = useState(null);

  const fetchHumidityHistory = useCallback(async () => {
    try {
      console.log('🔄 Obteniendo datos históricos...');
      
      const response = await fetch('http://localhost:8000/api/humidity-history/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.status === 'success' && result.data && result.data.length > 0) {
          // Formatear datos
          const formattedData = result.data.slice(-12).map(item => ({
            hora: item.time,
            humedad: item.humidity,
            temperatura: item.temperature,
            planta: item.plant_name,
            hora_completa: `${item.time}h`
          }));
          
          setHumidityData(formattedData);
          setStats(result.statistics);
          setError(null);
        } else {
          // Si el endpoint devuelve error pero con datos de respaldo
          setStats(result.statistics);
          setError('Usando datos de respaldo del servidor');
        }
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.log('⚠️ Error de conexión:', error.message);
      
      // Generar datos de ejemplo locales
      const exampleData = [];
      const now = new Date();
      
      for (let i = 0; i < 12; i++) {
        const hour = new Date(now - (i * 2 * 3600000)).getHours();
        const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
        
        const baseHumidity = 65;
        const hourVariation = 15 * Math.abs(1 - (hour % 12) / 6);
        const humidity = baseHumidity + hourVariation + (Math.random() * 10 - 5);
        
        exampleData.unshift({
          hora: timeLabel,
          humedad: Math.max(30, Math.min(85, humidity)),
          temperatura: 22 - (hourVariation / 10) + (Math.random() * 4 - 2),
          planta: ['Suculenta', 'Orquídea', 'Lavanda'][i % 3],
          hora_completa: `${timeLabel}h`
        });
      }
      
      setHumidityData(exampleData);
      setStats({
        avg_humidity: 65.0,
        min_humidity: 45.2,
        max_humidity: 78.3,
        avg_temperature: 22.1,
        trend: 'stable'
      });
      setError('Modo offline: Datos de ejemplo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHumidityHistory();
    
    if (autoRefresh) {
      const interval = setInterval(fetchHumidityHistory, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchHumidityHistory]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-time"><strong>{label}</strong></p>
          <p className="tooltip-humidity">
            💧 Humedad: <strong>{payload[0]?.value || 0}%</strong>
          </p>
          <p className="tooltip-temperature">
            🌡️ Temperatura: <strong>{payload[1]?.value || 0}°C</strong>
          </p>
          <p className="tooltip-plant">
            🌿 Planta: <strong>{payload[0]?.payload?.planta || 'N/A'}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="chart-container loading">
        <div className="spinner"></div>
        <p>Cargando datos de humedad...</p>
      </div>
    );
  }

  return (
    <div className="realtime-chart-container">
      <div className="chart-header">
        <div>
          <h3>📈 Evolución de Humedad (Últimas 24 horas)</h3>
          {stats && (
            <div className="chart-subtitle">
              Promedio: <strong>{stats.avg_humidity}%</strong> | 
              Temp: <strong>{stats.avg_temperature}°C</strong>
            </div>
          )}
        </div>
        <div className="chart-controls">
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`refresh-toggle ${autoRefresh ? 'active' : ''}`}
          >
            {autoRefresh ? '🔄 Auto-actualizando' : '⏸️ Pausado'}
          </button>
          <button 
            onClick={fetchHumidityHistory}
            className="refresh-button"
            title="Actualizar ahora"
          >
            🔄
          </button>
        </div>
      </div>
      
      {error && (
        <div className={`chart-warning ${error.includes('offline') ? 'offline' : 'warning'}`}>
          ℹ️ {error}
        </div>
      )}
      
      {/* ... resto del JSX del gráfico ... */}
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart
            data={humidityData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="hora" 
              stroke="#666"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#666"
              tick={{ fontSize: 12 }}
              domain={[0, 100]}
              label={{ value: 'Humedad %', angle: -90, position: 'insideLeft', offset: -10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Área de humedad */}
            <Area
              type="monotone"
              dataKey="humedad"
              stroke="#4dabf7"
              strokeWidth={2}
              fill="url(#colorHumidity)"
              fillOpacity={0.4}
              name="Humedad (%)"
              activeDot={{ r: 6 }}
            />
            
            {/* Línea de temperatura (secundaria) */}
            <Line
              type="monotone"
              dataKey="temperatura"
              stroke="#ff6b6b"
              strokeWidth={2}
              dot={false}
              name="Temperatura (°C)"
              yAxisId="right"
            />
            
            {/* Gradiente para el área */}
            <defs>
              <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4dabf7" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#4dabf7" stopOpacity={0}/>
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="chart-footer">
        <div className="legend">
          <div className="legend-item">
            <div className="legend-color humidity"></div>
            <span>Humedad del suelo</span>
          </div>
          <div className="legend-item">
            <div className="legend-color temperature"></div>
            <span>Temperatura ambiente</span>
          </div>
        </div>
        
        {stats && (
          <div className="chart-stats">
            <div className="stat">
              <span className="stat-label">Mínima:</span>
              <span className="stat-value">{stats.min_humidity}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">Promedio:</span>
              <span className="stat-value">{stats.avg_humidity}%</span>
            </div>
            <div className="stat">
              <span className="stat-label">Máxima:</span>
              <span className="stat-value">{stats.max_humidity}%</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="chart-insights">
        <div className="insight">
          <span className="insight-icon">📊</span>
          <span className="insight-text">
            {humidityData.length > 0 && humidityData[humidityData.length - 1].humedad < 40 
              ? '⚠️ Humedad baja detectada' 
              : '✅ Niveles óptimos'}
          </span>
        </div>
        <div className="insight">
          <span className="insight-icon">⏰</span>
          <span className="insight-text">
            {autoRefresh ? 'Actualiza cada 30 segundos' : 'Actualización manual'}
          </span>
    </div>
   
      </div>
    </div>
  );
};

export default RealTimeHumidityChart;