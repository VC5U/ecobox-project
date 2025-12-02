// src/components/familia/UnirseFamiliaModal.js - VERSIÓN MEJORADA
import React, { useState } from 'react';

const UnirseFamiliaModal = ({ show, onClose, onConfirm, loading }) => {
  const [codigoInvitacion, setCodigoInvitacion] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!codigoInvitacion.trim()) {
      setError('Por favor ingresa un código de invitación');
      return;
    }

    setError('');
    
    try {
      await onConfirm(codigoInvitacion.trim().toUpperCase());
      setCodigoInvitacion('');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleClose = () => {
    setCodigoInvitacion('');
    setError('');
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Unirse a una Familia</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Código de Invitación
            </label>
            <input
              type="text"
              value={codigoInvitacion}
              onChange={(e) => setCodigoInvitacion(e.target.value.toUpperCase())}
              placeholder="Ej: INV123ABC"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Pide el código de invitación al administrador de la familia
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !codigoInvitacion.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Uniéndose...' : 'Unirse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnirseFamiliaModal;