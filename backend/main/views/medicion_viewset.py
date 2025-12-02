from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from ..models import Familia, Planta, Sensor, Medicion
from ..serializers import MedicionSerializer

class MedicionViewSet(viewsets.ModelViewSet):
    queryset = Medicion.objects.all()
    serializer_class = MedicionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            familias_usuario = Familia.objects.filter(miembros__usuario=user)
            plantas_usuario = Planta.objects.filter(familia__in=familias_usuario)
            sensores_usuario = Sensor.objects.filter(planta__in=plantas_usuario)
            return Medicion.objects.filter(sensor__in=sensores_usuario)
        return Medicion.objects.none()