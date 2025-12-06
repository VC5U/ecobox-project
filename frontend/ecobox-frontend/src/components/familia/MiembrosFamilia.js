// src/components/familia/MiembrosFamilia.js - VERSIÓN CORREGIDA
import React, { useState } from 'react';
import { familiasService } from '../../services/familiasService';
import './Familia.css';

const MiembrosFamilia = ({ miembros, familia, onMiembroActualizado }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAgregarMiembro, setShowAgregarMiembro] = useState(false);
  const [emailNuevoMiembro, setEmailNuevoMiembro] = useState('');
  const [esAdministrador, setEsAdministrador] = useState(false);
  
  // Obtener usuario actual
  const usuarioActual = JSON.parse(localStorage.getItem('user') || '{}');

  // ========== DEBUG: Verificar miembros ==========
  console.log('📊 === DEBUG MIEMBROS ===');
  console.log('Array de miembros:', miembros);
  if (miembros && Array.isArray(miembros)) {
    miembros.forEach((m, i) => {
      console.log(`Miembro ${i}: ID=${m.idUsuario}, Nombre=${m.nombre}, Admin=${m.esAdministrador}`);
    });
  }
  console.log('=== FIN DEBUG ===');
  // ==============================================

  const handleCambiarRol = async (idUsuario, nuevoRol) => {
    try {
      setLoading(true);
      setError('');
      
      await familiasService.cambiarRolMiembro(familia.idFamilia, idUsuario, nuevoRol);
      
      if (onMiembroActualizado) {
        onMiembroActualizado(familia.idFamilia);
      }
      
    } catch (error) {
      setError(error.message || 'Error al cambiar el rol');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarMiembro = async (idUsuario) => {
    try {
      console.log('=== INICIANDO ELIMINACIÓN ===');
      
      // DEBUG: Verificar todos los datos
      console.log('👤 Usuario actual:', usuarioActual);
      console.log('🎯 ID Usuario a eliminar:', idUsuario);
      console.log('🏠 Familia ID:', familia?.idFamilia);
      
      // Convertir a número si es string
      const idUsuarioNum = parseInt(idUsuario);
      console.log('🎯 ID Usuario (numérico):', idUsuarioNum);
      
      // Buscar el miembro completo para ver sus datos
      const miembroAEliminar = miembros.find(m => {
        console.log(`🔍 Comparando: ${m.idUsuario} vs ${idUsuario}`);
        return m.idUsuario == idUsuario;
      });
      
      console.log('👤 Miembro encontrado:', miembroAEliminar);
      
      if (!miembroAEliminar) {
        alert('Miembro no encontrado en la lista local');
        return;
      }
      
      // Confirmación
      if (!window.confirm(`¿Estás seguro de eliminar a ${miembroAEliminar.nombre} ${miembroAEliminar.apellido} de la familia?`)) {
        return;
      }

      // Validar que no sea el usuario actual
      if (idUsuarioNum === usuarioActual.id) {
        alert('No puedes eliminarte a ti mismo');
        return;
      }

      // Validar que no sea el último administrador
      const admins = miembros.filter(m => m.esAdministrador);
      console.log(`👥 Administradores totales: ${admins.length}`);
      
      if (miembroAEliminar?.esAdministrador && admins.length <= 1) {
        alert('No puedes eliminar al único administrador de la familia');
        return;
      }

      console.log(`📤 Enviando solicitud de eliminación...`);
      
      // Llamar al servicio
      const resultado = await familiasService.eliminarMiembro(familia.idFamilia, idUsuarioNum);
      
      console.log('✅ Resultado:', resultado);
      
      // Actualizar la lista
      if (onMiembroActualizado) {
        console.log('🔄 Actualizando lista...');
        await onMiembroActualizado(familia.idFamilia);
      }
      
      alert('✅ Miembro eliminado exitosamente');
      
    } catch (error) {
      console.error('💥 ERROR COMPLETO:', error);
      
      // Mensajes específicos
      if (error.message.includes('403') || error.response?.status === 403) {
        alert('🔒 ERROR 403: No tienes permisos para eliminar miembros.\n\nSolo los administradores pueden eliminar miembros.');
      } else if (error.message.includes('400') || error.response?.status === 400) {
        alert(`❌ Error: ${error.response?.data?.error || error.message}`);
      } else if (error.message.includes('No puedes eliminarte')) {
        alert(error.message);
      } else {
        alert(`❌ Error: ${error.message || 'Error desconocido'}`);
      }
    }
  };
  
  const handleAgregarMiembro = async (e) => {
    e.preventDefault();
    
    if (!emailNuevoMiembro.trim()) {
      setError('Por favor ingresa un email');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await familiasService.agregarMiembro(
        familia.idFamilia, 
        emailNuevoMiembro.trim(), 
        esAdministrador
      );
      
      setEmailNuevoMiembro('');
      setEsAdministrador(false);
      setShowAgregarMiembro(false);
      
      if (onMiembroActualizado) {
        onMiembroActualizado(familia.idFamilia);
      }
      
    } catch (error) {
      setError(error.message || 'Error al agregar el miembro');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarCodigo = async () => {
    try {
      setLoading(true);
      setError('');
      
      const resultado = await familiasService.generarCodigoInvitacion(familia.idFamilia);
      
      if (resultado.success) {
        alert(`Nuevo código de invitación: ${resultado.codigo_invitacion}`);
      }
      
    } catch (error) {
      setError(error.message || 'Error al generar código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="miembros-container">
      <div className="miembros-header">
        <h3 className="miembros-title">Miembros de la Familia</h3>
        
        <div className="miembros-actions">
          {/* Mostrar error si existe 
          <button
            onClick={handleGenerarCodigo}
            disabled={loading || !familia.esAdmin}
            className="miembros-action-btn miembros-action-btn--primary"
          >
            Generar Código
          </button>
          */}
          <button
            onClick={() => setShowAgregarMiembro(true)}
            disabled={loading || !familia.esAdmin}
            className="miembros-action-btn miembros-action-btn--secondary"
          >
            Agregar Miembro
          </button>
        </div>
      </div>

      {/* Lista de miembros */}
      <div className="miembros-list">
        {miembros.map((miembro, index) => {
          console.log(`🔄 Renderizando miembro ${index}:`, miembro.idUsuario, miembro.nombre);
          
          return (
            <div key={`${miembro.idUsuario}-${index}`} className="miembro-card">
              <div className="miembro-avatar">
                {miembro.nombre.charAt(0)}{miembro.apellido.charAt(0)}
              </div>
              <div className="miembro-info">
                <h4 className="miembro-nombre">
                  {miembro.nombre} {miembro.apellido}
                </h4>
                <p className="miembro-email">{miembro.email}</p>
                <div className="miembro-detalles">
                  <span className={`miembro-rol miembro-rol--${miembro.esAdministrador ? 'admin' : 'miembro'}`}>
                    {miembro.nombreRol}
                  </span>
                  <span className="miembro-fecha">
                    Se unió: {new Date(miembro.fechaUnion).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              {/* SOLO mostrar botones si ES admin */}
              {familia.esAdmin && (
                <div className="miembro-acciones">
                  {/* Botones de cambiar rol */}
                  {!miembro.esAdministrador ? (
                    <button
                      onClick={() => {
                        console.log('👑 Hacer admin para:', miembro.nombre, 'ID:', miembro.idUsuario);
                        handleCambiarRol(miembro.idUsuario, true);
                      }}
                      disabled={loading}
                      className="miembro-accion-btn"
                    >
                      Hacer Admin
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        console.log('👑 Quitar admin para:', miembro.nombre, 'ID:', miembro.idUsuario);
                        handleCambiarRol(miembro.idUsuario, false);
                      }}
                      disabled={loading}
                      className="miembro-accion-btn"
                    >
                      Quitar Admin
                    </button>
                  )}
                  
                  {/* Botón eliminar con validaciones adicionales */}
                  {miembro.idUsuario !== usuarioActual?.id && 
                   !(miembro.esAdministrador && miembros.filter(m => m.esAdministrador).length <= 1) && (
                    <button
                      onClick={() => {
                        console.log('🗑️ Click eliminar para:', miembro.nombre);
                        console.log('🎯 ID a eliminar:', miembro.idUsuario);
                        handleEliminarMiembro(miembro.idUsuario);
                      }}
                      disabled={loading}
                      className="miembro-accion-btn miembro-accion-btn--eliminar"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Modal para agregar miembro */}
      {showAgregarMiembro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Agregar Nuevo Miembro</h3>
            
            <form onSubmit={handleAgregarMiembro}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Email del Usuario
                </label>
                <input
                  type="email"
                  value={emailNuevoMiembro}
                  onChange={(e) => setEmailNuevoMiembro(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={loading}
                />
              </div>
              
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="esAdministrador"
                  checked={esAdministrador}
                  onChange={(e) => setEsAdministrador(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="esAdministrador" className="ml-2 text-sm text-gray-700">
                  Hacer administrador
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAgregarMiembro(false)}
                  disabled={loading}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !emailNuevoMiembro.trim()}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? 'Agregando...' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Información de la familia 
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">📋 Información de la Familia</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Código de invitación:</span>
            <p className="font-mono text-gray-800">{familia.codigoInvitacion}</p>
          </div>
          <div>
            <span className="text-gray-600">Fecha de creación:</span>
            <p className="text-gray-800">{new Date(familia.fechaCreacion).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="text-gray-600">Total miembros:</span>
            <p className="text-gray-800">{miembros.length}</p>
          </div>
          <div>
            <span className="text-gray-600">Plantas asociadas:</span>
            <p className="text-gray-800">{familia.cantidadPlantas}</p>
          </div>
        </div>
      </div>
      */}
    </div>
  );
};

export default MiembrosFamilia;