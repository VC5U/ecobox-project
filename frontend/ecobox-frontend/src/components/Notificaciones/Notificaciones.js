// components/Notificaciones/Notificaciones.jsx
import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import './Notificaciones.css';
import { AppleIcon } from 'lucide-react';

function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noLeidasCount, setNoLeidasCount] = useState(0);
  const [marcandoTodas, setMarcandoTodas] = useState(false);

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
      case 'warning': return 'notificacion-tipo-warning';
      case 'error': return 'notificacion-tipo-error';
      case 'success': return 'notificacion-tipo-success';
      default: return 'notificacion-tipo-info';
    }
  };

  useEffect(() => {
    fetchNotificaciones();
    
    // Refrescar cada 60 segundos
    const interval = setInterval(fetchNotificaciones, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="notificaciones-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="notificaciones-container">
      {/* Encabezado */}
      <div className="notificaciones-header">
        <h1 className="notificaciones-titulo">Notificaciones</h1>
        <div className="notificaciones-subheader">
          <div className="notificaciones-contadores">
            <span className="notificaciones-contador">
              {noLeidasCount} notificación{noLeidasCount !== 1 ? 'es' : ''} sin leer
            </span>
            {noLeidasCount > 0 && (
              <button
                onClick={marcarTodasComoLeidas}
                disabled={marcandoTodas}
                className="notificaciones-marcar-todas-btn"
              >
                {marcandoTodas ? 'Marcando...' : 'Marcar todas como leídas'}
              </button>
            )}
          </div>
          <div className="notificaciones-total">
            Total: {notificaciones.length}
          </div>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="notificaciones-lista-container">
        {notificaciones.length === 0 ? (
          <div className="notificaciones-vacio">
            No hay notificaciones
          </div>
        ) : (
          <ul className="notificaciones-lista">
            {notificaciones.map((notificacion) => (
              <li
                key={notificacion.id}
                className={`notificacion-item ${!notificacion.leida ? 'notificacion-no-leida' : ''}`}
              >
                <div className="notificacion-contenido">
                  {/* Checkbox */}
                  <div className="notificacion-checkbox">
                    <input
                      type="checkbox"
                      checked={notificacion.leida}
                      onChange={() => !notificacion.leida && marcarComoLeida(notificacion.id)}
                      className="notificacion-checkbox-input"
                    />
                  </div>

                  {/* Icono y tipo */}
                  <div className="notificacion-icono">
                    <span className="notificacion-icono-simbolo">
                      {getIconoPorTipo(notificacion.tipo)}
                    </span>
                    <span className={`notificacion-tipo ${getClasePorTipo(notificacion.tipo)}`}>
                      {notificacion.tipo}
                    </span>
                    {!notificacion.leida && (
                      <span className="notificacion-punto-no-leida"></span>
                    )}
                  </div>

                  {/* Contenido principal */}
                  <div className="notificacion-info">
                    <div className="notificacion-fecha">
                      {formatearFecha(notificacion.fecha_creacion)}
                    </div>
                    <p className={`notificacion-mensaje ${!notificacion.leida ? 'notificacion-mensaje-no-leida' : ''}`}>
                      {notificacion.mensaje}
                    </p>
                    <div className="notificacion-tiempo">
                      {calcularTiempoTranscurrido(notificacion.fecha_creacion)}
                    </div>
                    
                    {/* Botón para marcar como leída */}
                    {!notificacion.leida && (
                      <button
                        onClick={() => marcarComoLeida(notificacion.id)}
                        className="notificacion-marcar-btn"
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

      {/* Filtros */}
      <div className="notificaciones-filtros">
        <button
          onClick={() => fetchNotificaciones()}
          className="notificaciones-filtro-btn"
        >
          Todas
        </button>
        <button
          onClick={async () => {
            const token = localStorage.getItem('token');
            const response = await API.get('/notificaciones/', {
              headers: { Authorization: `Bearer ${token}` }
            });
            const todas = Array.isArray(response.data) ? response.data : response.data.results;
            const sinLeer = todas.filter(n => !n.leida);
            setNotificaciones(sinLeer);
            setNoLeidasCount(sinLeer.length);
          }}
          className="notificaciones-filtro-btn"
        >
          Sin leer
        </button>
        <button
          onClick={async () => {
            const token = localStorage.getItem('token');
            const response = await API.get('/notificaciones/', {
              headers: { Authorization: `Bearer ${token}` }
            });
            const todas = Array.isArray(response.data) ? response.data : response.data.results;
            const leidas = todas.filter(n => n.leida);
            setNotificaciones(leidas);
            setNoLeidasCount(0);
          }}
          className="notificaciones-filtro-btn"
        >
          Leídas
        </button>
      </div>
    </div>
  );
}

export default Notificaciones;