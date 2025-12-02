from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from ..models import SeguimientoEstadoPlanta
from ..serializers import SeguimientoEstadoPlantaSerializer

class SeguimientoEstadoPlantaViewSet(viewsets.ModelViewSet):
    queryset = SeguimientoEstadoPlanta.objects.all()
    serializer_class = SeguimientoEstadoPlantaSerializer
    permission_classes = [IsAuthenticated]