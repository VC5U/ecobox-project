from rest_framework import serializers
from ..models import FamiliaUsuario

class FamiliaUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamiliaUsuario
        fields = '__all__'