// src/hooks/useFamilias.js
import { useState, useEffect } from 'react';
import { familiasService } from '../services/familiasService';

export const useFamilias = () => {
  const [familias, setFamilias] = useState([]);
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState(null);
  const [miembros, setMiembros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usuarioActual, setUsuarioActual] = useState(null);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📥 Cargando datos iniciales de familias...');
      
      // Cargar usuario actual desde localStorage
      const usuario = await familiasService.getUsuarioActual();
      console.log('👤 Usuario actual cargado:', usuario);
      setUsuarioActual(usuario);
      
      // Cargar familias
      const datosFamilias = await familiasService.getFamilias();
      console.log('🏠 Familias cargadas:', datosFamilias);
      
      // Validar y limpiar datos de familias
      const familiasValidas = Array.isArray(datosFamilias) 
        ? datosFamilias.filter(f => f && f.nombreFamilia)
        : [];
      
      setFamilias(familiasValidas);
      
      // Seleccionar primera familia si existe
      if (familiasValidas.length > 0) {
        setFamiliaSeleccionada(familiasValidas[0]);
        console.log('🎯 Familia seleccionada:', familiasValidas[0]);
      } else {
        setFamiliaSeleccionada(null);
      }
    } catch (err) {
      console.error('❌ Error al cargar datos iniciales:', err);
      setError('Error al cargar los datos. Por favor intenta nuevamente.');
      setFamilias([]);
      setFamiliaSeleccionada(null);
    } finally {
      setLoading(false);
    }
  };

  const cargarMiembros = async (idFamilia) => {
    try {
      if (!idFamilia) {
        setMiembros([]);
        return;
      }
      
      setError(null);
      console.log(`📥 Cargando miembros para familia ${idFamilia}...`);
      
      const datosMiembros = await familiasService.getMiembros(idFamilia);
      console.log(`👥 Miembros cargados para familia ${idFamilia}:`, datosMiembros);
      
      // Validar y limpiar datos de miembros
      const miembrosValidos = Array.isArray(datosMiembros)
        ? datosMiembros.filter(m => m && m.nombre)
        : [];
      
      setMiembros(miembrosValidos);
    } catch (err) {
      console.error('❌ Error al cargar miembros:', err);
      setError('Error al cargar los miembros de la familia.');
      setMiembros([]);
    }
  };

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (familiaSeleccionada && familiaSeleccionada.idFamilia) {
      cargarMiembros(familiaSeleccionada.idFamilia);
    } else {
      setMiembros([]);
    }
  }, [familiaSeleccionada]);

  // Crear nueva familia con mejor manejo de errores
  const crearFamilia = async (familiaData) => {
    try {
      setError(null);
      console.log('🆕 Creando nueva familia:', familiaData);
      
      if (!familiaData.nombreFamilia || !familiaData.nombreFamilia.trim()) {
        throw new Error('El nombre de la familia es requerido');
      }
      
      const nuevaFamilia = await familiasService.crearFamilia(familiaData);
      console.log('✅ Familia creada exitosamente:', nuevaFamilia);
      
      // Recargar todas las familias para incluir la nueva
      await cargarDatosIniciales();
      
      return nuevaFamilia;
    } catch (err) {
      console.error('❌ Error al crear familia:', err);
      setError(err.message || 'Error al crear la familia');
      throw err;
    }
  };

  // Unirse a familia con mejor manejo de errores
  const unirseAFamilia = async (codigoInvitacion) => {
    try {
      setError(null);
      console.log(`🤝 Uniéndose a familia con código: ${codigoInvitacion}`);
      
      const resultado = await familiasService.unirseAFamilia(codigoInvitacion);
      
      // Recargar todo para reflejar los cambios
      await cargarDatosIniciales();
      console.log('✅ Unión exitosa:', resultado);
      
      return resultado;
    } catch (err) {
      console.error('❌ Error al unirse a familia:', err);
      setError(err.message || 'Error al unirse a la familia');
      throw err;
    }
  };

  // Verificar si el usuario actual es admin - MÁS ROBUSTO
  const esAdmin = familiaSeleccionada && usuarioActual && 
    miembros.some(m => 
      m.idUsuario === usuarioActual.idUsuario && 
      (m.esAdministrador || m.idRol === 1)
    );

  console.log('👑 Es admin?:', esAdmin, {
    familiaSeleccionada: familiaSeleccionada?.idFamilia,
    usuarioActual: usuarioActual?.idUsuario,
    miembrosCount: miembros.length
  });

  return {
    // Estado
    familias,
    familiaSeleccionada,
    miembros,
    loading,
    error,
    usuarioActual,
    esAdmin,

    // Setters
    setFamiliaSeleccionada,

    // Acciones
    crearFamilia,
    unirseAFamilia,
    recargarDatos: cargarDatosIniciales,
    recargarMiembros: () => familiaSeleccionada ? cargarMiembros(familiaSeleccionada.idFamilia) : null
  };
};