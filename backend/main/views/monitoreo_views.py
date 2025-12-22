from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

# Importar modelos
from ..models.AlertaPlanta import AlertaPlanta

# Importar serializers
from ..serializers.alerta_planta_serializer import AlertaPlantaSerializer

# Importar servicios
from ..ai_service.monitor import MonitoringService
from ..ai_service.predictor import RiegoPredictor
from ..ai_service.scheduler import RiegoScheduler

monitor = MonitoringService()
predictor = RiegoPredictor()
scheduler = RiegoScheduler(predictor)

class MonitoreoViewSet(viewsets.ViewSet):
    """Vistas para control del sistema de monitoreo"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def iniciar(self, request):
        """Inicia el sistema de monitoreo"""
        if not monitor.is_running:
            monitor.start_monitoring()
            
            # Programar riegos predictivos
            from ..models.planta import Planta
            plantas = Planta.objects.all()
            for planta in plantas:
                scheduler.programar_riegos_predictivos(planta.id)
            
            return Response({
                'status': 'success',
                'message': 'Sistema de monitoreo iniciado',
                'plantas_programadas': plantas.count()
            })
        else:
            return Response({
                'status': 'info',
                'message': 'El sistema ya está en ejecución'
            })
    
    @action(detail=False, methods=['post'])
    def detener(self, request):
        """Detiene el sistema de monitoreo"""
        if monitor.is_running:
            monitor.stop_monitoring()
            scheduler.detener_todos()
            
            return Response({
                'status': 'success',
                'message': 'Sistema de monitoreo detenido'
            })
        else:
            return Response({
                'status': 'info',
                'message': 'El sistema no estaba en ejecución'
            })
    
    @action(detail=False, methods=['get'])
    def estado_servicio(self, request):
        """Obtiene el estado del servicio de monitoreo"""
        return Response({
            'monitoreo_activo': monitor.is_running,
            'ultima_revision': monitor.ultima_revision if hasattr(monitor, 'ultima_revision') else None,
            'trabajos_programados': len(scheduler.trabajos_activos) if hasattr(scheduler, 'trabajos_activos') else 0
        })