from rest_framework import serializers
from ..models.prediccion_riego import PrediccionRiego

class PrediccionRiegoSerializer(serializers.ModelSerializer):
    planta_nombre = serializers.CharField(
        source='planta.nombre', 
        read_only=True
    )
    planta_id = serializers.IntegerField(
        source='planta.id', 
        read_only=True
    )
    
    class Meta:
        model = PrediccionRiego
        fields = [
            'id', 'planta_id', 'planta_nombre',
            'fecha_prediccion', 'fecha_riego_recomendada',
            'probabilidad_necesidad', 'accion_tomada',
            'duracion_recomendada', 'humedad_predicha'
        ]
        read_only_fields = [
            'id', 'fecha_prediccion', 'accion_tomada'
        ]
    
    def validate(self, data):
        # Validar que la fecha de riego sea futura
        if 'fecha_riego_recomendada' in data:
            from django.utils import timezone
            if data['fecha_riego_recomendada'] <= timezone.now():
                raise serializers.ValidationError(
                    "La fecha de riego recomendada debe ser futura"
                )
        
        # Validar probabilidad
        if 'probabilidad_necesidad' in data:
            prob = data['probabilidad_necesidad']
            if prob < 0 or prob > 1:
                raise serializers.ValidationError(
                    "La probabilidad debe estar entre 0 y 1"
                )
        
        return data