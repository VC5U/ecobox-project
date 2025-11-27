# serializers/FamiliaUsuarioSerializer.py
from rest_framework import serializers
from ..models import FamiliaUsuario
from .usuario_serializer import UsuarioSerializer

class FamiliaUsuarioSerializer(serializers.ModelSerializer):
    usuario_info = serializers.SerializerMethodField()
    familia_nombre = serializers.CharField(source='familia.nombre', read_only=True)
    
    class Meta:
        model = FamiliaUsuario
        fields = ('id', 'familia', 'usuario', 'fecha_union', 'es_administrador', 
                 'activo', 'usuario_info', 'familia_nombre')
    
    def get_usuario_info(self, obj):
        return UsuarioSerializer(obj.usuario).data