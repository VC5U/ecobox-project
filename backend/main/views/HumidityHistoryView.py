# backend/main/views/sensor_views.py
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
import random

class HumidityHistoryView(APIView):
    """Endpoint para datos históricos de humedad para gráficos"""
    
    def get(self, request):
        try:
            # Generar datos de ejemplo para las últimas 24 horas
            data = []
            now = timezone.now()
            
            for i in range(24):  # Últimas 24 horas
                hour_ago = now - timedelta(hours=i)
                
                # Patrón de humedad: más alta por la noche, más baja al mediodía
                base_humidity = 65
                hour_variation = 15 * abs(1 - (hour_ago.hour % 12) / 6)  # Cambio según hora del día
                random_variation = random.uniform(-5, 5)
                
                humidity = base_humidity + hour_variation + random_variation
                humidity = max(30, min(85, humidity))  # Limitar entre 30-85%
                
                # Temperatura correlacionada inversamente
                temperature = 22 - (hour_variation / 10) + random.uniform(-2, 2)
                temperature = max(18, min(28, temperature))
                
                data.append({
                    'timestamp': hour_ago.isoformat(),
                    'time': hour_ago.strftime('%H:%M'),
                    'hour': hour_ago.hour,
                    'humidity': round(humidity, 1),
                    'temperature': round(temperature, 1),
                    'plant_id': random.choice([1, 2, 3, 4, 5]),
                    'plant_name': random.choice(['Suculenta Mía', 'Orquídea Blanca', 'Lavanda', 'Cactus'])
                })
            
            # Ordenar cronológicamente (más antiguo primero)
            data.sort(key=lambda x: x['timestamp'])
            
            return Response({
                'status': 'success',
                'data': data,
                'count': len(data),
                'time_range': '24_hours',
                'last_updated': timezone.now().isoformat(),
                'statistics': {
                    'avg_humidity': round(sum(d['humidity'] for d in data) / len(data), 1),
                    'min_humidity': round(min(d['humidity'] for d in data), 1),
                    'max_humidity': round(max(d['humidity'] for d in data), 1),
                    'avg_temperature': round(sum(d['temperature'] for d in data) / len(data), 1)
                }
            })
            
        except Exception as e:
            print(f"❌ Error en HumidityHistoryView: {str(e)}")
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)