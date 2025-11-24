from rest_framework import serializers
from ..models import Usuario

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 
                 'telefono', 'fecha_nacimiento', 'rol', 'is_active', 
                 'is_staff', 'date_joined')
        read_only_fields = ('date_joined', 'is_staff')