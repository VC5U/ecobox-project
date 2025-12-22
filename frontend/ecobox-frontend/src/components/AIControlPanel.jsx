// Si prefieres una versión más simple sin métricas del sistema
import React, { useState, useEffect } from 'react';
import API from '../services/api';
import {
  Card, CardContent, Typography, Button,
  CircularProgress, Alert, Chip,
  Grid, Box, LinearProgress, Snackbar,
  List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import { 
  PlayArrow, 
  Stop, 
  Psychology, 
  Refresh,
  CheckCircle,
  Error,
  Warning
} from '@mui/icons-material';

const AIControlPanel = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await API.get('ai/status/', {
        headers: { Authorization: `Token ${token}` }
      });
      setStatus(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching AI status:', error);
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await API.post('ai/control/', 
        { action }, 
        { headers: { Authorization: `Token ${token}` } }
      );

      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success'
      });

      setTimeout(fetchStatus, 2000);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Error en la acción',
        severity: 'error'
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Psychology sx={{ mr: 1 }} />
            Panel de Control IA - EcoBox
          </Typography>

          <Grid container spacing={2}>
            {/* Estado */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Estado del Sistema
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    {status?.monitoreo_activo ? 
                      <CheckCircle color="success" /> : 
                      <Error color="error" />
                    }
                  </ListItemIcon>
                  <ListItemText 
                    primary="Servicio de Monitoreo" 
                    secondary={status?.monitoreo_activo ? 'ACTIVO' : 'INACTIVO'} 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    {status?.scheduler_activo ? 
                      <CheckCircle color="success" /> : 
                      <Error color="error" />
                    }
                  </ListItemIcon>
                  <ListItemText 
                    primary="Programador de Riegos" 
                    secondary={status?.scheduler_activo ? 'ACTIVO' : 'INACTIVO'} 
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    {status?.plantas_con_modelo > 0 ? 
                      <CheckCircle color="success" /> : 
                      <Warning color="warning" />
                    }
                  </ListItemIcon>
                  <ListItemText 
                    primary="Modelos Entrenados" 
                    secondary={`${status?.plantas_con_modelo || 0} de ${status?.total_plantas || 0} plantas`} 
                  />
                </ListItem>
              </List>
            </Grid>

            {/* Controles */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Controles
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PlayArrow />}
                  onClick={() => handleAction('start')}
                  disabled={actionLoading || status?.monitoreo_activo}
                  fullWidth
                  size="large"
                >
                  Iniciar IA
                </Button>
                
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Stop />}
                  onClick={() => handleAction('stop')}
                  disabled={actionLoading || !status?.monitoreo_activo}
                  fullWidth
                  size="large"
                >
                  Detener IA
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={() => handleAction('train_all')}
                  disabled={actionLoading}
                  fullWidth
                >
                  Reentrenar Modelos
                </Button>
              </Box>

              {/* Indicador de carga */}
              {actionLoading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                  <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                    Procesando...
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>

          {/* Información adicional */}
          {!status?.monitoreo_activo && (
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                ¿Qué hace la IA de EcoBox?
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Analiza datos de sensores en tiempo real</li>
                <li>Predice cuándo necesitarán riego tus plantas</li>
                <li>Activa riegos automáticos cuando sea necesario</li>
                <li>Genera alertas inteligentes</li>
                <li>Aprende de los patrones de riego</li>
              </ul>
            </Alert>
          )}

          {/* Modelos entrenados */}
          {status?.modelos_entrenados && status.modelos_entrenados.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Modelos disponibles:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {status.modelos_entrenados.map((modelo, idx) => (
                  <Chip 
                    key={idx}
                    label={`Planta ${modelo.replace('planta_', '').replace('.joblib', '')}`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  );
};

export default AIControlPanel;