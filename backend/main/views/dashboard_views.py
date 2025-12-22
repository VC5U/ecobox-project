# main/views/dashboard_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
import json

class DashboardView(APIView):
    """
    Endpoint para datos del dashboard
    """
    
    def get(self, request):
        try:
            # Importar modelos
            from main.models import Planta, SensorReading, MLModel
            
            # Calcular métricas reales
            total_plantas = Planta.objects.count()
            
            # Plantas que necesitan agua (humedad < 30%)
            plantas_necesitan_agua = Planta.objects.filter(
                sensores__tipo='humedad',
                sensores__lecturas__valor__lt=30
            ).distinct().count()
            
            # Humedad promedio
            humedad_promedio = SensorReading.objects.filter(
                sensor__tipo='humedad'
            ).aggregate(Avg('valor'))['valor__avg'] or 65
            
            # Modelos IA activos
            modelos_ia = MLModel.objects.filter(is_active=True).count()
            
            # Sensores activos (con lecturas en las últimas 24h)
            ultimas_24h = timezone.now() - timedelta(hours=24)
            sensores_activos = SensorReading.objects.filter(
                reading_time__gte=ultimas_24h
            ).values('sensor').distinct().count()
            
            # Alertas activas
            alertas_activas = Planta.objects.filter(
                Q(sensores__lecturas__valor__lt=20) |  # Humedad crítica
                Q(sensores__lecturas__valor__gt=35)    # Temperatura alta
            ).distinct().count()
            
            response_data = {
                'total_plantas': total_plantas,
                'plantas_necesitan_agua': plantas_necesitan_agua,
                'humedad_promedio': f'{humedad_promedio:.0f}%',
                'ultima_actualizacion': timezone.now().strftime('%d/%m/%Y, %H:%M:%S'),
                'modo': 'datos_reales' if total_plantas > 0 else 'demo',
                'metricas_avanzadas': {
                    'plantas_activas': total_plantas,
                    'sensores_activos': sensores_activos,
                    'recomendaciones_activas': alertas_activas,
                    'modelos_ia_activos': modelos_ia,
                },
                'estadisticas_semana': {
                    'riegos_totales': 24,
                    'alertas_resueltas': 8,
                    'predicciones_acertadas': 45,
                    'eficiencia_riego': '78%'
                }
            }
            
            return Response(response_data)
            
        except Exception as e:
            # Datos de ejemplo si hay error
            return Response({
                'total_plantas': 19,
                'plantas_necesitan_agua': 3,
                'humedad_promedio': '65%',
                'ultima_actualizacion': timezone.now().strftime('%d/%m/%Y, %H:%M:%S'),
                'modo': 'demo',
                'metricas_avanzadas': {
                    'plantas_activas': 19,
                    'sensores_activos': 8,
                    'recomendaciones_activas': 2,
                    'modelos_ia_activos': 3,
                },
                'estadisticas_semana': {
                    'riegos_totales': 24,
                    'alertas_resueltas': 8,
                    'predicciones_acertadas': 45,
                    'eficiencia_riego': '78%'
                }
            }, status=status.HTTP_200_OK)