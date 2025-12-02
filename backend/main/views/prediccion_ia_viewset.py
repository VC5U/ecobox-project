from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from ..models import PrediccionIA
from ..serializers import PrediccionIASerializer

class PrediccionIAViewSet(viewsets.ModelViewSet):
    queryset = PrediccionIA.objects.all()
    serializer_class = PrediccionIASerializer
    permission_classes = [IsAuthenticated]