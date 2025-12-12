# En tu archivo backend/main/serializers.py, actualiza el serializer:

from rest_framework import serializers
from ..models import PrediccionIA, Planta

# Si no tienes un serializer para Planta, agrega esto:
class PlantaMinimalSerializer(serializers.ModelSerializer):
    """Serializer básico para plantas (solo información mínima)."""
    class Meta:
        model = Planta
        fields = ['id', 'nombre', 'especie', 'ubicacion']


class PrediccionIASerializer(serializers.ModelSerializer):
    """Serializer para el modelo PrediccionIA."""
    # Campos de solo lectura para información relacionada
    planta_info = PlantaMinimalSerializer(source='planta', read_only=True)
    
    # Campos display para choices
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    prioridad_display = serializers.CharField(source='get_prioridad_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    
    # Métodos de conveniencia
    necesita_accion = serializers.SerializerMethodField()
    es_urgente = serializers.SerializerMethodField()
    
    class Meta:
        model = PrediccionIA
        fields = [
            'id',
            'planta',
            'planta_info',
            'tipo',
            'tipo_display',
            'recomendacion',
            'fecha_creacion',
            'confianza',
            'prioridad',
            'prioridad_display',
            'estado',
            'estado_display',
            'accion_sugerida',
            'razon',
            'metadata',
            'ejecutada_en',
            'necesita_accion',
            'es_urgente'
        ]
        read_only_fields = [
            'fecha_creacion', 
            'ejecutada_en',
            'tipo_display',
            'prioridad_display',
            'estado_display',
            'planta_info'
        ]
    
    def get_necesita_accion(self, obj):
        """Devuelve True si la predicción necesita acción."""
        return obj.necesita_accion()
    
    def get_es_urgente(self, obj):
        """Devuelve True si la predicción es urgente."""
        return obj.es_urgente()
    
    def to_representation(self, instance):
        """Personalizar representación para mejor formato."""
        representation = super().to_representation(instance)
        
        # Formatear fechas a ISO
        if instance.fecha_creacion:
            representation['fecha_creacion'] = instance.fecha_creacion.isoformat()
        
        if instance.ejecutada_en:
            representation['ejecutada_en'] = instance.ejecutada_en.isoformat()
        
        # Convertir Decimal a float para JSON
        if representation.get('confianza'):
            representation['confianza'] = float(representation['confianza'])
        
        # Si metadata es None, convertir a dict vacío
        if representation.get('metadata') is None:
            representation['metadata'] = {}
        
        return representation
    
    def validate_confianza(self, value):
        """Validar que la confianza esté entre 0 y 100."""
        if value < 0 or value > 100:
            raise serializers.ValidationError("La confianza debe estar entre 0 y 100")
        return value
    
    def validate(self, data):
        """Validaciones adicionales."""
        # Si se marca como ejecutada, establecer ejecutada_en
        if data.get('estado') == PrediccionIA.Estado.EJECUTADA and not self.instance:
            from django.utils import timezone
            data['ejecutada_en'] = timezone.now()
        
        return data