# main/ai_service/weather_service.py
import requests
import logging
from django.conf import settings
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class WeatherService:
    """
    Servicio para obtener condiciones climáticas externas
    """
    
    def __init__(self):
        self.api_key = getattr(settings, 'WEATHER_API_KEY', '21a0d3f520c943b21f594f4b7101681a')
        self.base_url = "https://api.openweathermap.org/data/2.5"
        
    def get_current_weather(self, city="Madrid", lat=None, lon=None):
        """
        Obtiene condiciones climáticas actuales
        """
        if not self.api_key or self.api_key == 'TU_CLAVE_AQUI':
            logger.warning("Weather API key no configurada, usando datos simulados")
            return self.get_mock_weather(city)
        
        try:
            params = {
                'appid': self.api_key,
                'units': 'metric',
                'lang': 'es'
            }
            
            # Usar coordenadas o nombre de ciudad
            if lat and lon:
                params['lat'] = lat
                params['lon'] = lon
            else:
                params['q'] = city
            
            response = requests.get(
                f"{self.base_url}/weather",
                params=params,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'temperature': data['main']['temp'],
                    'humidity': data['main']['humidity'],
                    'pressure': data['main']['pressure'],
                    'description': data['weather'][0]['description'],
                    'wind_speed': data['wind']['speed'],
                    'city': data['name'],
                    'country': data['sys']['country'],
                    'success': True,
                    'timestamp': datetime.now().isoformat()
                }
            else:
                logger.error(f"Error API clima: {response.status_code} - {response.text}")
                return self.get_mock_weather(city)
                
        except Exception as e:
            logger.error(f"Error obteniendo clima: {str(e)}")
            return self.get_mock_weather(city)
    
    def get_mock_weather(self, city="Madrid"):
        """
        Datos de clima simulados para desarrollo
        """
        from datetime import datetime
        
        hour = datetime.now().hour
        
        # Simular variaciones basadas en hora del día
        if hour < 6:
            temp = 15  # Madrugada fresca
            humidity = 80
            description = "Despejado"
        elif hour < 12:
            temp = 22  # Mañana templada
            humidity = 60
            description = "Parcialmente nublado"
        elif hour < 18:
            temp = 28  # Tarde cálida
            humidity = 45
            description = "Soleado"
        else:
            temp = 20  # Noche fresca
            humidity = 70
            description = "Despejado"
        
        # Pequeña variación aleatoria
        import random
        temp += random.uniform(-2, 2)
        humidity += random.randint(-5, 5)
        
        return {
            'temperature': round(temp, 1),
            'humidity': humidity,
            'pressure': 1013,
            'description': description,
            'wind_speed': round(random.uniform(0.5, 5.0), 1),
            'city': city,
            'country': 'ES',
            'success': False,  # Indica que son datos simulados
            'timestamp': datetime.now().isoformat(),
            'source': 'mock_data'
        }
    
    def get_weather_forecast(self, city="Madrid", days=1):
        """
        Obtiene pronóstico para los próximos días
        """
        # Implementación simple para desarrollo
        current = self.get_current_weather(city)
        
        forecast = []
        for i in range(days):
            forecast.append({
                'day': i,
                'date': (datetime.now().date()).isoformat(),
                'temp_max': current['temperature'] + 2,
                'temp_min': current['temperature'] - 2,
                'description': current['description'],
                'rain_probability': 10 + i * 5
            })
        
        return {
            'city': city,
            'forecast': forecast,
            'success': current['success']
        }


# Instancia global del servicio de clima
weather_service = WeatherService()