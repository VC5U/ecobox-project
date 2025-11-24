from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from ..models import EstadoSensor
from ..serializers import EstadoSensorSerializer

class EstadoSensorViewSet(viewsets.ModelViewSet):
    queryset = EstadoSensor.objects.all()
    serializer_class = EstadoSensorSerializer
    permission_classes = [IsAuthenticated]