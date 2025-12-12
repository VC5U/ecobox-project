# backend/test_openai_v2.py
"""
Prueba de OpenAI versión >= 1.0.0
"""
import os
import sys
from dotenv import load_dotenv

print("🧪 Probando OpenAI v2.x")
print("=" * 50)

# Cargar variables de entorno
load_dotenv()

API_KEY = os.getenv('OPENAI_API_KEY')
print(f"📋 API Key: {'SI' if API_KEY else 'NO'}")

if API_KEY:
    try:
        from openai import OpenAI
        
        # Inicializar cliente
        client = OpenAI(api_key=API_KEY)
        print("✅ Cliente OpenAI creado")
        
        # Probar con nueva API
        print("🔍 Enviando prueba...")
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Responde solo con 'TEST OK'"},
                {"role": "user", "content": "Hola"}
            ],
            max_tokens=10
        )
        
        result = response.choices[0].message.content
        print(f"✅ OpenAI funciona: {result}")
        print(f"📊 Tokens usados: {response.usage.total_tokens}")
        
        # Probar nuestro servicio
        print("\n🧪 Probando nuestro servicio...")
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        
        from services import process_user_message, check_ai_status
        
        print("✅ Servicios importados")
        
        # Probar process_user_message
        test_message = "¿Cómo cuido mis plantas?"
        print(f"📩 Probando con: '{test_message}'")
        
        result = process_user_message(test_message)
        print(f"📦 Resultado: {result['text'][:100]}...")
        print(f"🎯 Intención: {result.get('intent', 'N/A')}")
        print(f"📈 Confianza: {result.get('confidence', 'N/A')}")
        
        # Probar check_ai_status
        print("\n🔍 Probando check_ai_status...")
        status = check_ai_status()
        print(f"📊 Estado: {status.get('status', 'N/A')}")
        print(f"🔗 OpenAI conectado: {status.get('openai_connected', False)}")
        
    except ImportError as e:
        print(f"❌ Error importando OpenAI: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
else:
    print("❌ No hay API key en .env")

print("\n✅ Prueba completada")