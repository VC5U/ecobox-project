from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ..models import Familia, Planta, Sensor
from ..serializers import SensorSerializer, MedicionSerializer

class SensorViewSet(viewsets.ModelViewSet):
    queryset = Sensor.objects.all()
    serializer_class = SensorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            familias_usuario = Familia.objects.filter(miembros__usuario=user)
            plantas_usuario = Planta.objects.filter(familia__in=familias_usuario)
            return Sensor.objects.filter(planta__in=plantas_usuario)
        return Sensor.objects.none()

    @action(detail=True, methods=['get'])
    def historial_mediciones(self, request, pk=None):
        sensor = self.get_object()
        limit = request.query_params.get('limit', 50)
        mediciones = sensor.mediciones.order_by('-fecha')[:int(limit)]
        serializer = MedicionSerializer(mediciones, many=True)
        return Response(serializer.data)