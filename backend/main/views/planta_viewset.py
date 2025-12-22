from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg
from django.utils import timezone
from datetime import timedelta

# Importar modelos
from ..models import Familia, Planta, Riego
from ..models.AlertaPlanta import AlertaPlanta

# Importar serializers
from ..serializers import PlantaSerializer, RiegoSerializer
from ..serializers.estado_planta_serializer import EstadoPlantaSerializer

# Importar servicios de IA
from ..ai_service.predictor import predictor
from ..ai_service.monitor import monitor



class PlantaViewSet(viewsets.ModelViewSet):
    queryset = Planta.objects.all()
    serializer_class = PlantaSerializer
    permission_classes = [IsAuthenticated]

    # ===== EXISTING CODE - NO MODIFICAR =====
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            familias_usuario = Familia.objects.filter(miembros__usuario=user)
            return Planta.objects.filter(familia__in=familias_usuario)
        return Planta.objects.none()

    @action(detail=True, methods=['get'])
    def estadisticas(self, request, pk=None):
        planta = self.get_object()
        estadisticas = {
            'total_sensores': planta.sensores.count(),
            'total_riegos': planta.riegos.count(),
            'ultimo_riego': None,
            'promedio_temperatura': None,
            'promedio_humedad': None
        }
        
        ultimo_riego = planta.riegos.order_by('-fecha').first()
        if ultimo_riego:
            estadisticas['ultimo_riego'] = RiegoSerializer(ultimo_riego).data
        
        for sensor in planta.sensores.all():
            if sensor.tipo_sensor.nombre.lower() == 'temperatura':
                avg = sensor.mediciones.aggregate(Avg('valor'))['valor__avg']
                if avg:
                    estadisticas['promedio_temperatura'] = float(avg)
            elif sensor.tipo_sensor.nombre.lower() == 'humedad':
                avg = sensor.mediciones.aggregate(Avg('valor'))['valor__avg']
                if avg:
                    estadisticas['promedio_humedad'] = float(avg)
        
        return Response(estadisticas)

    @action(detail=False, methods=['get'])
    def mis_plantas(self, request):
        """
        Plantas SOLO de familias donde el usuario es miembro ACTIVO
        Endpoint: GET /api/plantas/mis_plantas/
        """
        try:
            # Filtrar por miembros ACTIVOS (activo=True)
            plantas = Planta.objects.filter(
                familia__miembros__usuario=request.user,
                familia__miembros__activo=True
            ).distinct()
            
            # Opcional: agregar paginación
            page = self.paginate_queryset(plantas)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(plantas, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            return Response({
                'error': f'Error obteniendo plantas: {str(e)}'
            }, status=500)
    # ===== FIN EXISTING CODE =====

    # ===== NUEVOS ENDPOINTS DE IA =====
    
    @action(detail=True, methods=['get'])
    def estado(self, request, pk=None):
        """
        Obtiene el estado COMPLETO de una planta con predicciones de IA
        Endpoint: GET /api/plantas/{id}/estado/
        """
        planta = self.get_object()
        
        try:
            # Usar el predictor de IA para obtener estado
            estado = predictor.obtener_estado_completo(planta.id)
            
            # Serializar respuesta
            serializer = EstadoPlantaSerializer(data=estado)
            if serializer.is_valid():
                return Response(serializer.data)
            
            return Response(
                serializer.errors, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Exception as e:
            return Response({
                'error': f'Error obteniendo estado: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def regar(self, request, pk=None):
        """
        Activa riego MANUAL inmediato
        Endpoint: POST /api/plantas/{id}/regar/
        Body: {"duracion": 30} (opcional, default: 30 segundos)
        """
        planta = self.get_object()
        duracion = request.data.get('duracion', 30)
        
        try:
            # 1. Crear registro de riego en base de datos
            riego = Riego.objects.create(
                planta=planta,
                duracion=duracion,
                cantidad_agua=duracion * 10,  # 10ml por segundo
                fecha=timezone.now()
            )
            
            # 2. Activar riego físico (usar el servicio de monitoreo)
            monitor.activar_riego_emergencia(planta.id, duracion)
            
            # 3. Marcar alertas como resueltas si existían
            alertas = AlertaPlanta.objects.filter(
                planta=planta,
                resuelta=False,
                tipo_alerta__in=['CRITICA', 'ADVERTENCIA']
            )
            
            for alerta in alertas:
                alerta.resolver()
            
            return Response({
                'status': 'success',
                'message': f'Riego activado por {duracion} segundos',
                'riego_id': riego.id,
                'cantidad_agua_ml': duracion * 10,
                'alerta_resueltas': alertas.count()
            })
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def entrenar_ia(self, request, pk=None):
        """
        Reentrena el modelo de IA para esta planta
        Endpoint: POST /api/plantas/{id}/entrenar_ia/
        Body: {"dias_atras": 30} (opcional, default: 30 días)
        """
        planta = self.get_object()
        dias_atras = request.data.get('dias_atras', 30)
        
        try:
            success = predictor.entrenar_modelo_planta(planta.id, dias_atras)
            
            if success:
                return Response({
                    'status': 'success',
                    'message': f'Modelo IA reentrenado para {planta.nombre}',
                    'dias_datos': dias_atras,
                    'fecha_entrenamiento': timezone.now().isoformat()
                })
            else:
                return Response({
                    'status': 'warning',
                    'message': 'Datos insuficientes para entrenar el modelo',
                    'sugerencia': 'Espere a tener más mediciones (mínimo 50)'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def predicciones(self, request, pk=None):
        """
        Obtiene predicciones futuras de riego generadas por IA
        Endpoint: GET /api/plantas/{id}/predicciones/
        Query Params: 
          - horas: número de horas a predecir (default: 24)
          - incluir_pasadas: true/false (default: false)
        """
        planta = self.get_object()
        horas = int(request.query_params.get('horas', 24))
        incluir_pasadas = request.query_params.get('incluir_pasadas', 'false').lower() == 'true'
        
        try:
            fecha_limite = timezone.now() + timedelta(hours=horas)
            
            # Importar aquí para evitar circular imports
            from ..models.prediccion_riego import PrediccionRiego
            from ..serializers.prediccion_riego_serializer import PrediccionRiegoSerializer
            
            # Consultar predicciones
            queryset = PrediccionRiego.objects.filter(
                planta=planta,
                fecha_riego_recomendada__lte=fecha_limite
            )
            
            if not incluir_pasadas:
                queryset = queryset.filter(
                    fecha_riego_recomendada__gte=timezone.now()
                )
            
            predicciones = queryset.order_by('fecha_riego_recomendada')
            
            # Generar nueva predicción en tiempo real si no hay suficientes
            if predicciones.count() < 3:
                nueva_prediccion = predictor.predecir_proxima_hora_riego(planta.id)
                if nueva_prediccion:
                    # Podrías guardar esta predicción en la BD aquí
                    pass
            
            serializer = PrediccionRiegoSerializer(predicciones, many=True)
            
            return Response({
                'planta': planta.nombrePersonalizado,
                'total_predicciones': predicciones.count(),
                'horas_analizadas': horas,
                'predicciones': serializer.data
            })
            
        except Exception as e:
            return Response({
                'error': f'Error obteniendo predicciones: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def alertas(self, request, pk=None):
        """
        Obtiene alertas activas de la planta
        Endpoint: GET /api/plantas/{id}/alertas/
        Query Params:
          - tipo: filtrar por tipo (CRITICA, ADVERTENCIA, INFO)
          - resueltas: true/false (default: false)
        """
        planta = self.get_object()
        tipo = request.query_params.get('tipo')
        resueltas = request.query_params.get('resueltas', 'false').lower() == 'true'
        
        try:
            from ..serializers.alerta_planta_serializer import AlertaPlantaSerializer
            
            alertas = AlertaPlanta.objects.filter(planta=planta)
            
            if not resueltas:
                alertas = alertas.filter(resuelta=False)
            
            if tipo:
                alertas = alertas.filter(tipo_alerta=tipo)
            
            alertas = alertas.order_by('-fecha_creacion')
            
            serializer = AlertaPlantaSerializer(alertas, many=True)
            
            return Response({
                'planta': planta.nombrePersonalizado,
                'total_alertas': alertas.count(),
                'resueltas': alertas.filter(resuelta=True).count(),
                'activas': alertas.filter(resuelta=False).count(),
                'alertas': serializer.data
            })
            
        except Exception as e:
            return Response({
                'error': f'Error obteniendo alertas: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def historial_ia(self, request, pk=None):
        """
        Obtiene historial de predicciones y acciones de IA
        Endpoint: GET /api/plantas/{id}/historial_ia/
        Query Params:
          - dias: número de días atrás (default: 7)
        """
        planta = self.get_object()
        dias = int(request.query_params.get('dias', 7))
        fecha_inicio = timezone.now() - timedelta(days=dias)
        
        try:
            from ..models.prediccion_riego import PrediccionRiego
            
            # Predicciones pasadas
            predicciones = PrediccionRiego.objects.filter(
                planta=planta,
                fecha_prediccion__gte=fecha_inicio
            ).order_by('-fecha_prediccion')
            
            # Riegos automáticos (activados por IA)
            riegos_automaticos = Riego.objects.filter(
                planta=planta,
                fecha__gte=fecha_inicio
            ).order_by('-fecha')
            
            # Alertas generadas
            alertas = AlertaPlanta.objects.filter(
                planta=planta,
                fecha_creacion__gte=fecha_inicio
            ).order_by('-fecha_creacion')
            
            from ..serializers.prediccion_riego_serializer import PrediccionRiegoSerializer
            from ..serializers.alerta_planta_serializer import AlertaPlantaSerializer
            
            return Response({
                'planta': planta.nombrePersonalizado,
                'periodo_dias': dias,
                'estadisticas': {
                    'predicciones_totales': predicciones.count(),
                    'predicciones_acertadas': predicciones.filter(accion_tomada=True).count(),
                    'riegos_automaticos': riegos_automaticos.count(),
                    'alertas_generadas': alertas.count(),
                    'alertas_resueltas': alertas.filter(resuelta=True).count()
                },
                'predicciones': PrediccionRiegoSerializer(predicciones, many=True).data,
                'alertas': AlertaPlantaSerializer(alertas, many=True).data[:10]  # Últimas 10
            })
            
        except Exception as e:
            return Response({
                'error': f'Error obteniendo historial: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def estado_general(self, request):
        """
        Estado general de TODAS las plantas del usuario (para dashboard)
        Endpoint: GET /api/plantas/estado_general/
        """
        try:
            # Usar el queryset base que ya filtra por usuario
            plantas = self.get_queryset()
            resultados = []
            
            for planta in plantas:
                estado = predictor.obtener_estado_rapido(planta.id)
                
                # Contar alertas activas
                alertas_activas = AlertaPlanta.objects.filter(
                    planta=planta,
                    resuelta=False
                ).count()
                
                resultados.append({
                    'id': planta.id,
                    'nombre': planta.nombrePersonalizado,
                    'familia': planta.familia.nombre if planta.familia else 'Sin familia',
                    'humedad': estado.get('humedad_actual'),
                    'temperatura': estado.get('temperatura_actual'),
                    'estado': estado.get('estado', 'desconocido'),
                    'necesita_riego': estado.get('necesita_riego', False),
                    'alertas_activas': alertas_activas,
                    'ultima_medicion': estado.get('ultima_medicion'),
                    'icono': self._determinar_icono(estado.get('estado'))
                })
            
            # Estadísticas generales
            total_plantas = len(resultados)
            plantas_necesitan_riego = sum(1 for p in resultados if p['necesita_riego'])
            plantas_criticas = sum(1 for p in resultados if p['estado'] == 'critico')
            total_alertas = sum(p['alertas_activas'] for p in resultados)
            
            return Response({
                'estadisticas': {
                    'total_plantas': total_plantas,
                    'plantas_saludables': total_plantas - plantas_necesitan_riego,
                    'plantas_necesitan_riego': plantas_necesitan_riego,
                    'plantas_criticas': plantas_criticas,
                    'total_alertas': total_alertas
                },
                'plantas': resultados,
                'timestamp': timezone.now().isoformat()
            })
            
        except Exception as e:
            return Response({
                'error': f'Error obteniendo estado general: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def regar_multiple(self, request):
        """
        Activa riego para múltiples plantas a la vez
        Endpoint: POST /api/plantas/regar_multiple/
        Body: {
          "planta_ids": [1, 2, 3],
          "duracion": 30
        }
        """
        planta_ids = request.data.get('planta_ids', [])
        duracion = request.data.get('duracion', 30)
        
        if not planta_ids:
            return Response({
                'error': 'Debe especificar al menos una planta'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            resultados = []
            plantas = Planta.objects.filter(
                id__in=planta_ids,
                familia__miembros__usuario=request.user,
                familia__miembros__activo=True
            ).distinct()
            
            for planta in plantas:
                try:
                    # Crear registro de riego
                    riego = Riego.objects.create(
                        planta=planta,
                        duracion=duracion,
                        cantidad_agua=duracion * 10,
                        fecha=timezone.now()
                    )
                    
                    # Activar riego
                    monitor.activar_riego_emergencia(planta.id, duracion)
                    
                    resultados.append({
                        'planta_id': planta.id,
                        'planta_nombre': planta.nombre,
                        'status': 'success',
                        'riego_id': riego.id
                    })
                    
                except Exception as e:
                    resultados.append({
                        'planta_id': planta.id,
                        'planta_nombre': planta.nombre,
                        'status': 'error',
                        'error': str(e)
                    })
            
            return Response({
                'total_solicitadas': len(planta_ids),
                'total_procesadas': len(plantas),
                'duracion_segundos': duracion,
                'resultados': resultados
            })
            
        except Exception as e:
            return Response({
                'error': f'Error activando riego múltiple: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # ===== MÉTODOS AUXILIARES PRIVADOS =====
    
    def _determinar_icono(self, estado):
        """
        Determina el icono a mostrar según el estado
        """
        iconos = {
            'critico': '⚠️🔴',
            'advertencia': '⚠️🟡', 
            'normal': '✅🟢',
            'sin_datos': '❓⚫'
        }
        return iconos.get(estado, '❓⚫')