# backend/services/ai_service.py
"""
Servicio principal de IA para EcoBox.
Integra chatbot, recomendaciones y análisis predictivo.
"""
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from django.utils import timezone
from django.db import transaction

# Importar modelos
from ..models import (
    Planta, Medicion, Configuracion, 
    PrediccionIA, Riego, Sensor, Usuario
)

# Importar motores de IA
from .chatbot_engine import ChatbotEngine
from .recommendation_engine import RecommendationEngine

# Configurar logging
logger = logging.getLogger(__name__)

class EcoBoxAI:
    """
    Clase principal que orquesta todas las capacidades de IA.
    """
    
    @staticmethod
    def process_chat_message(user_id: int, plant_id: int, message: str) -> Dict[str, Any]:
        """
        Procesa un mensaje del chatbot y genera respuesta.
        
        Args:
            user_id: ID del usuario autenticado
            plant_id: ID de la planta sobre la que se consulta
            message: Mensaje del usuario
            
        Returns:
            Dict con respuesta estructurada
        """
        try:
            logger.info(f"Procesando mensaje de usuario {user_id} para planta {plant_id}")
            
            # 1. Validar permisos y obtener planta
            planta = EcoBoxAI._get_user_plant(user_id, plant_id)
            if not planta:
                return {
                    'success': False,
                    'error': 'Planta no encontrada o sin permisos',
                    'fallback_response': {
                        'title': '⚠️ Planta no encontrada',
                        'content': 'No tengo acceso a esta planta. Verifica que exista y tengas permisos.'
                    }
                }
            
            # 2. Obtener datos contextuales
            context = EcoBoxAI._gather_plant_context(planta)
            context['user_id'] = user_id
            context['plant_name'] = planta.nombre
            
            # 3. Procesar mensaje con ChatbotEngine
            intent, confidence = ChatbotEngine.detect_intent(message)
            plant_info = ChatbotEngine.extract_plant_info(message)
            
            # 4. Generar respuesta
            response = ChatbotEngine.generate_response(intent, context)
            
            # 5. Guardar en base de datos
            with transaction.atomic():
                prediccion = PrediccionIA.objects.create(
                    planta=planta,
                    tipo=PrediccionIA.TipoPrediccion.CHAT,
                    recomendacion=message,
                    confianza=confidence * 100,  # Convertir a porcentaje
                    accion_sugerida=response.get('title', ''),
                    razon=f"Usuario preguntó: {message} | Intención: {intent}",
                    metadata={
                        'intent': intent,
                        'confidence': confidence,
                        'plant_info': plant_info,
                        'user_message': message,
                        'response_data': response
                    }
                )
                
                logger.info(f"Predicción de chat guardada: {prediccion.id}")
            
            # 6. Preparar respuesta final
            result = {
                'success': True,
                'intent': intent,
                'confidence': confidence,
                'response': response,
                'timestamp': timezone.now().isoformat(),
                'plant_id': plant_id,
                'plant_name': planta.nombre,
                'prediction_id': prediccion.id if 'prediccion' in locals() else None
            }
            
            # 7. Si es consulta de estado, agregar recomendaciones
            if intent in ['estado', 'recomendacion']:
                recommendations = RecommendationEngine.analyze_plant(planta)
                if recommendations:
                    result['recommendations'] = recommendations[:3]  # Limitar a 3
            
            return result
            
        except Exception as e:
            logger.error(f"Error procesando mensaje de chat: {str(e)}", exc_info=True)
            
            return {
                'success': False,
                'error': str(e),
                'fallback_response': {
                    'title': '⚠️ Error del sistema',
                    'content': f'Lo siento, hubo un error procesando tu mensaje. Detalle: {str(e)[:100]}...'
                }
            }
    
    @staticmethod
    def analyze_plant(plant_id: int, user_id: Optional[int] = None) -> List[Dict]:
        """
        Analiza una planta y genera recomendaciones proactivas.
        
        Args:
            plant_id: ID de la planta a analizar
            user_id: ID del usuario (opcional, para validación)
            
        Returns:
            Lista de recomendaciones generadas
        """
        try:
            # Validar permisos si se proporciona user_id
            if user_id:
                planta = EcoBoxAI._get_user_plant(user_id, plant_id)
            else:
                try:
                    planta = Planta.objects.get(id=plant_id)
                except Planta.DoesNotExist:
                    return []
            
            if not planta:
                return []
            
            # Generar recomendaciones
            recommendations = RecommendationEngine.analyze_plant(planta)
            
            # Guardar recomendaciones importantes en BD
            saved_predictions = []
            for rec in recommendations:
                if rec['priority'] in ['ALTA', 'MEDIA']:
                    prediccion = PrediccionIA.objects.create(
                        planta=planta,
                        tipo=rec['type'],
                        prioridad=rec['priority'],
                        recomendacion=rec['message'],
                        confianza=rec.get('confidence', 0.7) * 100,
                        accion_sugerida=rec.get('suggested_action', ''),
                        razon=rec.get('reason', ''),
                        metadata=rec.get('metadata', {})
                    )
                    saved_predictions.append(prediccion.id)
            
            if saved_predictions:
                logger.info(f"Guardadas {len(saved_predictions)} predicciones para planta {plant_id}")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error analizando planta {plant_id}: {str(e)}")
            return []
    
    @staticmethod
    def get_active_recommendations(user_id: int, limit: int = 10) -> List[Dict]:
        """
        Obtiene recomendaciones activas para un usuario.
        
        Args:
            user_id: ID del usuario
            limit: Límite de resultados
            
        Returns:
            Lista de recomendaciones
        """
        try:
            # Obtener plantas del usuario
            user_plants = Planta.objects.filter(familia__usuarios__id=user_id)
            
            # Obtener predicciones pendientes o de alta prioridad
            predicciones = PrediccionIA.objects.filter(
                planta__in=user_plants,
                estado__in=['PENDIENTE', 'EJECUTADA']  # Mostrar también ejecutadas recientes
            ).select_related('planta').order_by('-prioridad', '-fecha_creacion')[:limit]
            
            result = []
            for pred in predicciones:
                result.append({
                    'id': pred.id,
                    'plant_id': pred.planta.id,
                    'plant_name': pred.planta.nombre,
                    'type': pred.tipo,
                    'type_display': pred.get_tipo_display(),
                    'message': pred.recomendacion,
                    'priority': pred.prioridad,
                    'priority_display': pred.get_prioridad_display(),
                    'suggested_action': pred.accion_sugerida,
                    'reason': pred.razon,
                    'confidence': float(pred.confianza),
                    'status': pred.estado,
                    'status_display': pred.get_estado_display(),
                    'created_at': pred.fecha_creacion.isoformat(),
                    'is_urgent': pred.prioridad == 'ALTA',
                    'needs_action': pred.estado == 'PENDIENTE'
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error obteniendo recomendaciones: {str(e)}")
            return []
    
    @staticmethod
    def _get_user_plant(user_id: int, plant_id: int) -> Optional[Planta]:
        """Obtiene una planta verificando que pertenece al usuario."""
        try:
            return Planta.objects.get(
                id=plant_id,
                familia__usuarios__id=user_id
            )
        except Planta.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error obteniendo planta: {str(e)}")
            return None
    
    @staticmethod
    def _gather_plant_context(planta) -> Dict:
        """Recopila datos contextuales de una planta."""
        context = {
            'planta': planta,
            'ultima_medicion': None,
            'config_ideal': None,
            'recent_measurements': [],
            'last_watering': None
        }
        
        try:
            # Última medición
            context['ultima_medicion'] = Medicion.objects.filter(
                sensor__planta=planta
            ).order_by('-fechaHora').first()
            
            # Configuración ideal
            if planta.tipoPlanta:
                context['config_ideal'] = Configuracion.objects.filter(
                    tipoPlanta=planta.tipoPlanta
                ).first()
            
            # Último riego
            context['last_watering'] = Riego.objects.filter(
                planta=planta
            ).order_by('-fechaHora').first()
            
        except Exception as e:
            logger.warning(f"Error recopilando contexto para planta {planta.id}: {str(e)}")
        
        return context
    
    @staticmethod
    def mark_recommendation_executed(prediction_id: int, user_id: int) -> bool:
        """
        Marca una recomendación como ejecutada.
        
        Args:
            prediction_id: ID de la predicción
            user_id: ID del usuario
            
        Returns:
            True si se marcó correctamente
        """
        try:
            prediccion = PrediccionIA.objects.get(id=prediction_id)
            
            # Verificar que la planta pertenece al usuario
            if not Planta.objects.filter(
                id=prediccion.planta.id,
                familia__usuarios__id=user_id
            ).exists():
                return False
            
            prediccion.marcar_ejecutada()
            logger.info(f"Predicción {prediction_id} marcada como ejecutada por usuario {user_id}")
            return True
            
        except PrediccionIA.DoesNotExist:
            logger.warning(f"Predicción {prediction_id} no encontrada")
            return False
        except Exception as e:
            logger.error(f"Error marcando predicción como ejecutada: {str(e)}")
            return False