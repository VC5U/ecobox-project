from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from ..models import TipoSensor
from ..serializers import TipoSensorSerializer

class TipoSensorViewSet(viewsets.ModelViewSet):
    queryset = TipoSensor.objects.all()
    serializer_class = TipoSensorSerializer
    permission_classes = [IsAuthenticated]