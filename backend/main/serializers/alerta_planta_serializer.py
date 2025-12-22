from rest_framework import serializers
from ..models.AlertaPlanta import AlertaPlanta


class AlertaPlantaSerializer(serializers.ModelSerializer):
    planta_nombre = serializers.CharField(
        source='planta.nombrePersonalizado', 
        read_only=True
    )
    sensor_nombre = serializers.CharField(
        source='sensor_relacionado.nombre',
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = AlertaPlanta
        fields = [
            'id', 'planta', 'planta_nombre',
            'tipo_alerta', 'mensaje',
            'fecha_creacion', 'fecha_resolucion',
            'resuelta', 'sensor_relacionado', 'sensor_nombre',
            'leida', 'notificada', 'datos_extra'
        ]
        read_only_fields = [
            'id', 'fecha_creacion'
        ]
    
    def update(self, instance, validated_data):
        if 'resuelta' in validated_data and validated_data['resuelta']:
            from django.utils import timezone
            validated_data['fecha_resolucion'] = timezone.now()
        
        return super().update(instance, validated_data)

    planta_nombre = serializers.CharField(
        source='planta.nombre', 
        read_only=True
    )
    sensor_nombre = serializers.CharField(
        source='sensor_relacionado.nombre',
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = AlertaPlanta
        fields = [
            'id', 'planta', 'planta_nombre',
            'tipo_alerta', 'mensaje',
            'fecha_creacion', 'fecha_resolucion',
            'resuelta', 'sensor_relacionado', 'sensor_nombre'
        ]
        read_only_fields = [
            'id', 'fecha_creacion'
        ]
    
    def update(self, instance, validated_data):
        # Si se marca como resuelta, actualizar fecha_resolucion
        if 'resuelta' in validated_data and validated_data['resuelta']:
            from django.utils import timezone
            validated_data['fecha_resolucion'] = timezone.now()
        
        return super().update(instance, validated_data)