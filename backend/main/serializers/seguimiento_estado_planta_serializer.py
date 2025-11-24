
from rest_framework import serializers
from ..models import SeguimientoEstadoPlanta

class SeguimientoEstadoPlantaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SeguimientoEstadoPlanta
        fields = '__all__'