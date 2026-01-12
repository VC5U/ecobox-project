// components/Notificaciones/Notificaciones.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import './Notificaciones.css';

function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noLeidasCount, setNoLeidasCount] = useState(0);
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState('todas');

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 
                  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');
    return `${dia} ${mes}, ${horas}:${minutos}`;
  };

  const calcularTiempoTranscurrido = (fechaStr) => {
    const ahora = new Date();
    const fecha = new Date(fechaStr);
    const diffMs = ahora - fecha;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffDias > 0) {
      return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;
    } else if (diffHoras > 0) {
      return `Hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    } else if (diffMin > 0) {
      return `Hace ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
    }
    return 'Hace unos momentos';
  };

  const fetchNotificaciones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await API.get('/notificaciones/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const datos = Array.isArray(response.data) ? response.data : response.data.results;
      
      // Ordenar por fecha (más recientes primero)
      const ordenadas = datos.sort((a, b) => 
        new Date(b.fecha_creacion) - new Date(a.fecha_creacion)
      );
      
      setNotificaciones(ordenadas);
      const noLeidas = ordenadas.filter(n => !n.leida).length;
      setNoLeidasCount(noLeidas);
      setFiltroActivo('todas');
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeida = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await API.post(`/notificaciones/${id}/marcar_leida/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotificaciones(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, leida: true } : notif
        )
      );
      setNoLeidasCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error al marcar como leída:', err);
    }
  };

  const marcarTodasComoLeidas = async () => {
    try {
      setMarcandoTodas(true);
      const token = localStorage.getItem('token');
      const noLeidas = notificaciones.filter(n => !n.leida);
      
      // Marcar una por una
      for (const notif of noLeidas) {
        await API.post(`/notificaciones/${notif.id}/marcar_leida/`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Actualizar estado local
      setNotificaciones(prev =>
        prev.map(notif => ({ ...notif, leida: true }))
      );
      setNoLeidasCount(0);
    } catch (err) {
      console.error('Error al marcar todas como leídas:', err);
    } finally {
      setMarcandoTodas(false);
    }
  };

  const getIconoPorTipo = (tipo) => {
    switch (tipo) {
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const getClasePorTipo = (tipo) => {
    switch (tipo) {
      case 'warning': return 'nt-notificacion-tipo-warning';
      case 'error': return 'nt-notificacion-tipo-error';
      case 'success': return 'nt-notificacion-tipo-success';
      default: return 'nt-notificacion-tipo-info';
    }
  };

  const aplicarFiltro = (filtro) => {
    setFiltroActivo(filtro);
    
    if (filtro === 'todas') {
      fetchNotificaciones();
    } else if (filtro === 'sin-leer') {
      const sinLeer = notificaciones.filter(n => !n.leida);
      setNoLeidasCount(sinLeer.length);
    } else if (filtro === 'leidas') {
      const leidas = notificaciones.filter(n => n.leida);
      setNoLeidasCount(0);
    }
  };

  // Filtrar notificaciones según el filtro activo
  const notificacionesFiltradas = notificaciones.filter(notif => {
    if (filtroActivo === 'todas') return true;
    if (filtroActivo === 'sin-leer') return !notif.leida;
    if (filtroActivo === 'leidas') return notif.leida;
    return true;
  });

  useEffect(() => {
    fetchNotificaciones();
    
    // Refrescar cada 60 segundos
    const interval = setInterval(fetchNotificaciones, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="nt-notificaciones-loading">
        <div className="nt-loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="nt-notificaciones-container">
      {/* Encabezado */}
      <div className="nt-notificaciones-header">
        <h1 className="nt-notificaciones-titulo">Notificaciones</h1>
        <div className="nt-notificaciones-subheader">
          <div className="nt-notificaciones-contadores">
            <span className="nt-notificaciones-contador">
              {noLeidasCount} sin leer
            </span>
            {noLeidasCount > 0 && (
              <button
                onClick={marcarTodasComoLeidas}
                disabled={marcandoTodas}
                className="nt-notificaciones-marcar-todas-btn"
              >
                {marcandoTodas ? 'Marcando...' : 'Marcar todas como leídas'}
              </button>
            )}
          </div>
          <div className="nt-notificaciones-total">
            Total: {notificaciones.length}
          </div>
        </div>
      </div>
{/* Filtros */}
      <div className="nt-notificaciones-filtros">
        <button
          onClick={() => aplicarFiltro('todas')}
          className={`nt-notificaciones-filtro-btn ${filtroActivo === 'todas' ? 'nt-filtro-activo' : ''}`}
        >
          Todas
        </button>
        <button
          onClick={() => aplicarFiltro('sin-leer')}
          className={`nt-notificaciones-filtro-btn ${filtroActivo === 'sin-leer' ? 'nt-filtro-activo' : ''}`}
        >
          Sin leer
        </button>
        <button
          onClick={() => aplicarFiltro('leidas')}
          className={`nt-notificaciones-filtro-btn ${filtroActivo === 'leidas' ? 'nt-filtro-activo' : ''}`}
        >
          Leídas
        </button>
      </div>
      {/* Lista de notificaciones */}
      <div className="nt-notificaciones-lista-container">
        {notificacionesFiltradas.length === 0 ? (
          <div className="nt-notificaciones-vacio">
            {filtroActivo === 'todas' 
              ? 'No hay notificaciones' 
              : filtroActivo === 'sin-leer'
                ? 'No hay notificaciones sin leer'
                : 'No hay notificaciones leídas'}
          </div>
        ) : (
          <ul className="nt-notificaciones-lista">
            {notificacionesFiltradas.map((notificacion) => (
              <li
                key={notificacion.id}
                className={`nt-notificacion-item ${!notificacion.leida ? 'nt-notificacion-no-leida' : ''}`}
              >
                <div className="nt-notificacion-contenido">
                  {/* Checkbox */}
                  <div className="nt-notificacion-checkbox">
                    <input
                      type="checkbox"
                      checked={notificacion.leida}
                      onChange={() => !notificacion.leida && marcarComoLeida(notificacion.id)}
                      className="nt-notificacion-checkbox-input"
                    />
                  </div>

                  {/* Icono y tipo */}
                  <div className="nt-notificacion-icono">
                    <span className="nt-notificacion-icono-simbolo">
                      {getIconoPorTipo(notificacion.tipo)}
                    </span>
                    <span className={`nt-notificacion-tipo ${getClasePorTipo(notificacion.tipo)}`}>
                      {notificacion.tipo}
                    </span>
                    {!notificacion.leida && (
                      <span className="nt-notificacion-punto-no-leida"></span>
                    )}
                  </div>

                  {/* Contenido principal */}
                  <div className="nt-notificacion-info">
                    <div className="nt-notificacion-fecha">
                      {formatearFecha(notificacion.fecha_creacion)}
                    </div>
                    <p className={`nt-notificacion-mensaje ${!notificacion.leida ? 'nt-notificacion-mensaje-no-leida' : ''}`}>
                      {notificacion.mensaje}
                    </p>
                    <div className="nt-notificacion-tiempo">
                      {calcularTiempoTranscurrido(notificacion.fecha_creacion)}
                    </div>
                    
                    {/* Botón para marcar como leída */}
                    {!notificacion.leida && (
                      <button
                        onClick={() => marcarComoLeida(notificacion.id)}
                        className="nt-notificacion-marcar-btn"
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      
    </div>
  );
}

export default Notificaciones;