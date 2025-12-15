from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ..models import Familia, Planta, Sensor
from ..serializers import SensorSerializer, MedicionSerializer

class SensorViewSet(viewsets.ModelViewSet):
    queryset = Sensor.objects.all()
    serializer_class = SensorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        planta_id = self.request.query_params.get('planta')
        
        print(f"🎯 FILTRANDO SENSORES - Usuario: {user}")
        print(f"🎯 Parámetro 'planta' recibido: {planta_id}")
        
        if user.is_authenticated:
            # Obtener familias del usuario
            familias_usuario = Familia.objects.filter(miembros__usuario=user)
            
            # Obtener plantas del usuario
            plantas_usuario = Planta.objects.filter(familia__in=familias_usuario)
            
            # SIEMPRE filtrar por plantas del usuario
            queryset = Sensor.objects.filter(planta__in=plantas_usuario)
            
            # FILTRAR ADICIONALMENTE por planta si se especifica
            if planta_id:
                try:
                    planta_id_int = int(planta_id)
                    queryset = queryset.filter(planta_id=planta_id_int)
                    print(f"🎯 Filtrado extra por planta_id: {planta_id_int}")
                except ValueError:
                    print(f"⚠️ Error: planta_id no es un número válido: {planta_id}")
            
            print(f"🎯 Total sensores encontrados: {queryset.count()}")
            return queryset
        
        return Sensor.objects.none()

    @action(detail=True, methods=['get'])
    def historial_mediciones(self, request, pk=None):
        sensor = self.get_object()
        limit = request.query_params.get('limit', 50)
        mediciones = sensor.mediciones.order_by('-fecha')[:int(limit)]
        serializer = MedicionSerializer(mediciones, many=True)
        return Response(serializer.data)