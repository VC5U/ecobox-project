// src/components/plants/PlantCard.js - VERSIÓN MEJORADA
import React from 'react';
import './PlantCard.css';

const PlantCard = ({ planta, onSelect, sensores }) => {
  // MANTENGO tu función getStatusInfo original
  const getStatusInfo = (estado) => {
    const statusInfo = {
      saludable: { color: '#4CAF50', label: 'Saludable', class: 'Saludable' },
      necesita_agua: { color: '#FF9800', label: 'Necesita Agua', class: 'Necesita_Agua' },
      peligro: { color: '#F44336', label: 'En Peligro', class: 'Critica' },
      normal: { color: '#2196F3', label: 'Normal', class: 'Normal' }
    };
    return statusInfo[estado] || statusInfo.normal;
  };

  const statusInfo = getStatusInfo(planta.estado);
  
  // Datos para métricas (usando tus datos existentes o valores por defecto)
  const getValoresSensores = () => {
    // Si la planta ya viene con los sensores incluidos
    if (planta.sensores && Array.isArray(planta.sensores)) {
      return extraerValoresDeSensores(planta.sensores);
    }
    
    // Si recibimos sensores como prop separada
    if (sensores && Array.isArray(sensores)) {
      // Filtrar solo los sensores de esta planta
      const sensoresEstaPlanta = sensores.filter(s => 
        s.planta === planta.id || s.planta === planta.idPlanta || s.idPlanta === planta.id
      );
      return extraerValoresDeSensores(sensoresEstaPlanta);
    }
    
    // Si no hay sensores disponibles, usar valores por defecto
    return { humedad: 'N/A', temperatura: 'N/A' };
  };
  
  const extraerValoresDeSensores = (sensoresArray) => {
    let humedad = 'N/A';
    let temperatura = 'N/A';
    
    // Buscar sensor de humedad (tipo_sensor = 2)
    const sensorHumedad = sensoresArray.find(s => s.tipo_sensor === 2);
    if (sensorHumedad) {
      // Si tiene última medición directa
      if (sensorHumedad.ultimaMedicion) {
        humedad = `${sensorHumedad.ultimaMedicion.valor}%`;
      } 
      // Si tiene propiedad ultima_medicion (backend)
      else if (sensorHumedad.ultima_medicion) {
        humedad = `${sensorHumedad.ultima_medicion.valor}%`;
      }
      // Solo marcar que existe el sensor
      else {
        humedad = 'Sí';
      }
    }
    
    // Buscar sensor de temperatura (tipo_sensor = 1)
    const sensorTemperatura = sensoresArray.find(s => s.tipo_sensor === 1);
    if (sensorTemperatura) {
      // Si tiene última medición directa
      if (sensorTemperatura.ultimaMedicion) {
        temperatura = `${sensorTemperatura.ultimaMedicion.valor}°C`;
      } 
      // Si tiene propiedad ultima_medicion (backend)
      else if (sensorTemperatura.ultima_medicion) {
        temperatura = `${sensorTemperatura.ultima_medicion.valor}°C`;
      }
      // Solo marcar que existe el sensor
      else {
        temperatura = 'Sí';
      }
    }
    
    return { humedad, temperatura };
  };
  
  // Obtener valores de sensores
  const { humedad, temperatura } = getValoresSensores();

  // Mostrar número de sensores si los tenemos
  const numSensores = () => {
    if (planta.sensores && Array.isArray(planta.sensores)) {
      return planta.sensores.length;
    }
    if (sensores && Array.isArray(sensores)) {
      const sensoresEstaPlanta = sensores.filter(s => 
        s.planta === planta.id || s.planta === planta.idPlanta || s.idPlanta === planta.id
      );
      return sensoresEstaPlanta.length;
    }
    return 0;
  };
  
  // MANTENGO tu handleClick original
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🖱️ PlantCard clickeada, ID:", planta.idPlanta || planta.id);
    if (onSelect && typeof onSelect === 'function') {
      onSelect();
    }
  };

  const handleButtonClick = (e) => {
    e.stopPropagation(); // Evita que se dispare el click de la tarjeta
    handleClick(e);
  };

  return (
    <div className="plant-card" onClick={handleClick}>
      {/* 1. IMAGEN PRINCIPAL CON ESTADO SUPERPUESTO (si es crítico) */}
      <div className="plant-card-image-container">
        {planta.foto ? (
          <img 
            src={planta.foto} 
            alt={planta.nombrePersonalizado} 
            className="plant-card-image" 
          />
        ) : (
          <div className="plant-image-placeholder">
            <span className="placeholder-icon">🌿</span>
          </div>
        )}
        
        {/* Badge de estado superpuesto (solo para estados críticos) */}
        {(statusInfo.class === 'Necesita_Agua' || statusInfo.class === 'Critica') && (
          <span 
            className={`plant-status-overlay ${statusInfo.class}`}
            style={{ backgroundColor: statusInfo.color }}
          >
            {statusInfo.label}
          </span>
        )}
      </div>

      {/* 2. CONTENIDO PRINCIPAL */}
      <div className="plant-card-content">
        <div className="plant-card-header">
          <h3 className="plant-name">{planta.nombrePersonalizado}</h3>
          
          {/* Badge de estado normal (no crítico) */}
          {!(statusInfo.class === 'Necesita_Agua' || statusInfo.class === 'Critica') && (
            <span 
              className={`plant-status ${statusInfo.class}`}
              style={{ backgroundColor: statusInfo.color }}
            >
              {statusInfo.label}
            </span>
          )}
        </div>
        
        <p className="plant-description">
          {planta.descripcion || 'Sin descripción'}
        </p>
        
        {/* 3. MÉTRICAS EN LÍNEA (Humedad/Temperatura) */}
        <div className="plant-metrics">
          <div className="metric-item">
            <div className="metric-info">
              <span className="metric-label">💧Humedad</span>
              <span className="metric-value-hum">{humedad}</span>
            </div>
          </div>
          
          <div className="metric-item">
            <div className="metric-info">
              <span className="metric-label">🌡️Temp</span>
              <span className="metric-value-tem">{temperatura}</span>
            </div>
          </div>
          
        </div>
        
        {/* 4. META INFO (Aspecto y Fecha - MANTENIDOS DE TU CÓDIGO) 
        <div className="plant-meta">
          <span className="meta-item">
            <span className="meta-label">Aspecto:</span>
            <span className="meta-value">{planta.aspecto || 'Normal'}</span>
          </span>
          <span className="meta-item">
            <span className="meta-label">Creada:</span>
            <span className="meta-value">
              {new Date(planta.fecha_creacion).toLocaleDateString()}
            </span>
          </span>
        </div>*/}
      </div>
      
      {/* 5. BOTÓN (OPCIONAL - puedes comentarlo si no lo quieres) */}
      <div className="plant-card-footer">
        <button className="btn-view-details" onClick={handleButtonClick}>
          Ver detalles
        </button>
      </div>
    </div>
  );
};

export default PlantCard;