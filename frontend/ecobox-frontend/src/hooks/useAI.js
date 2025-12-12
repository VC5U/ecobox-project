// frontend/src/hooks/useAI.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import aiService from '../services/aiService.js';

const useAI = () => {
  const { token } = useAuth();
  const [aiStatus, setAiStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Verificar estado del servicio IA
  const checkAIStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await aiService.checkHealth(token);
      setAiStatus(response);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error verificando estado de IA';
      setError(errorMsg);
      return { status: 'error', message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Enviar mensaje al chatbot
  const sendMessage = useCallback(async (message, plantId = null) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validar entrada
      const validation = aiService.validateChatInput(message, plantId);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      const response = await aiService.chat({ message, plant_id: plantId }, token);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error enviando mensaje';
      setError(errorMsg);
      return { 
        status: 'error', 
        message: errorMsg,
        data: {
          text: 'Lo siento, hubo un error. Por favor, intenta de nuevo.',
          intent: 'error',
          confidence: 0,
          timestamp: new Date().toISOString()
        }
      };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Obtener recomendaciones
  const getRecommendations = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await aiService.getRecommendations(token, filters);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error obteniendo recomendaciones';
      setError(errorMsg);
      return { status: 'error', message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Analizar planta
  const analyzePlant = useCallback(async (plantId, sensorData) => {
    setLoading(true);
    setError(null);
    
    try {
      const formattedData = aiService.formatSensorData(sensorData);
      const response = await aiService.analyzePlant(plantId, formattedData, token);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error analizando planta';
      setError(errorMsg);
      return { status: 'error', message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Marcar predicción como ejecutada
  const executePrediction = useCallback(async (predictionId, feedback = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await aiService.executePrediction(predictionId, token, feedback);
      return response;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error ejecutando predicción';
      setError(errorMsg);
      return { status: 'error', message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Efecto para verificar estado al montar
  useEffect(() => {
    checkAIStatus();
  }, [checkAIStatus]);

  return {
    // Estado
    aiStatus,
    loading,
    error,
    
    // Acciones
    checkAIStatus,
    sendMessage,
    getRecommendations,
    analyzePlant,
    executePrediction,
    
    // Métodos de utilidad
    formatSensorData: aiService.formatSensorData,
    validateChatInput: aiService.validateChatInput,
    calculateStatistics: aiService.calculateStatistics,
    
    // Reset error
    clearError: () => setError(null),
    
    // Verificaciones
    isAIOperational: aiStatus?.health?.overall === 'healthy',
    hasPendingPredictions: aiStatus?.statistics?.pending_predictions > 0
  };
};

export default useAI;