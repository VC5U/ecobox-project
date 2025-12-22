# backend/main/serializers.py
from rest_framework import serializers
from ..models.Riego import Riego

class RiegoSerializer(serializers.ModelSerializer):
    planta_nombre = serializers.CharField(
        source='planta.nombrePersonalizado', 
        read_only=True
    )
    
    class Meta:
        model = Riego
        fields = [
            'id', 'planta', 'planta_nombre', 'usuario',
            'tipo', 'estado', 'duracion_segundos', 'cantidad_ml',
            'fecha_programada', 'fecha_inicio', 'fecha_fin', 'fecha_creacion',
            'exito', 'mensaje_error', 'humedad_inicial', 'humedad_final',
            'datos_extra'
        ]
        read_only_fields = [
            'id', 'fecha_creacion'
        ]