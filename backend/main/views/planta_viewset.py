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