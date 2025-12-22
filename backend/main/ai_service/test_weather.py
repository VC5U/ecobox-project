# test_weather.py
import requests
import json
from django.conf import settings

def test_openweather_api():
    API_KEY = 'b1b15e88fa797225412429c1c50c122a1'  # Tu clave
    CITY = "Madrid"  # Puedes cambiar la ciudad
    
    # URL para clima actual
    url = f"http://api.openweathermap.org/data/2.5/weather"
    
    params = {
        'q': CITY,
        'appid': API_KEY,
        'units': 'metric',  # Para temperatura en Celsius
        'lang': 'es'        # Para descripciones en español
    }
    
    try:
        print(f"🔍 Probando API de OpenWeather para: {CITY}")
        print(f"📡 URL: {url}")
        print(f"🔑 Usando clave: {API_KEY[:8]}...{API_KEY[-4:]}")
        
        response = requests.get(url, params=params, timeout=10)
        
        print(f"\n📊 RESPUESTA DEL SERVIDOR:")
        print(f"✅ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\n🌤️  DATOS DEL CLIMA OBTENIDOS:")
            print(f"📍 Ciudad: {data['name']}, {data['sys']['country']}")
            print(f"🌡️  Temperatura: {data['main']['temp']}°C")
            print(f"💧 Humedad: {data['main']['humidity']}%")
            print(f"☁️  Condición: {data['weather'][0]['description'].capitalize()}")
            print(f"💨 Viento: {data['wind']['speed']} m/s")
            print(f"🎯 Coordenadas: Lat {data['coord']['lat']}, Lon {data['coord']['lon']}")
            
            # Guardar respuesta en archivo para revisión
            with open('weather_test_response.json', 'w') as f:
                json.dump(data, f, indent=2)
            print(f"\n💾 Respuesta guardada en 'weather_test_response.json'")
            
            return True
            
        elif response.status_code == 401:
            print(f"\n❌ ERROR 401: Clave API inválida o no autorizada")
            print("⚠️  Verifica que tu clave esté activa en OpenWeather Dashboard")
            
        elif response.status_code == 429:
            print(f"\n⚠️  ADVERTENCIA 429: Límite de solicitudes excedido")
            print("   El plan free tiene límite de 60 llamadas por minuto")
            
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(f"Respuesta: {response.text[:200]}")
            
    except requests.exceptions.ConnectionError:
        print(f"\n❌ ERROR DE CONEXIÓN: No se pudo conectar a OpenWeather")
        print("   Verifica tu conexión a internet")
        
    except requests.exceptions.Timeout:
        print(f"\n⏱️  TIMEOUT: La solicitud tardó demasiado")
        
    except Exception as e:
        print(f"\n⚠️  Error inesperado: {str(e)}")
    
    return False

# También puedes probar desde terminal con:
def test_from_terminal():
    """
    Ejecuta en terminal: python -c "import requests; print(requests.get('http://api.openweathermap.org/data/2.5/weather?q=Madrid&appid=21a0d3f520c943b21f594f4b7101681a&units=metric').json())"
    """
    pass

if __name__ == "__main__":
    success = test_openweather_api()
    
    if success:
        print("\n" + "="*50)
        print("✅ ¡PRUEBA EXITOSA!")
        print("="*50)
        print("\n🎯 Tu clave API de OpenWeather funciona correctamente.")
        print("   Ahora puedes integrarla con el servicio de clima de EcoBox.")
    else:
        print("\n" + "="*50)
        print("❌ PRUEBA FALLIDA")
        print("="*50)
        print("\n⚠️  Revisa tu clave API y conexión a internet.")