// src/pages/Plantas.js - VERSIÓN COMPLETA CORREGIDA
import React from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import PlantList from '../components/plants/PlantList';
import PlantForm from '../components/plants/PlantForm';
import PlantDetail from '../components/plants/PlantDetail';
import PlantEdit from '../components/plants/PlantEdit';
import Seguimiento from '../components/plants/Seguimiento'; // ✅ Nombre correcto
import SeguimientoForm from '../components/plants/SeguimientoForm';
import { usePlantas } from '../hooks/usePlantas';
import { plantasService } from '../services/plantasService';
import './Plantas.css';

const Plantas = () => {
  const navigate = useNavigate();
  
  return (
    <div className="plantas-page">
      <Routes>
        <Route index element={<PlantasLista />} />
        <Route path="nueva" element={<PlantasFormulario />} />
        <Route path=":id" element={<PlantasDetalle />} />
        <Route path=":id/editar" element={<PlantEdit />} />
<Route path=":id/seguimiento" element={<PlantasSeguimiento />} /> 
        <Route path=":id/seguimiento/nuevo" element={<PlantasNuevoSeguimiento />} /> 
              </Routes>
    </div>
  );
};

// Subcomponente para lista de plantas
const PlantasLista = () => {
  const navigate = useNavigate();
  const { plantas, loading: loadingPlantas, error: errorPlantas, cargarPlantas } = usePlantas();
  const [sensores, setSensores] = React.useState([]);
  const [loadingSensores, setLoadingSensores] = React.useState(false);
  const [errorSensores, setErrorSensores] = React.useState(null);

  React.useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    await cargarPlantas();
    await cargarSensores();
  };

  const cargarSensores = async () => {
    try {
      setLoadingSensores(true);
      setErrorSensores(null);
      
      console.log('📡 Cargando sensores con mediciones...');
      
      const sensoresData = await plantasService.getSensoresConMediciones();
      
      console.log(`✅ ${sensoresData.length} sensores con mediciones cargados`);
      
      if (sensoresData.length > 0) {
        console.log('🔍 Ejemplo de primer sensor:', {
          id: sensoresData[0].id,
          nombre: sensoresData[0].nombre,
          tipo_sensor: sensoresData[0].tipo_sensor,
          planta: sensoresData[0].planta,
          ultima_medicion: sensoresData[0].ultima_medicion
        });
        
        // Contar sensores con valores
        const sensoresConValores = sensoresData.filter(s => 
          s.ultima_medicion && s.ultima_medicion.valor !== undefined
        );
        console.log(`📊 ${sensoresConValores.length} sensores tienen valores`);
      }
      
      setSensores(sensoresData);
      
    } catch (error) {
      console.error('❌ Error cargando sensores:', error);
      setErrorSensores(error);
      setSensores([]);
    } finally {
      setLoadingSensores(false);
    }
  };

  const handleAddPlant = () => {
    navigate('/plantas/nueva');
  };

  const loading = loadingPlantas || loadingSensores;
  const error = errorPlantas || errorSensores;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando plantas y sensores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error al cargar datos</h3>
        <p>{error.message}</p>
        <button onClick={cargarDatos} className="btn btn-primary">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <PlantList 
      plantas={plantas}
      sensores={sensores}
      onAddPlant={handleAddPlant}
    />
  );
};

// Subcomponente para formulario de nueva planta
const PlantasFormulario = () => {
  const navigate = useNavigate();
  const { agregarPlanta, cargarPlantas } = usePlantas();

  const handleSubmit = async (plantData) => {
    try {
      await agregarPlanta(plantData);
      await cargarPlantas();
      navigate('/plantas');
    } catch (error) {
      console.error('Error creando planta:', error);
      alert('Error al crear la planta');
    }
  };

  const handleCancel = () => {
    navigate('/plantas');
  };

  return (
    <PlantForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
};

// Subcomponente para detalle de planta
const PlantasDetalle = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const handleEdit = () => {
    navigate(`/plantas/${id}/editar`);
  };

  const handleBack = () => {
    navigate('/plantas');
  };

  return (
    <PlantDetail
      onEdit={handleEdit}
      onBack={handleBack}
    />
  );
};
// Subcomponente para seguimiento de planta (HISTORIAL)
const PlantasSeguimiento = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  
  const handleBack = () => {
    navigate(`/plantas/${id}`);
  };
  
  const handleAddSeguimiento = () => {
    navigate(`/plantas/${id}/seguimiento/nuevo`);
  };
  
  return (
    <Seguimiento
      plantaId={id}
      onBack={handleBack}
      onAddSeguimiento={handleAddSeguimiento}
    />
  );
};

// Subcomponente para NUEVO seguimiento (FORMULARIO)
const PlantasNuevoSeguimiento = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  
  const handleBack = () => {
    navigate(`/plantas/${id}/seguimiento`);
  };
  
  const handleCancel = () => {
    navigate(`/plantas/${id}/seguimiento`);
  };
  
  return (
    <SeguimientoForm
      plantaId={id}
      onBack={handleBack}
      onCancel={handleCancel}
    />
  );
};

// Subcomponente para editar planta
const PlantasEditar = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { plantas, actualizarPlanta, cargarPlantas } = usePlantas();

  const plantaExistente = plantas.find(p => 
    p.idPlanta === parseInt(id) || p.id === parseInt(id)
  );

  const handleSubmit = async (plantData) => {
    try {
      await actualizarPlanta(id, plantData);
      await cargarPlantas();
      navigate(`/plantas/${id}`);
    } catch (error) {
      console.error('Error actualizando planta:', error);
      alert('Error al actualizar la planta');
    }
  };

  const handleCancel = () => {
    navigate(`/plantas/${id}`);
  };

  if (!plantaExistente) {
    return (
      <div className="error-container">
        <h3>Planta no encontrada</h3>
        <p>La planta que intentas editar no existe.</p>
        <button onClick={() => navigate('/plantas')} className="btn btn-primary">
          Volver a la lista
        </button>
      </div>
    );
  }

  return (
    <PlantEdit
      plantaExistente={plantaExistente}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
};

export default Plantas;