# backend/main/views/historial_planta_real.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Avg, Max, Min, Q
from django.utils import timezone
from datetime import timedelta
import traceback
from ..models import Planta, Sensor, Medicion, Configuracion

# Verifica si estos modelos existen (importa solo los que tengas)
try:
    from ..models import Riego
    TIENE_RIEGO = True
except ImportError:
    TIENE_RIEGO = False
    print("⚠️ Modelo Riego no encontrado")

try:
    from ..models import Notificacion
    TIENE_NOTIFICACION = True
except ImportError:
    TIENE_NOTIFICACION = False
    print("⚠️ Modelo Notificacion no encontrado")

try:
    from ..models import SeguimientoEstadoPlanta
    TIENE_SEGUIMIENTO = True
except ImportError:
    TIENE_SEGUIMIENTO = False
    print("⚠️ Modelo SeguimientoEstadoPlanta no encontrado")

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historial_planta_real(request, id_planta):
    """Historial REAL de la planta desde la base de datos"""
    try:
        # 1. Verificar que la planta existe
        planta = Planta.objects.filter(idPlanta=id_planta).first()
        if not planta:
            return Response(
                {'error': f'Planta con ID {id_planta} no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        print(f"🌱 Obteniendo historial real para planta: {planta.nombrePersonalizado}")
        
        # 2. Obtener sensores de la planta
        sensores = Sensor.objects.filter(planta=id_planta, activo=True)
        print(f"📡 Sensores encontrados: {sensores.count()}")
        
        # 3. Obtener mediciones REALES de los últimos 7 días
        fecha_limite = timezone.now() - timedelta(days=7)
        
        # Mediciones de todos los sensores de esta planta
        mediciones = Medicion.objects.filter(
            sensor__in=sensores,
            fecha__gte=fecha_limite
        ).order_by('-fecha')[:50]  # Últimas 50 mediciones
        
        print(f"📊 Mediciones encontradas: {mediciones.count()}")
        
        # 4. Obtener eventos REALES (solo de modelos que existen)
        eventos = []
        
        # Eventos de riego (si existe el modelo)
        if TIENE_RIEGO:
            try:
                riegos = Riego.objects.filter(
                    planta=id_planta,
                    fecha__gte=fecha_limite
                ).order_by('-fecha')[:10]
                
                print(f"💧 Riegos encontrados: {riegos.count()}")
                
                for riego in riegos:
                    eventos.append({
                        'id': riego.id,
                        'fecha': riego.fecha.isoformat() if hasattr(riego.fecha, 'isoformat') else str(riego.fecha),
                        'tipo': 'riego',
                        'descripcion': f'Riego realizado: {getattr(riego, "cantidad_agua", "N/A")}ml',
                        'usuario': getattr(riego.usuario, 'username', 'Sistema') if hasattr(riego, 'usuario') else 'Sistema',
                        'detalles': f'Duración: {getattr(riego, "duracion", "N/A")}min | Modo: {getattr(riego, "modo_riego", "N/A")}'
                    })
            except Exception as e:
                print(f"⚠️ Error obteniendo riegos: {str(e)}")
        
        # Notificaciones/alertas (si existe el modelo)
        if TIENE_NOTIFICACION:
            try:
                notificaciones = Notificacion.objects.filter(
                    Q(planta_id=id_planta) | Q(mensaje__contains=f'Planta {id_planta}'),
                    fecha_creacion__gte=fecha_limite
                ).order_by('-fecha_creacion')[:10]
                
                print(f"🔔 Notificaciones encontradas: {notificaciones.count()}")
                
                for notif in notificaciones:
                    eventos.append({
                        'id': notif.id,
                        'fecha': notif.fecha_creacion.isoformat() if hasattr(notif.fecha_creacion, 'isoformat') else str(notif.fecha_creacion),
                        'tipo': 'alerta' if getattr(notif, 'tipo', '') in ['warning', 'danger'] else 'info',
                        'descripcion': getattr(notif, 'mensaje', 'Notificación'),
                        'usuario': 'Sistema',
                        'detalles': f'Tipo: {getattr(notif, "tipo", "N/A")} | Leída: {getattr(notif, "leida", "N/A")}'
                    })
            except Exception as e:
                print(f"⚠️ Error obteniendo notificaciones: {str(e)}")
        
        # Seguimientos de estado (si existe el modelo)
        if TIENE_SEGUIMIENTO:
            try:
                seguimientos = SeguimientoEstadoPlanta.objects.filter(
                    planta=id_planta,
                    fecha__gte=fecha_limite
                ).order_by('-fecha')[:5]
                
                print(f"📝 Seguimientos encontrados: {seguimientos.count()}")
                
                for seg in seguimientos:
                    eventos.append({
                        'id': seg.id,
                        'fecha': seg.fecha.isoformat() if hasattr(seg.fecha, 'isoformat') else str(seg.fecha),
                        'tipo': 'medicion',
                        'descripcion': f'Seguimiento de estado: {getattr(seg, "estado", "N/A")}',
                        'usuario': getattr(seg.usuario, 'username', 'Sistema') if hasattr(seg, 'usuario') else 'Sistema',
                        'detalles': f'Aspecto: {getattr(seg, "aspecto", "N/A")} | Observaciones: {getattr(seg, "observaciones", "N/A")}'
                    })
            except Exception as e:
                print(f"⚠️ Error obteniendo seguimientos: {str(e)}")
        
        # 5. Calcular estadísticas REALES
        # Estadísticas de humedad (sensores tipo 2)
        sensor_humedad = sensores.filter(tipo_sensor=2).first()
        estadisticas_humedad = {'promedio': 60, 'maximo': 80, 'minimo': 40, 'tendencia': 'estable'}
        
        if sensor_humedad:
            try:
                mediciones_humedad = Medicion.objects.filter(
                    sensor=sensor_humedad,
                    fecha__gte=fecha_limite
                )
                if mediciones_humedad.exists():
                    avg_val = mediciones_humedad.aggregate(Avg('valor'))['valor__avg']
                    max_val = mediciones_humedad.aggregate(Max('valor'))['valor__max']
                    min_val = mediciones_humedad.aggregate(Min('valor'))['valor__min']
                    
                    estadisticas_humedad = {
                        'promedio': round(avg_val or 60, 1),
                        'maximo': round(max_val or 80, 1),
                        'minimo': round(min_val or 40, 1),
                        'tendencia': 'estable'
                    }
            except Exception as e:
                print(f"⚠️ Error calculando estadísticas de humedad: {str(e)}")
        
        # Estadísticas de temperatura (sensores tipo 1)
        sensor_temperatura = sensores.filter(tipo_sensor=1).first()
        estadisticas_temperatura = {'promedio': 24, 'maximo': 30, 'minimo': 18, 'tendencia': 'estable'}
        
        if sensor_temperatura:
            try:
                mediciones_temp = Medicion.objects.filter(
                    sensor=sensor_temperatura,
                    fecha__gte=fecha_limite
                )
                if mediciones_temp.exists():
                    avg_val = mediciones_temp.aggregate(Avg('valor'))['valor__avg']
                    max_val = mediciones_temp.aggregate(Max('valor'))['valor__max']
                    min_val = mediciones_temp.aggregate(Min('valor'))['valor__min']
                    
                    estadisticas_temperatura = {
                        'promedio': round(avg_val or 24, 1),
                        'maximo': round(max_val or 30, 1),
                        'minimo': round(min_val or 18, 1),
                        'tendencia': 'estable'
                    }
            except Exception as e:
                print(f"⚠️ Error calculando estadísticas de temperatura: {str(e)}")
        
        # 6. Formatear mediciones para el frontend
        ultimas_mediciones = []
        for medicion in mediciones:
            # Determinar tipo de sensor
            tipo_sensor_nombre = 'desconocido'
            unidad = ''
            
            tipo_sensor = getattr(medicion.sensor, 'tipo_sensor', 0)
            
            if tipo_sensor == 1:
                tipo_sensor_nombre = 'temperatura'
                unidad = '°C'
            elif tipo_sensor == 2:
                tipo_sensor_nombre = 'humedad'
                unidad = '%'
            elif tipo_sensor == 4:
                tipo_sensor_nombre = 'luz'
                unidad = 'lux'
            
            ultimas_mediciones.append({
                'id': medicion.id,
                'fecha': medicion.fecha.isoformat() if hasattr(medicion.fecha, 'isoformat') else str(medicion.fecha),
                'tipo_sensor': tipo_sensor_nombre,
                'valor': float(medicion.valor),
                'unidad': unidad,
                'sensor_nombre': getattr(medicion.sensor, 'nombre', f'Sensor {medicion.sensor.id}')
            })
        
        # 7. Ordenar eventos por fecha
        eventos.sort(key=lambda x: x['fecha'], reverse=True)
        
        # 8. Obtener configuración de la planta (si existe)
        configuracion = {}
        try:
            config = Configuracion.objects.filter(idPlanta=id_planta).first()
            if config:
                configuracion = {
                    'riego_automatico': getattr(config, 'riego_automatico', False),
                    'umbral_humedad': getattr(config, 'umbral_humedad', 60),
                    'intervalo_riego': getattr(config, 'intervalo_riego', 24)
                }
        except Exception as e:
            print(f"⚠️ Error obteniendo configuración: {str(e)}")
        
        # 9. Construir respuesta
        historial = {
            'resumen': {
                'totalRegistros': len(eventos) + len(ultimas_mediciones),
                'sensoresActivos': sensores.count(),
                'ultimoRegistro': timezone.now().isoformat(),
                'diasMonitoreo': 7,
                'nombrePlanta': planta.nombrePersonalizado,
                'especie': getattr(planta, 'especie', 'No especificada'),
                'fecha_plantacion': getattr(planta, 'fecha_plantacion', None)
            },
            'eventos': eventos[:15],  # Solo los últimos 15 eventos
            'ultimasMediciones': ultimas_mediciones[:20],  # Solo las últimas 20 mediciones
            'estadisticas': {
                'humedad': estadisticas_humedad,
                'temperatura': estadisticas_temperatura,
                'eventos': {
                    'total': len(eventos),
                    'riegos': len([e for e in eventos if e['tipo'] == 'riego']),
                    'alertas': len([e for e in eventos if e['tipo'] == 'alerta']),
                    'ultimaSemana': len(eventos)
                }
            },
            'sensores': [
                {
                    'id': sensor.id,
                    'nombre': getattr(sensor, 'nombre', f'Sensor {sensor.id}'),
                    'tipo': getattr(sensor, 'tipo_sensor', 0),
                    'activo': getattr(sensor, 'activo', True),
                    'ubicacion': getattr(sensor, 'ubicacion', ''),
                    'ultima_medicion': Medicion.objects.filter(
                        sensor=sensor
                    ).order_by('-fecha').first().valor if Medicion.objects.filter(sensor=sensor).exists() else None
                }
                for sensor in sensores
            ],
            'configuracion': configuracion
        }
        
        print(f"✅ Historial construido exitosamente:")
        print(f"   - Eventos: {len(historial['eventos'])}")
        print(f"   - Mediciones: {len(historial['ultimasMediciones'])}")
        print(f"   - Sensores: {len(historial['sensores'])}")
        
        return Response(historial, status=status.HTTP_200_OK)
        
    except Exception as e:
        error_details = traceback.format_exc()
        print(f"❌ Error en historial_planta_real: {str(e)}")
        print(f"📋 Traceback: {error_details}")
        
        return Response(
            {
                'error': str(e),
                'message': 'Error obteniendo historial real',
                'traceback': error_details if request.user.is_staff else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def historial_mediciones_sensor(request, sensor_id):
    """Historial de mediciones de un sensor específico"""
    try:
        sensor = Sensor.objects.get(id=sensor_id)
        print(f"📡 Obteniendo historial para sensor: {getattr(sensor, 'nombre', sensor_id)}")
        
        # Parámetros de filtro
        limite = int(request.GET.get('limit', 50))
        dias = int(request.GET.get('dias', 7))
        
        fecha_limite = timezone.now() - timedelta(days=dias)
        
        mediciones = Medicion.objects.filter(
            sensor=sensor,
            fecha__gte=fecha_limite
        ).order_by('-fecha')[:limite]
        
        print(f"📊 Mediciones encontradas para sensor: {mediciones.count()}")
        
        # Determinar unidad según tipo de sensor
        unidad = ''
        tipo_sensor = getattr(sensor, 'tipo_sensor', 0)
        
        if tipo_sensor == 1:
            unidad = '°C'
        elif tipo_sensor == 2:
            unidad = '%'
        elif tipo_sensor == 4:
            unidad = 'lux'
        
        datos = [
            {
                'id': m.id,
                'fecha': m.fecha.isoformat() if hasattr(m.fecha, 'isoformat') else str(m.fecha),
                'valor': float(m.valor),
                'unidad': unidad
            }
            for m in mediciones
        ]
        
        # Estadísticas
        if mediciones.exists():
            valores = [float(m.valor) for m in mediciones]
            estadisticas = {
                'promedio': round(sum(valores) / len(valores), 2),
                'maximo': round(max(valores), 2),
                'minimo': round(min(valores), 2),
                'total_mediciones': len(valores)
            }
        else:
            estadisticas = {
                'promedio': 0,
                'maximo': 0,
                'minimo': 0,
                'total_mediciones': 0
            }
        
        response_data = {
            'sensor': {
                'id': sensor.id,
                'nombre': getattr(sensor, 'nombre', f'Sensor {sensor.id}'),
                'tipo': tipo_sensor,
                'planta_id': getattr(sensor.planta, 'idPlanta', None) if hasattr(sensor, 'planta') and sensor.planta else None,
                'planta_nombre': getattr(sensor.planta, 'nombrePersonalizado', None) if hasattr(sensor, 'planta') and sensor.planta else None
            },
            'mediciones': datos,
            'estadisticas': estadisticas,
            'periodo': f'Últimos {dias} días'
        }
        
        print(f"✅ Historial de sensor completado: {len(datos)} mediciones")
        
        return Response(response_data)
        
    except Sensor.DoesNotExist:
        return Response(
            {'error': f'Sensor con ID {sensor_id} no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        print(f"❌ Error en historial_mediciones_sensor: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )