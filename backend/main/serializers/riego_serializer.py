from rest_framework import serializers
from ..models import Riego

class RiegoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Riego
        fields = '__all__'