import React, { useState, useEffect } from 'react';
import { Box,  Paper,  Typography,  Card,  CardContent,  CardActions,  Button,  Chip,  LinearProgress,
  Grid,  List,  ListItem,  ListItemText,  ListItemIcon,  Divider,  IconButton,  Collapse,  Tooltip,
  Alert,  Skeleton} from '@mui/material';
import {
  WaterDrop as WaterIcon,  Thermostat as TempIcon,  Opacity as HumidityIcon,  WbSunny as LightIcon,
  PriorityHigh as PriorityHighIcon,  CheckCircle as CheckIcon,  Pending as PendingIcon,  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,  ExpandLess as ExpandLessIcon,  Refresh as RefreshIcon,  PlayArrow as ExecuteIcon,
  ThumbUp as ThumbUpIcon,  ThumbDown as ThumbDownIcon} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext.js';
import aiService from '../../services/aiService.js';

const RecommendationsPanel = ({ plantId, onSelectPrediction }) => {
  const { token } = useAuth();
  const [recommendations, setRecommendations] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPrediction, setExpandedPrediction] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState({});

  useEffect(() => {
    fetchRecommendations();
  }, [plantId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      // Obtener recomendaciones
      const recResponse = await aiService.getRecommendations(token);
      
      if (recResponse.status === 'success') {
        setRecommendations(recResponse.data);
        
        // Obtener predicciones
        const predResponse = await aiService.getPredictions(token, {
          status: 'PENDIENTE',
          limit: 10
        });
        
        if (predResponse.status === 'success') {
          setPredictions(predResponse.data.predictions || []);
        }
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecutePrediction = async (predictionId) => {
    try {
      const response = await aiService.executePrediction(predictionId, token);
      if (response.status === 'success') {
        // Actualizar lista
        fetchRecommendations();
      }
    } catch (error) {
      console.error('Error executing prediction:', error);
    }
  };

  const handleProvideFeedback = async (predictionId, feedbackType) => {
    setFeedbackLoading(prev => ({ ...prev, [predictionId]: true }));
    
    try {
      const response = await aiService.provideFeedback(
        predictionId,
        feedbackType,
        token
      );
      
      if (response.status === 'success') {
        // Actualizar lista
        fetchRecommendations();
      }
    } catch (error) {
      console.error('Error providing feedback:', error);
    } finally {
      setFeedbackLoading(prev => ({ ...prev, [predictionId]: false }));
    }
  };

  const togglePredictionDetails = (predictionId) => {
    setExpandedPrediction(expandedPrediction === predictionId ? null : predictionId);
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'ALTA':
        return <PriorityHighIcon color="error" />;
      case 'MEDIA':
        return <PriorityHighIcon color="warning" />;
      case 'BAJA':
        return <PriorityHighIcon color="success" />;
      default:
        return <PriorityHighIcon />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return <PendingIcon color="warning" />;
      case 'EJECUTADA':
        return <CheckIcon color="success" />;
      case 'ACERTADA':
        return <ThumbUpIcon color="success" />;
      case 'ERRONEA':
        return <ThumbDownIcon color="error" />;
      default:
        return <PendingIcon />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'RIEGO':
        return <WaterIcon />;
      case 'TEMPERATURA':
        return <TempIcon />;
      case 'HUMEDAD':
        return <HumidityIcon />;
      default:
        return <LightIcon />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'ALTA':
        return 'error';
      case 'MEDIA':
        return 'warning';
      case 'BAJA':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          <Skeleton width="60%" />
        </Typography>
        <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} />
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Recomendaciones de IA
        </Typography>
        <Tooltip title="Actualizar">
          <IconButton onClick={fetchRecommendations} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Resumen */}
      {recommendations && (
        <Card sx={{ mb: 3, bgcolor: 'background.default' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Resumen Diario
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {recommendations.user_plants_count || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Plantas
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {predictions.filter(p => p.prioridad === 'ALTA').length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Urgentes
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {predictions.filter(p => p.estado === 'EJECUTADA').length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Completadas
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {recommendations.daily_recommendations?.recommendations?.length > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  {recommendations.daily_recommendations.recommendations[0]}
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Predicciones pendientes */}
      <Typography variant="h6" gutterBottom>
        Predicciones Pendientes ({predictions.length})
      </Typography>

      {predictions.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No hay predicciones pendientes. ¡Todo está bajo control! 🎉
        </Alert>
      ) : (
        <List sx={{ mb: 3 }}>
          {predictions.map((prediction) => (
            <React.Fragment key={prediction.id}>
              <Card 
                variant="outlined" 
                sx={{ 
                  mb: 2,
                  borderLeft: 4,
                  borderLeftColor: getPriorityColor(prediction.prioridad) + '.main'
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {getTypeIcon(prediction.tipo)}
                        <Typography variant="subtitle1" component="div">
                          {prediction.planta_info?.nombre || `Planta ${prediction.planta}`}
                        </Typography>
                        <Chip 
                          icon={getPriorityIcon(prediction.prioridad)}
                          label={prediction.prioridad_display}
                          size="small"
                          color={getPriorityColor(prediction.prioridad)}
                        />
                        <Chip 
                          icon={getStatusIcon(prediction.estado)}
                          label={prediction.estado_display}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" paragraph>
                        {prediction.recomendacion}
                      </Typography>

                      {prediction.accion_sugerida && (
                        <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1 }}>
                          📋 <strong>Acción:</strong> {prediction.accion_sugerida}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip 
                          label={`${prediction.confianza}% confianza`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip 
                          label={formatDate(prediction.fecha_creacion)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>

                    <IconButton
                      size="small"
                      onClick={() => togglePredictionDetails(prediction.id)}
                      sx={{ ml: 1 }}
                    >
                      {expandedPrediction === prediction.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                </CardContent>

                {/* Detalles expandidos */}
                <Collapse in={expandedPrediction === prediction.id} timeout="auto" unmountOnExit>
                  <CardContent sx={{ pt: 0, pb: 1, bgcolor: 'action.hover' }}>
                    {prediction.razon && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Razón:
                        </Typography>
                        <Typography variant="body2">
                          {prediction.razon}
                        </Typography>
                      </Box>
                    )}

                    {prediction.metadata && Object.keys(prediction.metadata).length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                          Datos adicionales:
                        </Typography>
                        <Typography variant="body2" component="pre" sx={{ 
                          fontSize: '0.75rem',
                          bgcolor: 'background.paper',
                          p: 1,
                          borderRadius: 1,
                          overflow: 'auto',
                          maxHeight: 100
                        }}>
                          {JSON.stringify(prediction.metadata, null, 2)}
                        </Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 1 }} />

                    {/* Acciones */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {prediction.estado === 'PENDIENTE' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<ExecuteIcon />}
                            onClick={() => handleExecutePrediction(prediction.id)}
                            disabled={feedbackLoading[prediction.id]}
                          >
                            Marcar como ejecutada
                          </Button>

                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ThumbUpIcon />}
                            onClick={() => handleProvideFeedback(prediction.id, 'correct')}
                            disabled={feedbackLoading[prediction.id]}
                          >
                            Acertada
                          </Button>

                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<ThumbDownIcon />}
                            onClick={() => handleProvideFeedback(prediction.id, 'incorrect')}
                            disabled={feedbackLoading[prediction.id]}
                          >
                            Errónea
                          </Button>
                        </>
                      )}

                      {prediction.estado === 'EJECUTADA' && (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Ejecutada el: {formatDate(prediction.ejecutada_en)}
                          </Typography>
                          
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ThumbUpIcon />}
                            onClick={() => handleProvideFeedback(prediction.id, 'correct')}
                            disabled={feedbackLoading[prediction.id]}
                          >
                            Fue acertada
                          </Button>

                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<ThumbDownIcon />}
                            onClick={() => handleProvideFeedback(prediction.id, 'incorrect')}
                            disabled={feedbackLoading[prediction.id]}
                          >
                            Fue errónea
                          </Button>
                        </Box>
                      )}

                      {prediction.estado === 'ACERTADA' && (
                        <Chip 
                          icon={<ThumbUpIcon />}
                          label="Predicción acertada"
                          color="success"
                          variant="outlined"
                        />
                      )}

                      {prediction.estado === 'ERRONEA' && (
                        <Chip 
                          icon={<ThumbDownIcon />}
                          label="Predicción errónea"
                          color="error"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Collapse>
              </Card>
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Recomendaciones generales */}
      <Typography variant="h6" gutterBottom>
        Consejos Generales
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <WaterIcon color="primary" />
                <Typography variant="h6">Riego</Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Riega por la mañana temprano" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Usa agua a temperatura ambiente" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Evita encharcamientos" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TempIcon color="warning" />
                <Typography variant="h6">Temperatura</Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Mantén entre 18-25°C" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Evita corrientes de aire" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Protege del sol directo en verano" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Nota al pie */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          Las recomendaciones de IA se basan en datos históricos y condiciones actuales.
          Las predicciones tienen una confianza del {predictions.length > 0 ? predictions[0].confianza : '0'}% en promedio.
        </Typography>
      </Alert>
    </Paper>
  );
};

export default RecommendationsPanel;