from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from django_filters.rest_framework import DjangoFilterBackend

# Importar modelos
from ..models.prediccion_riego import PrediccionRiego

# Importar serializers
from ..serializers.prediccion_riego_serializer import PrediccionRiegoSerializer

class PrediccionRiegoViewSet(viewsets.ReadOnlyModelViewSet):
    """API para consultar predicciones de riego"""
    queryset = PrediccionRiego.objects.all()
    serializer_class = PrediccionRiegoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['planta', 'accion_tomada']
    search_fields = ['planta__nombre']
    ordering_fields = ['fecha_riego_recomendada', 'probabilidad_necesidad']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrar por fechas futuras o recientes
        fecha_limite = timezone.now() - timedelta(hours=6)
        queryset = queryset.filter(
            fecha_riego_recomendada__gte=fecha_limite
        )
        
        # Filtrar por planta si se especifica
        planta_id = self.request.query_params.get('planta_id')
        if planta_id:
            queryset = queryset.filter(planta_id=planta_id)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def proximas_24h(self, request):
        """Obtiene predicciones para las próximas 24 horas"""
        fecha_inicio = timezone.now()
        fecha_fin = fecha_inicio + timedelta(hours=24)
        
        predicciones = PrediccionRiego.objects.filter(
            fecha_riego_recomendada__gte=fecha_inicio,
            fecha_riego_recomendada__lte=fecha_fin,
            accion_tomada=False
        ).order_by('fecha_riego_recomendada')
        
        serializer = self.get_serializer(predicciones, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def criticas(self, request):
        """Obtiene predicciones con alta probabilidad de riego"""
        predicciones = PrediccionRiego.objects.filter(
            probabilidad_necesidad__gte=0.8,
            accion_tomada=False,
            fecha_riego_recomendada__gte=timezone.now()
        ).order_by('probabilidad_necesidad')
        
        serializer = self.get_serializer(predicciones, many=True)
        return Response(serializer.data)