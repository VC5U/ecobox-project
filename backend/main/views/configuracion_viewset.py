from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from ..models import Configuracion
from ..serializers import ConfiguracionSerializer

class ConfiguracionViewSet(viewsets.ModelViewSet):
    queryset = Configuracion.objects.all()
    serializer_class = ConfiguracionSerializer
    permission_classes = [IsAuthenticated]