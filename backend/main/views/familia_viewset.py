from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ..models import Familia, FamiliaUsuario
from ..serializers import FamiliaSerializer

class FamiliaViewSet(viewsets.ModelViewSet):
    queryset = Familia.objects.all()
    serializer_class = FamiliaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Familia.objects.filter(miembros__usuario=user).distinct()
        return Familia.objects.none()

    @action(detail=True, methods=['post'])
    def unir_familia(self, request, pk=None):
        familia = self.get_object()
        usuario = request.user
        
        if FamiliaUsuario.objects.filter(familia=familia, usuario=usuario).exists():
            return Response(
                {'error': 'Ya eres miembro de esta familia'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        FamiliaUsuario.objects.create(familia=familia, usuario=usuario)
        return Response({'message': 'Te has unido a la familia exitosamente'})