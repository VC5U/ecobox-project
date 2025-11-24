from rest_framework import serializers
from ..models import LogSistema

class LogSistemaSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogSistema
        fields = '__all__'