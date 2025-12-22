from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ..models import Familia, Planta, Sensor
from ..serializers import SensorSerializer, MedicionSerializer
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework import status
from datetime import datetime, timedelta
import random
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
class HumidityHistoryView(APIView):
    """Endpoint para datos históricos de humedad"""
    
    def get(self, request):
        try:
            # Generar datos realistas para las últimas 24 horas
            data = []
            now = timezone.now()
            
            # Crear 24 puntos (uno por hora)
            for i in range(24):
                hour_ago = now - timedelta(hours=i)
                hour = hour_ago.hour
                
                # Patrón diurno: más humedad por la noche
                base_humidity = 65.0
                hour_variation = 15 * (1 - abs(hour - 12) / 12)  # Máximo al mediodía
                humidity = base_humidity + hour_variation + random.uniform(-5, 5)
                humidity = max(30, min(85, humidity))  # Limitar entre 30-85%
                
                # Temperatura correlacionada
                temperature = 22.0 - (hour_variation / 8) + random.uniform(-2, 2)
                temperature = max(18, min(28, temperature))
                
                data.append({
                    'timestamp': hour_ago.isoformat(),
                    'time': hour_ago.strftime('%H:%M'),
                    'hour': hour,
                    'humidity': round(humidity, 1),
                    'temperature': round(temperature, 1),
                    'plant_id': random.randint(1, 5),
                    'plant_name': random.choice(['Suculenta Mía', 'Orquídea Blanca', 'Lavanda', 'Cactus'])
                })
            
            # Ordenar cronológicamente
            data.sort(key=lambda x: x['timestamp'])
            
            # Calcular estadísticas
            humidities = [d['humidity'] for d in data]
            temperatures = [d['temperature'] for d in data]
            
            return Response({
                'status': 'success',
                'data': data,
                'count': len(data),
                'time_range': '24_hours',
                'last_updated': timezone.now().isoformat(),
                'statistics': {
                    'avg_humidity': round(sum(humidities) / len(humidities), 1),
                    'min_humidity': round(min(humidities), 1),
                    'max_humidity': round(max(humidities), 1),
                    'avg_temperature': round(sum(temperatures) / len(temperatures), 1),
                    'trend': 'stable'
                }
            })
            
        except Exception as e:
            print(f"❌ Error en HumidityHistoryView: {str(e)}")
            return Response({
                'status': 'error',
                'message': str(e),
                'data': [],  # Devolver array vacío para evitar errores en frontend
                'statistics': {
                    'avg_humidity': 65.0,
                    'min_humidity': 45.2,
                    'max_humidity': 78.3,
                    'avg_temperature': 22.1
                }
            }, status=status.HTTP_200_OK)  # Devolver 200 aunque haya error interno