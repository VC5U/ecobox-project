from rest_framework import serializers

class EstadoPlantaSerializer(serializers.Serializer):
    """Serializer para estado combinado de planta"""
    planta_id = serializers.IntegerField()
    nombre = serializers.CharField()
    humedad_actual = serializers.FloatField(allow_null=True)
    temperatura_actual = serializers.FloatField(allow_null=True)
    luz_actual = serializers.FloatField(allow_null=True)
    ultima_medicion = serializers.DateTimeField(allow_null=True)
    necesita_riego = serializers.BooleanField()
    estado = serializers.CharField()
    alertas_activas = serializers.ListField(
        child=serializers.DictField(),
        default=[]
    )
    proximo_riego_recomendado = serializers.DateTimeField(allow_null=True)
    humedad_predicha = serializers.FloatField(allow_null=True)
    probabilidad_riego = serializers.FloatField(allow_null=True)
    
    # Métricas adicionales
    ultimo_riego = serializers.DateTimeField(allow_null=True)
    riegos_hoy = serializers.IntegerField(default=0)
    promedio_humedad_24h = serializers.FloatField(allow_null=True)