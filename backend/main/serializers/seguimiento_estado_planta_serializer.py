# serializers.py - Añade manejo de imágenes
from rest_framework import serializers
from ..models import SeguimientoEstadoPlanta

class SeguimientoEstadoPlantaSerializer(serializers.ModelSerializer):
    imagen_url = serializers.SerializerMethodField()
    imagen_miniatura_url = serializers.SerializerMethodField()
    
    class Meta:
        model = SeguimientoEstadoPlanta
        fields = [
            'id',
            'planta',
            'estado',
            'observaciones',
            'fecha_registro',
            'imagen',
            'imagen_url',
            'imagen_miniatura',
            'imagen_miniatura_url'
        ]
        read_only_fields = ['fecha_registro', 'imagen_miniatura', 'imagen_url', 'imagen_miniatura_url']
    
    def get_imagen_url(self, obj):
        if obj.imagen:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.imagen.url)
            return obj.imagen.url
        return None
    
    def get_imagen_miniatura_url(self, obj):
        if obj.imagen_miniatura:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.imagen_miniatura.url)
            return obj.imagen_miniatura.url
        return None