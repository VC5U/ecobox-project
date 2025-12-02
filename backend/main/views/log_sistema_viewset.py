from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from ..models import LogSistema
from ..serializers import LogSistemaSerializer

class LogSistemaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LogSistema.objects.all()
    serializer_class = LogSistemaSerializer
    permission_classes = [IsAuthenticated]