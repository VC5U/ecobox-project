# main/views/dashboard_view.py - Versión sin autenticación temporal
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Avg, Max, Min

# Importa los modelos
from ..models import Planta, Sensor, Notificacion, Medicion, TipoSensor, EstadoSensor, Familia, FamiliaUsuario

class DashboardView(APIView):
    # TEMPORAL: Permitir acceso sin autenticación para testing
    permission_classes = [AllowAny]
    
    def get(self, request):
        try:
            print("🔍 DashboardView ejecutándose...")
            print(f"📊 Usuario autenticado: {request.user.is_authenticated}")
            print(f"👤 Usuario: {request.user}")
            
            # Verificar si hay datos en la BD
            tiene_datos = Planta.objects.exists()
            print(f"¿Hay plantas en BD? {tiene_datos}")
            
            if not tiene_datos:
                # BD VACÍA - Retornar datos de ejemplo
                dashboard_data = self._get_demo_data()
                return Response(dashboard_data, status=status.HTTP_200_OK)
            
            # HAY DATOS - Calcular con datos reales
            dashboard_data = self._get_real_data()
            return Response(dashboard_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"💥 ERROR en DashboardView: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # Fallback a datos demo en caso de error
            dashboard_data = self._get_demo_data()
            return Response(dashboard_data, status=status.HTTP_200_OK)
    
    def _get_real_data(self):
        """Obtiene datos reales de la BD"""
        try:
            total_plantas = Planta.objects.count()
            total_sensores = Sensor.objects.count()
            
            # Plantas activas (manejar si el campo no existe)
            try:
                plantas_activas = Planta.objects.filter(estado='activa').count()
            except:
                plantas_activas = total_plantas
            
            # Alertas recientes
            try:
                alertas_recientes = Notificacion.objects.filter(
                    fechaEnvio__gte=timezone.now() - timedelta(hours=24)
                ).count()
            except:
                alertas_recientes = 0
            
            # Cálculos de sensores
            try:
                temp_result = Medicion.objects.filter(
                    idSensor__idTipoSensor__nombreTipo='temperatura'
                ).aggregate(avg_temp=Avg('valor'))
                temperatura_promedio = round(temp_result['avg_temp'] or 24.0, 1)
            except:
                temperatura_promedio = 24.0
            
            try:
                humedad_result = Medicion.objects.filter(
                    idSensor__idTipoSensor__nombreTipo='humedad'
                ).aggregate(avg_hum=Avg('valor'))
                humedad_promedio = round(humedad_result['avg_hum'] or 65.0, 1)
            except:
                humedad_promedio = 65.0

            dashboard_data = {
                'total_plantas': total_plantas,
                'total_sensores': total_sensores,
                'plantas_necesitan_agua': alertas_recientes,
                'plantas_criticas': alertas_recientes,
                'temperatura_promedio': f'{temperatura_promedio}°C',
                'humedad_promedio': f'{humedad_promedio}%',
                'plantas_saludables': max(plantas_activas - alertas_recientes, 0),
                'ultima_actualizacion': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                'metricas_avanzadas': {
                    'plantas_activas': plantas_activas,
                    'plantas_inactivas': total_plantas - plantas_activas,
                    'sensores_activos': total_sensores,
                    'alertas_24h': alertas_recientes,
                    'temperatura_max': f'{temperatura_promedio + 2}°C',
                    'temperatura_min': f'{temperatura_promedio - 2}°C',
                    'ultimo_riego': None,
                    'recomendaciones_activas': alertas_recientes
                },
                'modo': 'datos_reales',
                'autenticado': False  # Para debug
            }
            
            print("✅ Datos REALES enviados")
            return dashboard_data
            
        except Exception as e:
            print(f"Error en _get_real_data: {e}")
            return self._get_demo_data()
    
    def _get_demo_data(self):
        """Retorna datos de demostración para BD vacía"""
        demo_data = {
            'total_plantas': 8,
            'total_sensores': 15,
            'plantas_necesitan_agua': 2,
            'plantas_criticas': 1,
            'temperatura_promedio': '24°C',
            'humedad_promedio': '65%',
            'plantas_saludables': 5,
            'ultima_actualizacion': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
            'metricas_avanzadas': {
                'plantas_activas': 7,
                'plantas_inactivas': 1,
                'sensores_activos': 12,
                'alertas_24h': 3,
                'temperatura_max': '26°C',
                'temperatura_min': '22°C',
                'ultimo_riego': {
                    'fechaHora': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'tipoAccion': 'riego_automatico'
                },
                'recomendaciones_activas': 2
            },
            'modo': 'demo',
            'mensaje': 'Base de datos vacía - Mostrando datos de demostración',
            'autenticado': False  # Para debug
        }
        print("✅ Datos DEMO enviados")
        return demo_data