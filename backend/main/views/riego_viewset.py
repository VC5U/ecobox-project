from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from ..models import Familia, Planta, Riego
from ..serializers import RiegoSerializer

class RiegoViewSet(viewsets.ModelViewSet):
    queryset = Riego.objects.all()
    serializer_class = RiegoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            familias_usuario = Familia.objects.filter(miembros__usuario=user)
            plantas_usuario = Planta.objects.filter(familia__in=familias_usuario)
            return Riego.objects.filter(planta__in=plantas_usuario)
        return Riego.objects.none()