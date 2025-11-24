from rest_framework import serializers
from ..models import PrediccionIA

class PrediccionIASerializer(serializers.ModelSerializer):
    class Meta:
        model = PrediccionIA
        fields = '__all__'