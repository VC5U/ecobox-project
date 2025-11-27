# serializers/FamiliaSerializer.py
from rest_framework import serializers
from ..models import Familia
from .usuario_serializer import UsuarioSerializer
from .familia_usuario_serializer import FamiliaUsuarioSerializer

class FamiliaSerializer(serializers.ModelSerializer):
    miembros = serializers.SerializerMethodField()
    es_admin = serializers.SerializerMethodField()
    cantidad_miembros = serializers.SerializerMethodField()
    
    class Meta:
        model = Familia
        fields = ('id', 'nombre', 'codigo_invitacion', 'fecha_creacion', 
                 'cantidad_plantas', 'miembros', 'es_admin', 'cantidad_miembros')
    
    def get_miembros(self, obj):
        from ..models import FamiliaUsuario
        miembros = FamiliaUsuario.objects.filter(familia=obj, activo=True)
        return FamiliaUsuarioSerializer(miembros, many=True).data
    
    def get_es_admin(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from ..models import FamiliaUsuario
            return FamiliaUsuario.objects.filter(
                familia=obj,
                usuario=request.user,
                es_administrador=True
            ).exists()
        return False
    
    def get_cantidad_miembros(self, obj):
        from ..models import FamiliaUsuario
        return FamiliaUsuario.objects.filter(familia=obj, activo=True).count()
    from rest_framework import serializers

class CrearFamiliaSerializer(serializers.Serializer):
    nombre_familia = serializers.CharField(max_length=100)

class UnirseFamiliaSerializer(serializers.Serializer):
    codigo_invitacion = serializers.CharField(max_length=50)

class CambiarRolSerializer(serializers.Serializer):
    id_usuario = serializers.IntegerField()
    es_administrador = serializers.BooleanField()