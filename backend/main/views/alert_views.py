# backend/main/views/alert_views.py
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from main.models import AlertaPlanta, Planta
from django.db.models import Count, Q
import json

class AlertListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Obtener alertas del usuario"""
        try:
            # Filtrar por usuario y sus plantas
            plantas_usuario = Planta.objects.filter(usuario=request.user)
            alerts = AlertaPlanta.objects.filter(planta__in=plantas_usuario)
            
            # Filtros
            solo_no_leidas = request.GET.get('no_leidas', 'false') == 'true'
            if solo_no_leidas:
                alerts = alerts.filter(leida=False)
            
            # Solo no resueltas por defecto
            solo_no_resueltas = request.GET.get('no_resueltas', 'true') == 'true'
            if solo_no_resueltas:
                alerts = alerts.filter(resuelta=False)
            
            limit = int(request.GET.get('limit', 10))
            tipo = request.GET.get('tipo', None)
            if tipo:
                alerts = alerts.filter(tipo_alerta=tipo)
            
            # Ordenar y limitar
            alerts = alerts.order_by('-fecha_creacion')[:limit]
            
            # Convertir a dict
            alertas_data = [alert.to_dict() for alert in alerts]
            
            # Estadísticas
            total = alerts.count()
            no_leidas = alerts.filter(leida=False).count()
            criticas = alerts.filter(tipo_alerta=AlertaPlanta.CRITICA, leida=False).count()
            
            return Response({
                'status': 'success',
                'alertas': alertas_data,
                'total': total,
                'no_leidas': no_leidas,
                'criticas_pendientes': criticas,
                'ultima_actualizacion': timezone.now().isoformat()
            })
            
        except Exception as e:
            print(f"❌ Error en AlertListView: {e}")
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AlertMarkAsReadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Marcar alerta como leída"""
        try:
            alert_id = request.data.get('alert_id')
            
            if not alert_id:
                return Response({
                    'status': 'error',
                    'message': 'Se requiere alert_id'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar que la alerta pertenezca a una planta del usuario
            alert = AlertaPlanta.objects.get(
                id=alert_id,
                planta__usuario=request.user
            )
            alert.marcar_como_leida()
            
            return Response({
                'status': 'success',
                'message': 'Alerta marcada como leída'
            })
            
        except AlertaPlanta.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Alerta no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AlertMarkAsResolvedView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Marcar alerta como resuelta"""
        try:
            alert_id = request.data.get('alert_id')
            
            if not alert_id:
                return Response({
                    'status': 'error',
                    'message': 'Se requiere alert_id'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            alert = AlertaPlanta.objects.get(
                id=alert_id,
                planta__usuario=request.user
            )
            alert.resolver()
            
            return Response({
                'status': 'success',
                'message': 'Alerta marcada como resuelta'
            })
            
        except AlertaPlanta.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Alerta no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AlertCreateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Crear nueva alerta"""
        try:
            data = request.data
            
            # Validar datos requeridos
            required_fields = ['plant_id', 'mensaje', 'tipo_alerta']
            for field in required_fields:
                if field not in data:
                    return Response({
                        'status': 'error',
                        'message': f'Campo requerido: {field}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar que la planta pertenezca al usuario
            plant_id = data['plant_id']
            try:
                plant = Planta.objects.get(id=plant_id, usuario=request.user)
            except Planta.DoesNotExist:
                return Response({
                    'status': 'error',
                    'message': 'Planta no encontrada o no autorizada'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Crear alerta
            alert = AlertaPlanta.objects.create(
                planta=plant,
                usuario=request.user,
                mensaje=data['mensaje'],
                tipo_alerta=data['tipo_alerta'],
                datos_extra=data.get('datos_extra', {})
            )
            
            # Si se especifica sensor
            sensor_id = data.get('sensor_id')
            if sensor_id:
                try:
                    from main.models import Sensor
                    sensor = Sensor.objects.get(id=sensor_id, planta=plant)
                    alert.sensor_relacionado = sensor
                    alert.save()
                except:
                    pass
            
            return Response({
                'status': 'success',
                'message': 'Alerta creada',
                'alerta': alert.to_dict()
            })
            
        except Exception as e:
            print(f"❌ Error en AlertCreateView: {e}")
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AlertStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Estadísticas de alertas del usuario"""
        try:
            plantas_usuario = Planta.objects.filter(usuario=request.user)
            user_alerts = AlertaPlanta.objects.filter(planta__in=plantas_usuario)
            
            # Por tipo de alerta
            por_tipo = {
                'CRITICA': user_alerts.filter(tipo_alerta=AlertaPlanta.CRITICA, leida=False).count(),
                'ADVERTENCIA': user_alerts.filter(tipo_alerta=AlertaPlanta.ADVERTENCIA, leida=False).count(),
                'INFO': user_alerts.filter(tipo_alerta=AlertaPlanta.INFO, leida=False).count(),
                'EXITO': user_alerts.filter(tipo_alerta=AlertaPlanta.EXITO, leida=False).count(),
            }
            
            # Totales
            total = user_alerts.count()
            no_leidas = user_alerts.filter(leida=False).count()
            resueltas = user_alerts.filter(resuelta=True).count()
            
            # Últimas 24 horas
            desde = timezone.now() - timezone.timedelta(hours=24)
            ultimas_24h = user_alerts.filter(fecha_creacion__gte=desde).count()
            
            # Por planta
            alertas_por_planta = []
            for planta in plantas_usuario:
                count = user_alerts.filter(planta=planta, leida=False).count()
                if count > 0:
                    alertas_por_planta.append({
                        'planta': planta.nombrePersonalizado,
                        'cantidad': count
                    })
            
            return Response({
                'status': 'success',
                'estadisticas': {
                    'total': total,
                    'no_leidas': no_leidas,
                    'resueltas': resueltas,
                    'ultimas_24h': ultimas_24h,
                    'por_tipo': por_tipo,
                    'alertas_por_planta': alertas_por_planta,
                },
                'ultima_actualizacion': timezone.now().isoformat()
            })
            
        except Exception as e:
            print(f"❌ Error en AlertStatsView: {e}")
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AlertTestView(APIView):
    """Endpoint para crear alertas de prueba"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Obtener una planta del usuario
            planta = Planta.objects.filter(usuario=request.user).first()
            
            if not planta:
                return Response({
                    'status': 'error',
                    'message': 'No tienes plantas registradas'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Crear alerta de prueba
            alert = AlertaPlanta.objects.create(
                planta=planta,
                usuario=request.user,
                tipo_alerta=AlertaPlanta.CRITICA,
                mensaje='⚠️ Esta es una alerta de prueba. La humedad de la planta está muy baja (20%). Necesita riego inmediato.',
                datos_extra={'test': True, 'humedad': 20}
            )
            
            return Response({
                'status': 'success',
                'message': 'Alerta de prueba creada',
                'alerta': alert.to_dict()
            })
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)