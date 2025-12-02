// src/components/familia/MiembroCard/MiembroCard.js
import React, { useState } from 'react';
import './MiembroCard.css';

const MiembroCard = ({ miembro, esAdmin, onRoleChange, onRemove, currentUserId }) => {
  const [cambiandoRol, setCambiandoRol] = useState(false);

  // Validar datos del miembro
  if (!miembro || !miembro.nombre) {
    console.warn('MiembroCard: Datos de miembro inválidos', miembro);
    return (
      <div className="miembro-card miembro-card--error">
        <div className="miembro-card__content">
          <div className="miembro-card__avatar">?</div>
          <div className="miembro-card__info">
            <h4 className="miembro-card__name">Miembro no disponible</h4>
          </div>
        </div>
      </div>
    );
  }

  const handleRoleChange = async (nuevoRol) => {
    setCambiandoRol(true);
    try {
      await onRoleChange(miembro.idUsuario, nuevoRol);
    } finally {
      setCambiandoRol(false);
    }
  };

  const esUsuarioActual = miembro.idUsuario === currentUserId;
  const puedeEliminar = esAdmin && !esUsuarioActual;

  const getRoleClass = (idRol) => {
    switch (idRol) {
      case 1: return 'miembro-card__role--admin';
      case 2: return 'miembro-card__role--member';
      default: return 'miembro-card__role--readonly';
    }
  };

  const getRoleText = (idRol) => {
    switch (idRol) {
      case 1: return 'Administrador';
      case 2: return 'Miembro';
      default: return 'Solo lectura';
    }
  };

  const inicial = miembro.nombre.charAt(0).toUpperCase();
  const rolId = miembro.idRol || 2;

  return (
    <div className="miembro-card">
      <div className="miembro-card__content">
        <div className="miembro-card__avatar">
          {inicial}
        </div>
        
        <div className="miembro-card__info">
          <div className="miembro-card__name-container">
            <h4 className="miembro-card__name">
              {miembro.nombre}
              {esUsuarioActual && (
                <span className="miembro-card__you-label">(Tú)</span>
              )}
            </h4>
          </div>
          <p className="miembro-card__email">{miembro.email || 'Sin email'}</p>
          <div className="miembro-card__details">
            <span className={`miembro-card__role ${getRoleClass(rolId)}`}>
              {getRoleText(rolId)}
            </span>
            {miembro.ultimaConexion && (
              <span className="miembro-card__last-seen">
                Última vez: {new Date(miembro.ultimaConexion).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {esAdmin && (
          <div className="miembro-card__actions">
            <select
              value={rolId}
              onChange={(e) => handleRoleChange(parseInt(e.target.value))}
              disabled={cambiandoRol || esUsuarioActual}
              className="miembro-card__role-select"
            >
              <option value={1}>Administrador</option>
              <option value={2}>Miembro</option>
              <option value={3}>Solo lectura</option>
            </select>
            
            {puedeEliminar && (
              <button
                onClick={() => onRemove(miembro.idUsuario)}
                className="miembro-card__remove-btn"
                title="Eliminar miembro"
              >
                <svg className="miembro-card__remove-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MiembroCard;