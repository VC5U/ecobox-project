# backend/api/ai/views.py - VERSIÓN COMPLETA
"""
Vistas para la API de IA de EcoBox.
"""
import sys
import os
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
import logging

# Configurar logging
logger = logging.getLogger(__name__)

print("=" * 60)
print("🎬 INICIANDO AI VIEWS.PY - EcoBox AI Service")
print("=" * 60)

# Agregar el directorio backend al path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(os.path.dirname(current_dir))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
    print(f"📁 Agregado al path: {backend_dir}")

# Intentar importar servicios de IA
try:
    print("🔄 Importando servicios de IA...")
    from services import (
        process_user_message,
        analyze_plant_health,
        get_daily_recommendations,
        check_ai_status
    )
    AI_SERVICES_AVAILABLE = True
    print("✅ Servicios de IA importados correctamente")
    
except ImportError as e:
    print(f"❌ Error importando servicios: {e}")
    import traceback
    traceback.print_exc()
    AI_SERVICES_AVAILABLE = False
    
    # Funciones dummy como respaldo
    def process_user_message(message, user_id=None, plant_id=None):
        return {
            'text': f'🌿 Respuesta simulada a: "{message}"',
            'timestamp': timezone.now().isoformat()
        }
    
    def analyze_plant_health(plant_id, sensor_data=None):
        return {
            'health_score': 75,
            'timestamp': timezone.now().isoformat()
        }
    
    def get_daily_recommendations(plant_ids):
        return {
            'total_plants': len(plant_ids),
            'recommendations': ['Revisar plantas'],
            'timestamp': timezone.now().isoformat()
        }
    
    def check_ai_status():
        return {
            'status': 'simulated',
            'timestamp': timezone.now().isoformat()
        }

print(f"📊 AI_SERVICES_AVAILABLE: {AI_SERVICES_AVAILABLE}")
print("=" * 60)

# Importar modelos de Django
from main.models import PrediccionIA, Planta, FamiliaUsuario
from main.serializers import PrediccionIASerializer


class AIViewSet(viewsets.ViewSet):
    """
    ViewSet para endpoints de IA.
    
    Endpoints disponibles:
    - GET  /api/ai/              - Información general
    - POST /api/ai/chat/         - Chat con IA
    - GET  /api/ai/health/       - Estado del servicio
    - GET  /api/ai/recommendations/ - Recomendaciones diarias
    - GET  /api/ai/predictions/  - Predicciones de IA
    """
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """
        GET /api/ai/
        Obtiene información general del servicio de IA.
        """
        try:
            # Verificar autenticación
            if not request.user.is_authenticated:
                return Response({
                    'status': 'error',
                    'message': 'No autenticado',
                    'timestamp': timezone.now().isoformat()
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Obtener estado del servicio de IA
            ai_status = check_ai_status()
            
            # Obtener familias del usuario
            try:
                familias_usuario = FamiliaUsuario.objects.filter(
                    usuario=request.user,
                    activo=True
                ).values_list('familia', flat=True)
                
                # Contar plantas en esas familias
                user_plants_count = Planta.objects.filter(
                    familia__in=familias_usuario
                ).count()
                
            except Exception as e:
                logger.warning(f"Error contando plantas: {e}")
                user_plants_count = 0
            
            return Response({
                'status': 'success',
                'ai_service': {
                    'status': 'operational' if AI_SERVICES_AVAILABLE else 'maintenance',
                    'provider': ai_status.get('provider', 'unknown'),
                    'connected': ai_status.get('status') == 'operational'
                },
                'statistics': {
                    'total_predictions': PrediccionIA.objects.count(),
                    'pending_predictions': PrediccionIA.objects.filter(
                        estado=PrediccionIA.Estado.PENDIENTE
                    ).count(),
                    'user_plants_count': user_plants_count,
                    'user_families_count': len(familias_usuario) if 'familias_usuario' in locals() else 0
                },
                'endpoints': {
                    'chat': '/api/ai/chat/',
                    'analyze_plant': '/api/ai/analyze-plant/',
                    'recommendations': '/api/ai/recommendations/',
                    'predictions': '/api/ai/predictions/',
                    'health': '/api/ai/health/',
                    'execute_prediction': '/api/ai/execute-prediction/'
                },
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error en list endpoint: {e}", exc_info=True)
            return Response({
                'status': 'error',
                'message': str(e),
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def chat(self, request):
        """
        POST /api/ai/chat/
        Procesa un mensaje del usuario y devuelve respuesta del chatbot.
        
        Body:
        {
            "message": "texto del mensaje",
            "plant_id": 1  # opcional
        }
        """
        message = request.data.get('message', '').strip()
        plant_id = request.data.get('plant_id')
        
        if not message:
            return Response({
                'status': 'error',
                'message': 'El campo "message" es requerido',
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            print(f"💬 Chat request: '{message[:50]}...' (plant_id: {plant_id})")
            
            # Procesar mensaje con IA
            response = process_user_message(
                message=message,
                user_id=request.user.id,
                plant_id=plant_id
            )
            
            # Registrar la interacción si hay plant_id
            if plant_id:
                try:
                    # Verificar que el usuario tenga acceso a la planta
                    planta = Planta.objects.get(id=plant_id)
                    usuario_pertenece_familia = FamiliaUsuario.objects.filter(
                        familia=planta.familia,
                        usuario=request.user,
                        activo=True
                    ).exists()
                    
                    if usuario_pertenece_familia:
                        PrediccionIA.objects.create(
                            planta=planta,
                            tipo=PrediccionIA.TipoPrediccion.CHAT,
                            recomendacion=response.get('text', '')[:500],
                            confianza=response.get('confidence', 0) * 100,
                            prioridad=PrediccionIA.Prioridad.BAJA,
                            estado=PrediccionIA.Estado.EJECUTADA,
                            accion_sugerida='Respuesta de chatbot',
                            razon=f"Consulta: {message[:100]}...",
                            metadata={
                                'chat_response': response,
                                'user_message': message,
                                'user_id': request.user.id
                            }
                        )
                        print(f"📝 Interacción guardada para planta {plant_id}")
                    
                except Planta.DoesNotExist:
                    print(f"⚠️ Planta {plant_id} no encontrada")
                except Exception as db_error:
                    print(f"⚠️ Error guardando interacción: {db_error}")
            
            return Response({
                'status': 'success',
                'data': response,
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error en chat endpoint: {e}", exc_info=True)
            return Response({
                'status': 'error',
                'message': f'Error procesando mensaje: {str(e)}',
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def analyze_plant(self, request):
        """
        POST /api/ai/analyze-plant/
        Analiza los datos de una planta y genera recomendaciones.
        
        Body:
        {
            "plant_id": 1,
            "sensor_data": {}  # opcional
        }
        """
        plant_id = request.data.get('plant_id')
        sensor_data = request.data.get('sensor_data', {})
        
        if not plant_id:
            return Response({
                'status': 'error',
                'message': 'El campo "plant_id" es requerido',
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Obtener planta y verificar acceso
            planta = Planta.objects.get(id=plant_id)
            usuario_pertenece_familia = FamiliaUsuario.objects.filter(
                familia=planta.familia,
                usuario=request.user,
                activo=True
            ).exists()
            
            if not usuario_pertenece_familia:
                return Response({
                    'status': 'error',
                    'message': 'No tienes acceso a esta planta',
                    'timestamp': timezone.now().isoformat()
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Analizar planta
            analysis = analyze_plant_health(plant_id, sensor_data)
            
            return Response({
                'status': 'success',
                'plant_id': plant_id,
                'plant_name': planta.nombrePersonalizado,
                'analysis': analysis,
                'timestamp': timezone.now().isoformat()
            })
            
        except Planta.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Planta no encontrada',
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            logger.error(f"Error en analyze_plant: {e}")
            return Response({
                'status': 'error',
                'message': f'Error analizando planta: {str(e)}',
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def recommendations(self, request):
        """
        GET /api/ai/recommendations/
        Obtiene recomendaciones diarias para las plantas del usuario.
        """
        try:
            # Obtener familias del usuario
            familias_usuario = FamiliaUsuario.objects.filter(
                usuario=request.user,
                activo=True
            ).values_list('familia', flat=True)
            
            # Obtener plantas de esas familias
            plantas_usuario = Planta.objects.filter(familia__in=familias_usuario)
            plant_ids = list(plantas_usuario.values_list('id', flat=True))
            
            if not plant_ids:
                return Response({
                    'status': 'success',
                    'message': 'No hay plantas en tus familias',
                    'recommendations': [],
                    'timestamp': timezone.now().isoformat()
                })
            
            # Obtener recomendaciones
            recommendations = get_daily_recommendations(plant_ids)
            
            return Response({
                'status': 'success',
                'user_plants_count': len(plant_ids),
                'families_count': len(familias_usuario),
                'recommendations': recommendations,
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error en recommendations: {e}")
            return Response({
                'status': 'error',
                'message': f'Error obteniendo recomendaciones: {str(e)}',
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def predictions(self, request):
        """
        GET /api/ai/predictions/
        Obtiene las predicciones de IA para las plantas del usuario.
        
        Parámetros query:
        - status: Filtrar por estado (pendiente, ejecutada, etc.)
        - priority: Filtrar por prioridad (alta, media, baja)
        - limit: Limitar resultados (default: 20)
        - offset: Paginación (default: 0)
        """
        try:
            # Obtener parámetros
            status_filter = request.query_params.get('status')
            priority_filter = request.query_params.get('priority')
            limit = int(request.query_params.get('limit', 20))
            offset = int(request.query_params.get('offset', 0))
            
            # Obtener familias del usuario
            familias_usuario = FamiliaUsuario.objects.filter(
                usuario=request.user,
                activo=True
            ).values_list('familia', flat=True)
            
            # Construir queryset
            queryset = PrediccionIA.objects.filter(
                planta__familia__in=familias_usuario
            ).select_related('planta').order_by('-fecha_creacion')
            
            # Aplicar filtros
            if status_filter:
                queryset = queryset.filter(estado=status_filter.upper())
            
            if priority_filter:
                queryset = queryset.filter(prioridad=priority_filter.upper())
            
            # Paginación
            total_count = queryset.count()
            predictions = queryset[offset:offset + limit]
            
            serializer = PrediccionIASerializer(predictions, many=True)
            
            return Response({
                'status': 'success',
                'total_count': total_count,
                'filtered_count': len(predictions),
                'predictions': serializer.data,
                'pagination': {
                    'limit': limit,
                    'offset': offset,
                    'has_more': (offset + limit) < total_count
                },
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error en predictions: {e}")
            return Response({
                'status': 'error',
                'message': f'Error obteniendo predicciones: {str(e)}',
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def execute_prediction(self, request):
        """
        POST /api/ai/execute-prediction/
        Marca una predicción como ejecutada.
        
        Body:
        {
            "prediction_id": 1,
            "feedback": "texto opcional"
        }
        """
        prediction_id = request.data.get('prediction_id')
        
        if not prediction_id:
            return Response({
                'status': 'error',
                'message': 'El campo "prediction_id" es requerido',
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Obtener predicción
            prediccion = PrediccionIA.objects.get(id=prediction_id)
            
            # Verificar acceso
            usuario_pertenece_familia = FamiliaUsuario.objects.filter(
                familia=prediccion.planta.familia,
                usuario=request.user,
                activo=True
            ).exists()
            
            if not usuario_pertenece_familia:
                return Response({
                    'status': 'error',
                    'message': 'No tienes acceso a esta predicción',
                    'timestamp': timezone.now().isoformat()
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Marcar como ejecutada
            prediccion.marcar_ejecutada()
            
            # Agregar feedback si existe
            feedback = request.data.get('feedback')
            if feedback:
                metadata = prediccion.metadata or {}
                metadata['user_feedback'] = feedback
                metadata['feedback_timestamp'] = timezone.now().isoformat()
                prediccion.metadata = metadata
                prediccion.save()
            
            serializer = PrediccionIASerializer(prediccion)
            
            return Response({
                'status': 'success',
                'message': 'Predicción marcada como ejecutada',
                'prediction': serializer.data,
                'timestamp': timezone.now().isoformat()
            })
            
        except PrediccionIA.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Predicción no encontrada',
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            logger.error(f"Error en execute_prediction: {e}")
            return Response({
                'status': 'error',
                'message': f'Error ejecutando predicción: {str(e)}',
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def health(self, request):
        """
        GET /api/ai/health/
        Verifica el estado de salud del servicio de IA.
        """
        try:
            # Obtener estado de la base de datos
            db_status = {
                'connected': True,
                'predictions_count': PrediccionIA.objects.count(),
                'plants_count': Planta.objects.count(),
                'families_count': FamiliaUsuario.objects.values('familia').distinct().count()
            }
            
            # Obtener estado del servicio de IA
            ai_status = check_ai_status()
            
            # Determinar estado general
            overall_status = 'healthy' if (
                db_status['connected'] and 
                ai_status.get('status') in ['operational', 'simulated']
            ) else 'degraded'
            
            return Response({
                'status': 'success',
                'health': {
                    'overall': overall_status,
                    'ai_services': ai_status,
                    'database': db_status,
                    'models': {
                        'PrediccionIA': True,
                        'Planta': True,
                        'FamiliaUsuario': True
                    }
                },
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error en health endpoint: {e}", exc_info=True)
            return Response({
                'status': 'error',
                'health': {
                    'overall': 'unhealthy',
                    'error': str(e)
                },
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

print("✅ AIViewSet definido correctamente")
print("=" * 60)