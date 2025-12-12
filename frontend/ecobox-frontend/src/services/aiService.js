/**
 * Servicio de IA para EcoBox
 * Cliente para consumir la API de IA del backend
 */
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class AIService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Configurar el token de autenticación
   */
  setAuthToken(token) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  /**
   * Obtener información general del servicio de IA
   */
  async getAIInfo(token) {
    try {
      if (token) this.setAuthToken(token);
      
      const response = await this.client.get('/ai/');
      return response.data;
    } catch (error) {
      console.error('Error getting AI info:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Error al obtener información de IA',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Procesar mensaje del usuario (Chatbot)
   */
  async chat(data, token) {
    try {
      if (token) this.setAuthToken(token);
      
      const response = await this.client.post('/ai/chat/', data);
      return response.data;
    } catch (error) {
      console.error('Error in chat:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Error al procesar el mensaje',
        data: {
          text: 'Lo siento, hubo un error procesando tu mensaje. Por favor, intenta de nuevo.',
          intent: 'error',
          confidence: 0,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Analizar salud de una planta
   */
  async analyzePlant(plantId, sensorData, token) {
    try {
      if (token) this.setAuthToken(token);
      
      const response = await this.client.post('/ai/analyze-plant/', {
        plant_id: plantId,
        sensor_data: sensorData
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing plant:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Error al analizar la planta',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtener recomendaciones diarias
   */
  async getRecommendations(token, params = {}) {
    try {
      if (token) this.setAuthToken(token);
      
      const queryParams = new URLSearchParams(params).toString();
      const url = `/ai/recommendations/${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Error al obtener recomendaciones',
        daily_recommendations: {
          total_plants: 0,
          high_priority: [],
          medium_priority: [],
          low_priority: [],
          summary: { needs_attention: 0 }
        },
        pending_predictions: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtener predicciones de IA
   */
  async getPredictions(token, filters = {}) {
    try {
      if (token) this.setAuthToken(token);
      
      const queryParams = new URLSearchParams(filters).toString();
      const url = `/ai/predictions/${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      console.error('Error getting predictions:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Error al obtener predicciones',
        predictions: [],
        total_count: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Marcar predicción como ejecutada
   */
  async executePrediction(predictionId, token, feedback = '') {
    try {
      if (token) this.setAuthToken(token);
      
      const response = await this.client.post('/ai/execute-prediction/', {
        prediction_id: predictionId,
        feedback: feedback
      });
      return response.data;
    } catch (error) {
      console.error('Error executing prediction:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Error al ejecutar la predicción',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Proporcionar feedback sobre una predicción
   */
  async provideFeedback(predictionId, feedbackType, token, comments = '') {
    try {
      if (token) this.setAuthToken(token);
      
      const response = await this.client.post('/ai/provide-feedback/', {
        prediction_id: predictionId,
        feedback_type: feedbackType,
        comments: comments
      });
      return response.data;
    } catch (error) {
      console.error('Error providing feedback:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Error al enviar feedback',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Verificar salud del servicio de IA
   */
  async checkHealth(token) {
    try {
      if (token) this.setAuthToken(token);
      
      const response = await this.client.get('/ai/health/');
      return response.data;
    } catch (error) {
      console.error('Error checking AI health:', error);
      return {
        status: 'error',
        health: {
          overall: 'unhealthy',
          error: error.message
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Simular análisis (para pruebas)
   */
  async simulateAnalysis(sensorData, token) {
    try {
      if (token) this.setAuthToken(token);
      
      const response = await this.client.post('/ai/simulate-analysis/', {
        sensor_data: sensorData
      });
      return response.data;
    } catch (error) {
      console.error('Error simulating analysis:', error);
      return {
        status: 'error',
        message: error.response?.data?.message || 'Error en simulación',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generar predicción de crecimiento
   */
  async predictGrowth(plantId, daysAhead = 30, token) {
    try {
      if (token) this.setAuthToken(token);
      
      // Nota: Este endpoint se implementará en el futuro
      // Por ahora, simulamos la respuesta
      return {
        status: 'success',
        plant_id: plantId,
        prediction_days: daysAhead,
        growth_prediction: {
          estimated_height_cm: 25 + (daysAhead * 0.1),
          estimated_leaves: 15 + (daysAhead * 0.05),
          health_trend: 'stable',
          confidence: 0.65
        },
        recommendations: [
          `Continuar con el régimen actual de riego por ${Math.min(daysAhead, 7)} días`,
          `Verificar nutrientes en ${Math.floor(daysAhead / 2)} días`
        ],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error predicting growth:', error);
      return {
        status: 'error',
        message: 'Función de predicción de crecimiento no disponible',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Detectar anomalías en lecturas de sensores
   */
  async detectAnomalies(sensorReadings, token) {
    try {
      if (token) this.setAuthToken(token);
      
      // Simulación hasta que se implemente el endpoint
      const anomalies = sensorReadings.filter(reading => {
        const value = reading.value;
        const type = reading.sensor_type;
        
        // Lógica simple de detección de anomalías
        if (type === 'soil_moisture' && (value < 10 || value > 90)) return true;
        if (type === 'temperature' && (value < 5 || value > 40)) return true;
        if (type === 'humidity' && (value < 15 || value > 95)) return true;
        return false;
      });
      
      return {
        status: 'success',
        timestamp: new Date().toISOString(),
        total_readings: sensorReadings.length,
        anomalies_detected: anomalies.length,
        anomalies: anomalies.map(reading => ({
          ...reading,
          issue: `Valor fuera de rango: ${reading.value}`,
          severity: 'high'
        })),
        summary: {
          by_severity: { high: anomalies.length, medium: 0, low: 0 },
          by_sensor: anomalies.reduce((acc, curr) => {
            acc[curr.sensor_type] = (acc[curr.sensor_type] || 0) + 1;
            return acc;
          }, {})
        }
      };
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return {
        status: 'error',
        message: 'Error detectando anomalías',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtener historial de conversación (si está disponible)
   */
  async getChatHistory(limit = 10, token) {
    try {
      if (token) this.setAuthToken(token);
      
      // Por ahora, devolvemos un historial vacío
      // Esto se implementará cuando el backend soporte historial
      return {
        status: 'success',
        history: [],
        limit: limit,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting chat history:', error);
      return {
        status: 'error',
        message: 'Historial no disponible',
        history: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Método de utilidad para formatear datos de sensores
   */
  formatSensorData(data) {
    return {
      soil_moisture: data.soilMoisture || data.humedad_suelo || 50,
      temperature: data.temperature || data.temperatura || 22,
      humidity: data.humidity || data.humedad_ambiental || 60,
      light: data.light || data.luz || 5000,
      plant_type: data.plantType || data.tipo_planta || 'default',
      age_days: data.ageDays || data.edad_dias || 30,
      last_watered: data.lastWatered || data.ultimo_riego,
      ...data
    };
  }

  /**
   * Método de utilidad para validar datos de entrada
   */
  validateChatInput(message, plantId) {
    const errors = [];
    
    if (!message || message.trim().length === 0) {
      errors.push('El mensaje no puede estar vacío');
    }
    
    if (message && message.length > 500) {
      errors.push('El mensaje no puede tener más de 500 caracteres');
    }
    
    if (plantId && (isNaN(plantId) || plantId < 1)) {
      errors.push('ID de planta inválido');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Método de utilidad para calcular estadísticas
   */
  calculateStatistics(predictions) {
    if (!predictions || predictions.length === 0) {
      return {
        total: 0,
        byPriority: { ALTA: 0, MEDIA: 0, BAJA: 0 },
        byStatus: { PENDIENTE: 0, EJECUTADA: 0, ACERTADA: 0, ERRONEA: 0 },
        byType: {},
        averageConfidence: 0
      };
    }
    
    const stats = {
      total: predictions.length,
      byPriority: { ALTA: 0, MEDIA: 0, BAJA: 0 },
      byStatus: { PENDIENTE: 0, EJECUTADA: 0, ACERTADA: 0, ERRONEA: 0 },
      byType: {},
      averageConfidence: 0
    };
    
    let totalConfidence = 0;
    
    predictions.forEach(pred => {
      // Conteo por prioridad
      if (stats.byPriority[pred.prioridad]) {
        stats.byPriority[pred.prioridad]++;
      }
      
      // Conteo por estado
      if (stats.byStatus[pred.estado]) {
        stats.byStatus[pred.estado]++;
      }
      
      // Conteo por tipo
      stats.byType[pred.tipo] = (stats.byType[pred.tipo] || 0) + 1;
      
      // Suma de confianza
      totalConfidence += parseFloat(pred.confianza) || 0;
    });
    
    stats.averageConfidence = totalConfidence / predictions.length;
    
    return stats;
  }
}

// Crear y exportar instancia única
const aiService = new AIService();

export default aiService;