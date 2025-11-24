from rest_framework import serializers
from ..models import TipoSensor

class TipoSensorSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoSensor
        fields = '__all__'