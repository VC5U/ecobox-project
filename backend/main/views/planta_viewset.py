from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg

from ..models import Familia, Planta
from ..serializers import PlantaSerializer, RiegoSerializer

class PlantaViewSet(viewsets.ModelViewSet):
    queryset = Planta.objects.all()
    serializer_class = PlantaSerializer
    permission_classes = [IsAuthenticated]

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
    # ===== NUEVO ENDPOINT - NO AFECTA LO EXISTENTE =====
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