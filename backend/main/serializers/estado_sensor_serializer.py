from rest_framework import serializers
from ..models import EstadoSensor

class EstadoSensorSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoSensor
        fields = '__all__'