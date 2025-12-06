# main/serializers.py
from rest_framework import serializers
from ..models import Planta

class PlantaSerializer(serializers.ModelSerializer):
    # Agrega campos computados si es necesario
    idPlanta = serializers.IntegerField(source='id', read_only=True)
    
    class Meta:
        model = Planta
        fields = ['idPlanta', 'nombrePersonalizado', 'especie', 'familia', 
                 'estado', 'aspecto', 'fecha_creacion', 'descripcion', 'foto']