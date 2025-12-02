// ModalInvitacion/ModalInvitacion.js
import React, { useEffect, useState } from 'react';
import './ModalInvitacion.css';

const ModalInvitacion = ({ isOpen, onClose, familia, onGenerateCode }) => {
  const [copiado, setCopiado] = useState(false);
  const [codigoInvitacion, setCodigoInvitacion] = useState('');
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    if (isOpen && familia) {
      // Si ya tenemos un código, usarlo, sino generar uno nuevo
      if (familia.codigoInvitacion) {
        setCodigoInvitacion(familia.codigoInvitacion);
      } else {
        generarNuevoCodigo();
      }
    }
  }, [isOpen, familia]);

  const generarNuevoCodigo = async () => {
    if (!familia) return;
    
    setGenerando(true);
    try {
      const resultado = await onGenerateCode(familia.idFamilia);
      if (resultado && resultado.codigo_invitacion) {
        setCodigoInvitacion(resultado.codigo_invitacion);
      } else if (resultado && resultado.codigoInvitacion) {
        setCodigoInvitacion(resultado.codigoInvitacion);
      }
    } catch (error) {
      console.error('Error generando código:', error);
      alert('Error al generar el código de invitación');
    } finally {
      setGenerando(false);
    }
  };

  if (!isOpen) return null;

  const linkInvitacion = codigoInvitacion 
    ? `${window.location.origin}/unirse?codigo=${codigoInvitacion}`
    : 'Generando código...';

  const copiarLink = () => {
    if (!codigoInvitacion) return;
    
    navigator.clipboard.writeText(linkInvitacion);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const copiarCodigo = () => {
    if (!codigoInvitacion) return;
    
    navigator.clipboard.writeText(codigoInvitacion);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">
            Invitar a {familia?.nombreFamilia}
          </h3>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            <svg className="modal-close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Código de invitación */}
          <div className="invitation-section">
            <p className="invitation-label">Código de invitación:</p>
            <div className="invitation-input-group">
              <input
                type="text"
                value={generando ? "Generando código..." : codigoInvitacion || "Cargando..."}
                readOnly
                className="invitation-input"
              />
              <button
                onClick={copiarCodigo}
                disabled={!codigoInvitacion || generando}
                className={`invitation-copy-btn ${copiado ? 'invitation-copy-btn--copied' : ''}`}
              >
                <svg className="invitation-copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copiado ? '¡Copiado!' : 'Copiar Código'}
              </button>
            </div>
          </div>

          {/* Link de invitación */}
          <div className="invitation-section">
            <p className="invitation-label">Enlace de invitación:</p>
            <div className="invitation-input-group">
              <input
                type="text"
                value={linkInvitacion}
                readOnly
                className="invitation-input"
              />
              <button
                onClick={copiarLink}
                disabled={!codigoInvitacion || generando}
                className={`invitation-copy-btn ${copiado ? 'invitation-copy-btn--copied' : ''}`}
              >
                <svg className="invitation-copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copiado ? '¡Copiado!' : 'Copiar Enlace'}
              </button>
            </div>
          </div>

          {/* Botón para generar nuevo código */}
          <div className="invitation-actions">
            <button
              onClick={generarNuevoCodigo}
              disabled={generando}
              className="invitation-generate-btn"
            >
              {generando ? (
                <>
                  <svg className="invitation-loading-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Generando...
                </>
              ) : (
                <>
                  <svg className="invitation-refresh-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Generar Nuevo Código
                </>
              )}
            </button>
          </div>

          {/* Información adicional */}
          <div className="invitation-note">
            <p className="invitation-note__text">
              <strong>Instrucciones:</strong>
            </p>
            <ul className="invitation-note__list">
              <li>Comparte el código o enlace con las personas que quieras invitar</li>
              <li>Los nuevos miembros se unirán como "Miembros" normales</li>
              <li>Puedes generar un nuevo código en cualquier momento</li>
              <li>El código no expira hasta que generes uno nuevo</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button
            onClick={onClose}
            className="modal-cancel-btn"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalInvitacion;