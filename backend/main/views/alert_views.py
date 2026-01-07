# backend/main/views/alert_views.py - VERSIÓN CORREGIDA
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from main.models import Planta, Familia, FamiliaUsuario, Sensor
from main.models.AlertaPlanta import AlertaPlanta
from django.db.models import Q
import json
from django.conf import settings


class AlertListView(APIView):
    permission_classes = [IsAuthenticated]  
    
    def get(self, request):
        """Obtener alertas de las plantas de las familias del usuario"""
        try:
            print(f"🔍 AlertListView - Usuario: {request.user.email}")
            
            # 1. Obtener las familias a las que pertenece el usuario
            miembros_familias = FamiliaUsuario.objects.filter(
                usuario=request.user,
                activo=True
            ).select_related('familia')
            
            print(f"👨‍👩‍👧‍👦 Familias activas del usuario: {miembros_familias.count()}")
            
            if miembros_familias.count() == 0:
                print("⚠️ Usuario no pertenece a ninguna familia activa")
                return Response({
                    'status': 'success',
                    'alertas': [],
                    'total': 0,
                    'no_leidas': 0,
                    'criticas_pendientes': 0,
                    'ultima_actualizacion': timezone.now().isoformat(),
                    'message': 'No perteneces a ninguna familia activa'
                })
            
            # Obtener IDs de las familias
            familias_ids = miembros_familias.values_list('familia_id', flat=True)
            print(f"🏠 IDs de familias: {list(familias_ids)}")
            
            # 2. Obtener todas las plantas de estas familias
            plantas_familia = Planta.objects.filter(familia_id__in=familias_ids)
            print(f"🌱 Plantas de las familias: {plantas_familia.count()}")
            
            if plantas_familia.count() == 0:
                print("⚠️ No hay plantas en las familias del usuario")
                return Response({
                    'status': 'success',
                    'alertas': [],
                    'total': 0,
                    'no_leidas': 0,
                    'criticas_pendientes': 0,
                    'ultima_actualizacion': timezone.now().isoformat(),
                    'message': 'No hay plantas en tus familias'
                })
            
            # 3. Obtener alertas de esas plantas
            alerts = AlertaPlanta.objects.filter(planta__in=plantas_familia)
            print(f"🔔 Alertas totales de las familias: {alerts.count()}")
            
            # 4. Aplicar filtros de query parameters
            # Solo no resueltas (por defecto true)
            solo_no_resueltas = request.GET.get('no_resueltas', 'true').lower() == 'true'
            if solo_no_resueltas:
                alerts = alerts.filter(resuelta=False)
                print(f"🔍 Solo no resueltas: {alerts.count()}")
            
            # Solo no leídas
            solo_no_leidas = request.GET.get('no_leidas', 'false').lower() == 'true'
            if solo_no_leidas:
                alerts = alerts.filter(leida=False)
                print(f"📖 Solo no leídas: {alerts.count()}")
            
            # Filtrar por tipo de alerta
            tipo = request.GET.get('tipo', None)
            if tipo:
                alerts = alerts.filter(tipo_alerta=tipo.upper())
                print(f"🎯 Filtro por tipo '{tipo}': {alerts.count()}")
            
            # Filtrar por planta específica
            planta_id = request.GET.get('planta_id', None)
            if planta_id:
                try:
                    planta_id_int = int(planta_id)
                    alerts = alerts.filter(planta_id=planta_id_int)
                    print(f"🌿 Filtro por planta ID {planta_id}: {alerts.count()}")
                except ValueError:
                    print(f"⚠️ ID de planta inválido: {planta_id}")
            
            # 5. Ordenar por prioridad y fecha
            from django.db.models import Case, When, Value, IntegerField
            alerts = alerts.annotate(
                prioridad_num=Case(
                    When(tipo_alerta=AlertaPlanta.CRITICA, then=Value(1)),
                    When(tipo_alerta=AlertaPlanta.ADVERTENCIA, then=Value(2)),
                    When(tipo_alerta=AlertaPlanta.INFO, then=Value(3)),
                    When(tipo_alerta=AlertaPlanta.EXITO, then=Value(4)),
                    default=Value(5),
                    output_field=IntegerField(),
                )
            )
            
            # Orden: críticas primero, luego por fecha más reciente
            alerts = alerts.order_by('prioridad_num', '-fecha_creacion')
            
            # 6. Aplicar límite
            try:
                limit = int(request.GET.get('limit', 10))
            except ValueError:
                limit = 10
            
            if limit > 0:
                alerts = alerts[:limit]
            
            # 7. Preparar datos para respuesta
            alertas_data = []
            for alert in alerts:
                try:
                    data = alert.to_dict() if hasattr(alert, 'to_dict') else {}
                    
                    # Si to_dict() no devuelve todos los campos, completar
                    if not data:
                        data = {
                            'id': alert.id,
                            'titulo': f"Alerta en {alert.planta.nombrePersonalizado if alert.planta else 'Planta'}",
                            'mensaje': alert.mensaje,
                            'tipo': alert.tipo_alerta,
                            'leida': alert.leida,
                            'resuelta': alert.resuelta,
                            'creada_en': alert.fecha_creacion.isoformat() if alert.fecha_creacion else timezone.now().isoformat(),
                            'plant_id': alert.planta.id if alert.planta else None,
                            'plant_nombre': alert.planta.nombrePersonalizado if alert.planta else 'Planta',
                        }
                    
                    # Añadir información de familia
                    try:
                        if alert.planta and alert.planta.familia:
                            familia_nombre = alert.planta.familia.nombre
                            
                            # Verificar si el usuario es administrador de esta familia
                            es_admin = FamiliaUsuario.objects.filter(
                                familia=alert.planta.familia,
                                usuario=request.user,
                                activo=True,
                                es_administrador=True
                            ).exists()
                            
                            # CORREGIR: usar 'familia_id' no 'famiilia_id'
                            data.update({
                                'familia_id': alert.planta.familia.id,
                                'familia_nombre': familia_nombre,
                                'es_administrador': es_admin,
                                'planta_foto': alert.planta.foto.url if hasattr(alert.planta, 'foto') and alert.planta.foto else None,
                            })
                    except Exception as e:
                        print(f"⚠️ Error obteniendo info de familia para alerta {alert.id}: {e}")
                        data['familia_nombre'] = 'Familia desconocida'
                    
                    alertas_data.append(data)
                    
                except Exception as e:
                    print(f"⚠️ Error procesando alerta {alert.id}: {e}")
                    # Crear respuesta mínima
                    alertas_data.append({
                        'id': alert.id,
                        'titulo': 'Alerta del sistema',
                        'mensaje': getattr(alert, 'mensaje', 'Mensaje no disponible'),
                        'tipo': getattr(alert, 'tipo_alerta', 'INFO'),
                        'leida': getattr(alert, 'leida', False),
                        'resuelta': getattr(alert, 'resuelta', False),
                        'creada_en': timezone.now().isoformat(),
                        'plant_nombre': getattr(alert.planta, 'nombrePersonalizado', 'Planta') if alert.planta else 'Planta',
                        'icono': '📢',
                        'color': '#6c757d',
                    })
            
            # 8. Calcular estadísticas
            no_leidas_count = sum(1 for a in alertas_data if not a.get('leida', False))
            criticas_count = sum(1 for a in alertas_data if a.get('tipo') == 'CRITICA' and not a.get('leida', False))
            
            print(f"📤 Enviando {len(alertas_data)} alertas")
            print(f"📊 Estadísticas: {no_leidas_count} no leídas, {criticas_count} críticas")
            
            # 9. Preparar respuesta
            response_data = {
                'status': 'success',
                'alertas': alertas_data,
                'total': len(alertas_data),
                'no_leidas': no_leidas_count,
                'criticas_pendientes': criticas_count,
                'ultima_actualizacion': timezone.now().isoformat()
            }
            
            # Solo en desarrollo: añadir metadata de debug
            if hasattr(settings, 'DEBUG') and settings.DEBUG:
                response_data['debug'] = {
                    'usuario': request.user.email,
                    'familias_count': miembros_familias.count(),
                    'plantas_count': plantas_familia.count(),
                    'alertas_count': alerts.count(),
                    'filtros': {
                        'no_resueltas': solo_no_resueltas,
                        'no_leidas': solo_no_leidas,
                        'tipo': tipo,
                        'planta_id': planta_id,
                        'limit': limit
                    }
                }
            
            return Response(response_data)
            
        except Exception as e:
            print(f"❌ Error CRÍTICO en AlertListView: {e}")
            import traceback
            traceback.print_exc()
            
            # Respuesta segura que no rompa el frontend
            return Response({
                'status': 'success',
                'alertas': [],
                'total': 0,
                'no_leidas': 0,
                'criticas_pendientes': 0,
                'ultima_actualizacion': timezone.now().isoformat(),
                'message': 'Sistema de alertas temporalmente no disponible'
            })


class AlertMarkAsReadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Marcar alerta como leída - Solo alertas de mis familias"""
        try:
            alert_id = request.data.get('alert_id')
            
            if not alert_id:
                return Response({
                    'status': 'error',
                    'message': 'Se requiere alert_id'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 1. Obtener familias del usuario
            familias_ids = FamiliaUsuario.objects.filter(
                usuario=request.user,
                activo=True
            ).values_list('familia_id', flat=True)
            
            # 2. Buscar alerta en plantas de esas familias
            alert = AlertaPlanta.objects.get(
                id=alert_id,
                planta__familia_id__in=familias_ids
            )
            
            # 3. Marcar como leída
            if hasattr(alert, 'marcar_como_leida'):
                alert.marcar_como_leida()
            else:
                alert.leida = True
                alert.save()
            
            # Obtener datos actualizados
            alert_data = alert.to_dict() if hasattr(alert, 'to_dict') else {
                'id': alert.id,
                'leida': alert.leida,
                'resuelta': alert.resuelta,
            }
            
            return Response({
                'status': 'success',
                'message': 'Alerta marcada como leída',
                'alerta': alert_data
            })
            
        except AlertaPlanta.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Alerta no encontrada o no tienes permisos'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AlertMarkAsResolvedView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Marcar alerta como resuelta - Solo alertas de mis familias"""
        try:
            alert_id = request.data.get('alert_id')
            
            if not alert_id:
                return Response({
                    'status': 'error',
                    'message': 'Se requiere alert_id'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 1. Obtener familias del usuario
            familias_ids = FamiliaUsuario.objects.filter(
                usuario=request.user,
                activo=True
            ).values_list('familia_id', flat=True)
            
            # 2. Buscar alerta en plantas de esas familias
            alert = AlertaPlanta.objects.get(
                id=alert_id,
                planta__familia_id__in=familias_ids
            )
            
            # 3. Marcar como resuelta
            if hasattr(alert, 'resolver'):
                alert.resolver()
            else:
                alert.resuelta = True
                alert.fecha_resolucion = timezone.now()
                alert.save()
            
            return Response({
                'status': 'success',
                'message': 'Alerta marcada como resuelta'
            })
            
        except AlertaPlanta.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'Alerta no encontrada o no tienes permisos'
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
            
            # Verificar que la planta pertenezca a una familia del usuario
            plant_id = data['plant_id']
            
            # Obtener familias del usuario
            familias_ids = FamiliaUsuario.objects.filter(
                usuario=request.user,
                activo=True
            ).values_list('familia_id', flat=True)
            
            try:
                plant = Planta.objects.get(id=plant_id, familia_id__in=familias_ids)
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
                    sensor = Sensor.objects.get(id=sensor_id, planta=plant)
                    alert.sensor_relacionado = sensor
                    alert.save()
                except Sensor.DoesNotExist:
                    print(f"⚠️ Sensor {sensor_id} no encontrado para planta {plant_id}")
            
            # Obtener datos de la alerta
            alert_data = alert.to_dict() if hasattr(alert, 'to_dict') else {
                'id': alert.id,
                'planta': plant.nombrePersonalizado,
                'mensaje': alert.mensaje,
                'tipo': alert.tipo_alerta,
            }
            
            return Response({
                'status': 'success',
                'message': 'Alerta creada',
                'alerta': alert_data
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
        """Estadísticas de alertas de las familias del usuario"""
        try:
            # 1. Obtener familias del usuario
            miembros_familias = FamiliaUsuario.objects.filter(
                usuario=request.user,
                activo=True
            ).select_related('familia')
            
            familias_ids = miembros_familias.values_list('familia_id', flat=True)
            
            # 2. Obtener plantas de esas familias
            plantas_familia = Planta.objects.filter(familia_id__in=familias_ids)
            
            # 3. Obtener alertas
            alerts = AlertaPlanta.objects.filter(planta__in=plantas_familia)
            
            # 4. Estadísticas por tipo
            por_tipo = {
                'CRITICA': {
                    'total': alerts.filter(tipo_alerta=AlertaPlanta.CRITICA).count(),
                    'no_leidas': alerts.filter(tipo_alerta=AlertaPlanta.CRITICA, leida=False).count(),
                },
                'ADVERTENCIA': {
                    'total': alerts.filter(tipo_alerta=AlertaPlanta.ADVERTENCIA).count(),
                    'no_leidas': alerts.filter(tipo_alerta=AlertaPlanta.ADVERTENCIA, leida=False).count(),
                },
                'INFO': {
                    'total': alerts.filter(tipo_alerta=AlertaPlanta.INFO).count(),
                    'no_leidas': alerts.filter(tipo_alerta=AlertaPlanta.INFO, leida=False).count(),
                },
                'EXITO': {
                    'total': alerts.filter(tipo_alerta=AlertaPlanta.EXITO).count(),
                    'no_leidas': alerts.filter(tipo_alerta=AlertaPlanta.EXITO, leida=False).count(),
                },
            }
            
            # 5. Totales
            total = alerts.count()
            no_leidas = alerts.filter(leida=False).count()
            resueltas = alerts.filter(resuelta=True).count()
            
            # 6. Últimas 24 horas
            desde = timezone.now() - timezone.timedelta(hours=24)
            ultimas_24h = alerts.filter(fecha_creacion__gte=desde).count()
            
            # 7. Por familia
            alertas_por_familia = []
            for miembro in miembros_familias:
                familia = miembro.familia
                plantas_de_familia = plantas_familia.filter(familia=familia)
                count_alerts = alerts.filter(planta__in=plantas_de_familia, leida=False).count()
                
                alertas_por_familia.append({
                    'familia_id': familia.id,
                    'familia_nombre': familia.nombre,
                    'cantidad_alertas': count_alerts,
                    'cantidad_plantas': plantas_de_familia.count(),
                    'es_administrador': miembro.es_administrador,
                })
            
            # 8. Por planta (top 5 con más alertas no leídas)
            plantas_con_mas_alertas = []
            for planta in plantas_familia:
                count = alerts.filter(planta=planta, leida=False).count()
                if count > 0:
                    plantas_con_mas_alertas.append({
                        'planta_id': planta.id,
                        'planta_nombre': planta.nombrePersonalizado,
                        'cantidad_alertas': count,
                        'estado': planta.estado,
                    })
            
            # Ordenar por cantidad de alertas (descendente)
            plantas_con_mas_alertas.sort(key=lambda x: x['cantidad_alertas'], reverse=True)
            plantas_con_mas_alertas = plantas_con_mas_alertas[:5]
            
            return Response({
                'status': 'success',
                'estadisticas': {
                    'total': total,
                    'no_leidas': no_leidas,
                    'resuelta': resueltas,
                    'ultimas_24h': ultimas_24h,
                    'por_tipo': por_tipo,
                    'alertas_por_familia': alertas_por_familia,
                    'plantas_con_mas_alertas': plantas_con_mas_alertas,
                },
                'resumen_familias': {
                    'total_familias': len(alertas_por_familia),
                    'total_plantas': plantas_familia.count(),
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
            # Obtener una planta de las familias del usuario
            familias_ids = FamiliaUsuario.objects.filter(
                usuario=request.user,
                activo=True
            ).values_list('familia_id', flat=True)
            
            planta = Planta.objects.filter(familia_id__in=familias_ids).first()
            
            if not planta:
                return Response({
                    'status': 'error',
                    'message': 'No tienes plantas en tus familias'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Crear alerta de prueba
            alert = AlertaPlanta.objects.create(
                planta=planta,
                usuario=request.user,
                tipo_alerta=AlertaPlanta.CRITICA,
                mensaje='⚠️ Esta es una alerta de prueba. La humedad de la planta está muy baja (20%). Necesita riego inmediato.',
                datos_extra={'test': True, 'humedad': 20}
            )
            
            # Obtener datos de la alerta
            alert_data = alert.to_dict() if hasattr(alert, 'to_dict') else {
                'id': alert.id,
                'planta': planta.nombrePersonalizado,
                'tipo': alert.tipo_alerta,
                'mensaje': alert.mensaje,
            }
            
            return Response({
                'status': 'success',
                'message': 'Alerta de prueba creada',
                'alerta': alert_data
            })
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)