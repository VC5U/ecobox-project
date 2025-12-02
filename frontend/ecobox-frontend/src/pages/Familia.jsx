import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente de Tarjeta de Familia
const FamiliaCard = ({ familia, onSelect, esAdmin }) => {
  return (
    <div 
      className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-100"
      onClick={() => onSelect(familia)}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-lg">
            {familia.nombreFamilia.charAt(0)}
          </span>
        </div>
        {esAdmin && (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
            Admin
          </span>
        )}
      </div>
      
      <h3 className="font-bold text-gray-900 text-lg mb-2">
        {familia.nombreFamilia}
      </h3>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{familia.cantidadMiembros || 0} miembros</span>
        <span>{familia.cantidadPlantas || 0} plantas</span>
      </div>
    </div>
  );
};

// Componente de Miembro
const MiembroCard = ({ miembro, esAdmin, onRoleChange, onRemove, currentUserId }) => {
  const [cambiandoRol, setCambiandoRol] = useState(false);

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

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4">
        {/* Avatar */}
        <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold">
            {miembro.nombre.charAt(0)}
          </span>
        </div>
        
        {/* Información */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="font-semibold text-gray-900 truncate">
              {miembro.nombre}
              {esUsuarioActual && (
                <span className="ml-2 text-blue-600 text-sm">(Tú)</span>
              )}
            </h4>
          </div>
          <p className="text-sm text-gray-500 truncate">{miembro.email}</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              miembro.idRol === 1 
                ? 'bg-purple-100 text-purple-800' 
                : miembro.idRol === 2
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {miembro.nombreRol}
            </span>
            {miembro.ultimaConexion && (
              <span className="text-xs text-gray-400">
                Última vez: {new Date(miembro.ultimaConexion).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Acciones */}
        {esAdmin && (
          <div className="flex items-center space-x-2">
            <select
              value={miembro.idRol}
              onChange={(e) => handleRoleChange(parseInt(e.target.value))}
              disabled={cambiandoRol || esUsuarioActual}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>Administrador</option>
              <option value={2}>Miembro</option>
              <option value={3}>Solo lectura</option>
            </select>
            
            {puedeEliminar && (
              <button
                onClick={() => onRemove(miembro.idUsuario)}
                className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                title="Eliminar miembro"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

// Componente Modal de Invitación
const ModalInvitacion = ({ isOpen, onClose, familia, codigoInvitacion, onGenerateCode }) => {
  const [codigo, setCodigo] = useState('');

  useEffect(() => {
    if (isOpen && familia && !codigoInvitacion) {
      onGenerateCode(familia.idFamilia);
    }
  }, [isOpen, familia, codigoInvitacion, onGenerateCode]);

  if (!isOpen) return null;

  const linkInvitacion = `${window.location.origin}/unirse/${codigoInvitacion}`;

  const copiarLink = () => {
    navigator.clipboard.writeText(linkInvitacion);
    alert('¡Enlace copiado al portapapeles!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            Invitar a {familia?.nombreFamilia}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Comparte este enlace:</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={linkInvitacion}
                readOnly
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              />
              <button
                onClick={copiarLink}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Este enlace expirará en 7 días. Los nuevos miembros tendrán rol de "Miembro" por defecto.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente Principal Familia
function Familia() {
  const [familias, setFamilias] = useState([]);
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState(null);
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalInvitacionAbierto, setModalInvitacionAbierto] = useState(false);
  const [codigoInvitacion, setCodigoInvitacion] = useState('');
  const [usuarioActual, setUsuarioActual] = useState(null);

  // Obtener datos del usuario actual y sus familias
  const obtenerDatosUsuario = async () => {
    try {
      // Asumiendo que tienes un endpoint para el usuario actual
      const userResponse = await axios.get('http://localhost:8000/api/usuarios/actual/');
      setUsuarioActual(userResponse.data);
      
      const familiasResponse = await axios.get('http://localhost:8000/api/familias/');
      setFamilias(familiasResponse.data);
      
      if (familiasResponse.data.length > 0) {
        setFamiliaSeleccionada(familiasResponse.data[0]);
      }
    } catch (error) {
      console.error('Error al obtener datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener miembros de la familia
  const obtenerMiembros = async (idFamilia) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/familias/${idFamilia}/miembros/`);
      setMiembros(response.data);
    } catch (error) {
      console.error('Error al obtener miembros:', error);
    }
  };

  // Generar código de invitación
  const generarCodigoInvitacion = async (idFamilia) => {
    try {
      const response = await axios.post(`http://localhost:8000/api/familias/${idFamilia}/generar-invitacion/`);
      setCodigoInvitacion(response.data.codigoInvitacion);
      return response.data.codigoInvitacion;
    } catch (error) {
      console.error('Error al generar código:', error);
    }
  };

  // Cambiar rol de miembro
  const cambiarRolMiembro = async (idUsuario, nuevoRol) => {
    try {
      await axios.put(`http://localhost:8000/api/familias/${familiaSeleccionada.idFamilia}/miembros/${idUsuario}/`, {
        idRol: nuevoRol
      });
      obtenerMiembros(familiaSeleccionada.idFamilia);
    } catch (error) {
      console.error('Error al cambiar rol:', error);
    }
  };

  // Eliminar miembro
  const eliminarMiembro = async (idUsuario) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este miembro de la familia?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/api/familias/${familiaSeleccionada.idFamilia}/miembros/${idUsuario}/`);
      obtenerMiembros(familiaSeleccionada.idFamilia);
    } catch (error) {
      console.error('Error al eliminar miembro:', error);
    }
  };

  // Verificar si el usuario actual es admin de la familia seleccionada
  const esAdmin = familiaSeleccionada && usuarioActual && 
    miembros.some(m => m.idUsuario === usuarioActual.idUsuario && m.idRol === 1);

  useEffect(() => {
    obtenerDatosUsuario();
  }, []);

  useEffect(() => {
    if (familiaSeleccionada) {
      obtenerMiembros(familiaSeleccionada.idFamilia);
    }
  }, [familiaSeleccionada]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Familias</h1>
          <p className="text-gray-600 mt-2">
            Gestiona las familias a las que perteneces y sus miembros
          </p>
        </div>
        
        {familiaSeleccionada && esAdmin && (
          <button
            onClick={() => setModalInvitacionAbierto(true)}
            className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Invitar Miembro</span>
          </button>
        )}
      </div>

      {/* Grid de Familias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {familias.map(familia => (
          <FamiliaCard
            key={familia.idFamilia}
            familia={familia}
            onSelect={setFamiliaSeleccionada}
            esAdmin={miembros.some(m => 
              m.idUsuario === usuarioActual?.idUsuario && m.idRol === 1
            )}
          />
        ))}
        
        {familias.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="bg-white rounded-2xl shadow-sm p-8 border-2 border-dashed border-gray-300">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No perteneces a ninguna familia</h3>
              <p className="text-gray-500 mb-4">Únete a una familia existente o crea una nueva para empezar</p>
              <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Crear Primera Familia
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detalles de Familia Seleccionada */}
      {familiaSeleccionada && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {familiaSeleccionada.nombreFamilia}
                </h2>
                <p className="text-blue-100 text-sm">
                  {miembros.length} miembro(s) • Creada el {new Date(familiaSeleccionada.fechaCreacion).toLocaleDateString()}
                </p>
              </div>
              {esAdmin && (
                <span className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Eres Administrador
                </span>
              )}
            </div>
          </div>

          {/* Lista de Miembros */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Miembros de la Familia</h3>
            <div className="grid gap-3">
              {miembros.map(miembro => (
                <MiembroCard
                  key={miembro.idUsuario}
                  miembro={miembro}
                  esAdmin={esAdmin}
                  onRoleChange={cambiarRolMiembro}
                  onRemove={eliminarMiembro}
                  currentUserId={usuarioActual?.idUsuario}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Invitación */}
      <ModalInvitacion
        isOpen={modalInvitacionAbierto}
        onClose={() => setModalInvitacionAbierto(false)}
        familia={familiaSeleccionada}
        codigoInvitacion={codigoInvitacion}
        onGenerateCode={generarCodigoInvitacion}
      />
    </div>
  );
}

export default Familia;