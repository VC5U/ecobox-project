# backend/main/views/riego_views.py - VERSIÓN COMPLETA
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
from main.models import Riego, Planta, AlertaPlanta, Familia
from main.serializers import RiegoSerializer
from django.db.models import Count, Sum
from datetime import timedelta
import random
import time

class RiegoViewSet(viewsets.ModelViewSet):
    queryset = Riego.objects.all()
    serializer_class = RiegoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            familias_usuario = Familia.objects.filter(miembros__usuario=user)
            plantas_usuario = Planta.objects.filter(familia__in=familias_usuario)
            return Riego.objects.filter(planta__in=plantas_usuario)
        return Riego.objects.none()

class RiegoListView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Obtener riegos del usuario"""
        try:
            plantas_usuario = Planta.objects.filter(usuario=request.user)
            riegos = Riego.objects.filter(planta__in=plantas_usuario)
            
            # Filtros
            estado = request.GET.get('estado', None)
            if estado:
                riegos = riegos.filter(estado=estado)
            
            tipo = request.GET.get('tipo', None)
            if tipo:
                riegos = riegos.filter(tipo=tipo)
            
            planta_id = request.GET.get('planta_id', None)
            if planta_id:
                riegos = riegos.filter(planta_id=planta_id)
            
            # Últimos 7 días por defecto
            ultimos_dias = int(request.GET.get('dias', 7))
            desde = timezone.now() - timedelta(days=ultimos_dias)
            riegos = riegos.filter(fecha_creacion__gte=desde)
            
            limit = int(request.GET.get('limit', 20))
            riegos = riegos.order_by('-fecha_creacion')[:limit]
            
            # Convertir a dict
            riegos_data = [riego.to_dict() for riego in riegos]
            
            return Response({
                'status': 'success',
                'riegos': riegos_data,
                'total': len(riegos_data),
                'ultima_actualizacion': timezone.now().isoformat()
            })
            
        except Exception as e:
            print(f"❌ Error en RiegoListView: {e}")
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RiegoCreateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Crear nuevo riego (manual)"""
        try:
            data = request.data
            
            # Validar datos requeridos
            required_fields = ['planta_id']
            for field in required_fields:
                if field not in data:
                    return Response({
                        'status': 'error',
                        'message': f'Campo requerido: {field}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar que la planta pertenezca al usuario
            plant_id = data['planta_id']
            try:
                plant = Planta.objects.get(id=plant_id, usuario=request.user)
            except Planta.DoesNotExist:
                return Response({
                    'status': 'error',
                    'message': 'Planta no encontrada o no autorizada'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Crear riego
            riego = Riego.objects.create(
                planta=plant,
                usuario=request.user,
                tipo=data.get('tipo', 'MANUAL'),
                estado='PROGRAMADO',
                duracion_segundos=data.get('duracion_segundos', 30),
                cantidad_ml=data.get('cantidad_ml', 500),
                datos_extra=data.get('datos_extra', {})
            )
            
            # Si es programado
            if data.get('programado') and data.get('fecha_programada'):
                riego.fecha_programada = data['fecha_programada']
                riego.save()
            
            return Response({
                'status': 'success',
                'message': 'Riego creado',
                'riego': riego.to_dict()
            })
            
        except Exception as e:
            print(f"❌ Error en RiegoCreateView: {e}")
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RiegoActionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Ejecutar acción sobre un riego"""
        try:
            data = request.data
            riego_id = data.get('riego_id')
            accion = data.get('accion')
            
            if not riego_id or not accion:
                return Response({
                    'status': 'error',
                    'message': 'Se requieren riego_id y accion'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar que el riego pertenezca a una planta del usuario
            riego = Riego.objects.get(
                id=riego_id,
                planta__usuario=request.user
            )
            
            # Ejecutar acción
            if accion == 'iniciar':
                if riego.estado != 'PROGRAMADO':
                    return Response({
                        'status': 'error',
                        'message': 'Solo se pueden iniciar riegos programados'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Simular lectura de humedad
                humedad_inicial = random.uniform(20, 80)
                riego.humedad_inicial = humedad_inicial
                riego.iniciar()
                
                # Crear alerta informativa
                AlertaPlanta.objects.create(
                    planta=riego.planta,
                    usuario=request.user,
                    tipo_alerta=AlertaPlanta.INFO,
                    mensaje=f'Riego manual iniciado para {riego.planta.nombrePersonalizado}. Duración: {riego.duracion_segundos}s',
                    datos_extra={'riego_id': riego.id}
                )
                
            elif accion == 'completar':
                if riego.estado != 'EN_CURSO':
                    return Response({
                        'status': 'error',
                        'message': 'Solo se pueden completar riegos en curso'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Simular aumento de humedad
                humedad_final = (riego.humedad_inicial or 50) + random.uniform(10, 30)
                riego.humedad_final = min(100, humedad_final)
                riego.completar()
                
                # Crear alerta de éxito
                AlertaPlanta.objects.create(
                    planta=riego.planta,
                    usuario=request.user,
                    tipo_alerta=AlertaPlanta.EXITO,
                    mensaje=f'Riego completado para {riego.planta.nombrePersonalizado}. Humedad aumentó de {riego.humedad_inicial:.1f}% a {riego.humedad_final:.1f}%',
                    datos_extra={'riego_id': riego.id}
                )
                
            elif accion == 'cancelar':
                riego.cancelar()
                
                # Crear alerta informativa
                AlertaPlanta.objects.create(
                    planta=riego.planta,
                    usuario=request.user,
                    tipo_alerta=AlertaPlanta.INFO,
                    mensaje=f'Riego cancelado para {riego.planta.nombrePersonalizado}',
                    datos_extra={'riego_id': riego.id}
                )
                
            else:
                return Response({
                    'status': 'error',
                    'message': f'Acción no válida: {accion}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'status': 'success',
                'message': f'Riego {accion}',
                'riego': riego.to_dict()
            })
            
        except Riego.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Riego no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"❌ Error en RiegoActionView: {e}")
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RiegoStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Estadísticas de riegos"""
        try:
            plantas_usuario = Planta.objects.filter(usuario=request.user)
            riegos = Riego.objects.filter(planta__in=plantas_usuario)
            
            # Últimos 7 días
            desde = timezone.now() - timedelta(days=7)
            riegos_7dias = riegos.filter(fecha_creacion__gte=desde)
            
            # Totales
            total_riegos = riegos_7dias.count()
            riegos_completados = riegos_7dias.filter(estado='COMPLETADO').count()
            riegos_manuales = riegos_7dias.filter(tipo='MANUAL').count()
            riegos_automaticos = riegos_7dias.filter(tipo='AUTOMATICO').count()
            
            # Por día de la semana
            riegos_por_dia = {}
            for i in range(7):
                dia = timezone.now() - timedelta(days=i)
                count = riegos.filter(
                    fecha_creacion__date=dia.date()
                ).count()
                nombre_dia = dia.strftime('%A')
                riegos_por_dia[nombre_dia] = count
            
            # Por planta
            riegos_por_planta = []
            for planta in plantas_usuario[:5]:
                count = riegos.filter(planta=planta).count()
                if count > 0:
                    riegos_por_planta.append({
                        'planta': planta.nombrePersonalizado,
                        'cantidad': count
                    })
            
            # Eficiencia
            riegos_programados = riegos_7dias.filter(estado__in=['PROGRAMADO', 'EN_CURSO', 'COMPLETADO']).count()
            eficiencia = (riegos_completados / riegos_programados * 100) if riegos_programados > 0 else 0
            
            return Response({
                'status': 'success',
                'estadisticas': {
                    'total_7dias': total_riegos,
                    'completados': riegos_completados,
                    'manuales': riegos_manuales,
                    'automaticos': riegos_automaticos,
                    'eficiencia': round(eficiencia, 1),
                    'riegos_por_dia': riegos_por_dia,
                    'top_plantas': riegos_por_planta,
                },
                'ultima_actualizacion': timezone.now().isoformat()
            })
            
        except Exception as e:
            print(f"❌ Error en RiegoStatsView: {e}")
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RiegoQuickActionView(APIView):
    """Riego rápido con un clic"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            plant_id = request.data.get('planta_id')
            
            if not plant_id:
                return Response({
                    'status': 'error',
                    'message': 'Se requiere planta_id'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar planta
            try:
                plant = Planta.objects.get(id=plant_id, usuario=request.user)
            except Planta.DoesNotExist:
                return Response({
                    'status': 'error',
                    'message': 'Planta no encontrada'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Crear y ejecutar riego inmediato
            riego = Riego.objects.create(
                planta=plant,
                usuario=request.user,
                tipo='MANUAL',
                estado='PROGRAMADO',
                duracion_segundos=30,
                cantidad_ml=500
            )
            
            # Iniciar inmediatamente
            humedad_inicial = random.uniform(20, 80)
            riego.humedad_inicial = humedad_inicial
            riego.iniciar()
            
            # Pequeña pausa para simular el riego
            time.sleep(1)
            
            # Completar automáticamente después de simular
            humedad_final = humedad_inicial + random.uniform(15, 25)
            riego.humedad_final = min(100, humedad_final)
            riego.completar()
            
            # Crear alerta de éxito
            AlertaPlanta.objects.create(
                planta=plant,
                usuario=request.user,
                tipo_alerta=AlertaPlanta.EXITO,
                mensaje=f'✅ Riego rápido completado para {plant.nombrePersonalizado}. Humedad aumentó de {humedad_inicial:.1f}% a {riego.humedad_final:.1f}%',
                datos_extra={'riego_id': riego.id, 'tipo': 'riego_rapido'}
            )
            
            return Response({
                'status': 'success',
                'message': f'Riego rápido completado para {plant.nombrePersonalizado}',
                'riego': riego.to_dict()
            })
            
        except Exception as e:
            print(f"❌ Error en RiegoQuickActionView: {e}")
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RiegoScheduleView(APIView):
    """Programar riego automático"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            data = request.data
            plant_id = data.get('planta_id')
            fecha_programada = data.get('fecha_programada')
            
            if not plant_id or not fecha_programada:
                return Response({
                    'status': 'error',
                    'message': 'Se requieren planta_id y fecha_programada'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar planta
            try:
                plant = Planta.objects.get(id=plant_id, usuario=request.user)
            except Planta.DoesNotExist:
                return Response({
                    'status': 'error',
                    'message': 'Planta no encontrada'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Crear riego programado
            riego = Riego.objects.create(
                planta=plant,
                usuario=request.user,
                tipo='AUTOMATICO',
                estado='PROGRAMADO',
                fecha_programada=fecha_programada,
                duracion_segundos=data.get('duracion_segundos', 30),
                cantidad_ml=data.get('cantidad_ml', 500),
                datos_extra={
                    'programado': True,
                    'recurrencia': data.get('recurrencia', 'una_vez'),
                    'dias_semana': data.get('dias_semana', [])
                }
            )
            
            # Crear alerta informativa
            AlertaPlanta.objects.create(
                planta=plant,
                usuario=request.user,
                tipo_alerta=AlertaPlanta.INFO,
                mensaje=f'⏰ Riego programado para {plant.nombrePersonalizado} el {fecha_programada}',
                datos_extra={'riego_id': riego.id, 'tipo': 'riego_programado'}
            )
            
            return Response({
                'status': 'success',
                'message': f'Riego programado para {plant.nombrePersonalizado}',
                'riego': riego.to_dict()
            })
            
        except Exception as e:
            print(f"❌ Error en RiegoScheduleView: {e}")
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)