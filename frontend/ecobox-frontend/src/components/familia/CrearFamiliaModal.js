// src/components/familia/CrearFamiliaModal.js
import React, { useState } from 'react';
import './Familia.css'; // Importar el CSS principal


const CrearFamiliaModal = ({ show, onClose, onConfirm, loading }) => {
  const [nombreFamilia, setNombreFamilia] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nombreFamilia.trim()) {
      setError('Por favor ingresa un nombre para la familia');
      return;
    }

    if (nombreFamilia.trim().length < 3) {
      setError('El nombre de la familia debe tener al menos 3 caracteres');
      return;
    }

    setError('');
    
    try {
      // Llamar a la función onConfirm con los datos
      await onConfirm({
        nombreFamilia: nombreFamilia.trim()
      });
      
      // Limpiar el formulario después de éxito
      setNombreFamilia('');
      
    } catch (error) {
      setError(error.message);
    }
  };

  const handleClose = () => {
    setNombreFamilia('');
    setError('');
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Crear Nueva Familia</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Nombre de la Familia
            </label>
            <input
              type="text"
              value={nombreFamilia}
              onChange={(e) => setNombreFamilia(e.target.value)}
              placeholder="Ej: Familia Rodríguez"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={loading}
              maxLength={50}
            />
            <p className="text-sm text-gray-500 mt-1">
              Elige un nombre significativo para tu familia
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
              disabled={loading || !nombreFamilia.trim()}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Familia'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">💡 Información importante:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Serás el administrador de la nueva familia</li>
            <li>• Se generará un código de invitación automáticamente</li>
            <li>• Podrás invitar a otros miembros usando el código</li>
            <li>• Puedes gestionar plantas y miembros desde el panel</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CrearFamiliaModal;