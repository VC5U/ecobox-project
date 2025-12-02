// src/components/familia/FamiliaCard/FamiliaCard.js
import React from 'react';
import './FamiliaCard.css';

const FamiliaCard = ({ familia, onSelect, esAdmin, estaSeleccionada }) => {
  if (!familia || !familia.nombreFamilia) {
    return null;
  }

  const inicial = familia.nombreFamilia.charAt(0).toUpperCase();
  const cantidadMiembros = familia.cantidadMiembros || 0;
  const cantidadPlantas = familia.cantidadPlantas || 0;

  // Determinar el color del avatar basado en la cantidad de plantas
  const getAvatarColor = (plantCount) => {
    if (plantCount === 0) return 'linear-gradient(135deg, #9ca3af, #4b5563)';
    if (plantCount < 3) return 'linear-gradient(135deg, #f6ad55, #ed8936)';
    if (plantCount < 6) return 'linear-gradient(135deg, #68d391, #48bb78)';
    return 'linear-gradient(135deg, #667eea, #764ba2)';
  };

  return (
    <div 
      className={`familia-card ${estaSeleccionada ? 'familia-card--seleccionada' : ''}`}
      onClick={() => onSelect(familia)}
    >
      <div className="familia-card__header">
        <div 
          className="familia-card__avatar"
          style={{ background: getAvatarColor(cantidadPlantas) }}
        >
          {inicial}
        </div>
        <div className="familia-card__badges">
          {esAdmin && (
            <span className="familia-card__admin-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Admin
            </span>
          )}
          {estaSeleccionada && (
            <span className="familia-card__selected-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Activa
            </span>
          )}
        </div>
      </div>
      
      <h3 className="familia-card__title">
        {familia.nombreFamilia}
      </h3>
      
      <div className="familia-card__stats">
        <div className="familia-card__stat">
          <div className="familia-card__stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <span className="familia-card__stat-number">{cantidadMiembros}</span>
          <span className="familia-card__stat-label">miembros</span>
        </div>
        <div className="familia-card__stat">
          <div className="familia-card__stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.5 9.5C17.5 6.46 15.04 4 12 4S6.5 6.46 6.5 9.5c0 2.7 1.94 4.93 4.5 5.4V20h2v-5.1c2.56-.47 4.5-2.7 4.5-5.4z"/>
            </svg>
          </div>
          <span className="familia-card__stat-number">{cantidadPlantas}</span>
          <span className="familia-card__stat-label">plantas</span>
        </div>
      </div>

      <div className="familia-card__footer">
        <span className="familia-card__codigo">
          Código: {familia.codigoInvitacion}
        </span>
        <span className="familia-card__fecha">
          Creada: {new Date(familia.fechaCreacion).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      </div>
    </div>
  );
};

export default FamiliaCard;