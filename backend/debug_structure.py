# Crea un archivo llamado debug_structure.py en la carpeta backend/
import os
import sys

print("🔍 DIAGNÓSTICO DE ESTRUCTURA DE BACKEND")
print("=" * 50)

# 1. Verificar ubicación actual
current_dir = os.getcwd()
print(f"📁 Directorio actual: {current_dir}")

# 2. Verificar archivos esenciales
essential_files = [
    'manage.py',
    '.env',
    'services/__init__.py',
    'services/ai_service.py',
    'api/ai/views.py'
]

for file in essential_files:
    path = os.path.join(current_dir, file)
    exists = os.path.exists(path)
    status = "✅ EXISTE" if exists else "❌ NO EXISTE"
    print(f"{status} {file}")

# 3. Verificar contenido de .env
print("\n🔐 CONTENIDO DE .env:")
try:
    with open(os.path.join(current_dir, '.env'), 'r') as f:
        content = f.read()
        # Ocultar API key completa por seguridad
        if 'OPENAI_API_KEY' in content:
            lines = content.split('\n')
            for line in lines:
                if 'OPENAI_API_KEY' in line:
                    parts = line.split('=')
                    if len(parts) > 1:
                        key_value = parts[1]
                        print(f"OPENAI_API_KEY encontrada (longitud: {len(key_value)})")
                        print(f"Primeros 10 chars: {key_value[:10]}...")
        else:
            print("❌ OPENAI_API_KEY no encontrada en .env")
except Exception as e:
    print(f"❌ Error leyendo .env: {e}")

# 4. Verificar Python path
print("\n🐍 PYTHON PATH:")
for path in sys.path:
    if 'ecobox' in path or 'backend' in path:
        print(f"  {path}")

# 5. Verificar imports
print("\n📦 INTENTANDO IMPORTS:")
try:
    import openai
    print(f"✅ openai version: {openai.__version__}")
except ImportError as e:
    print(f"❌ openai no instalado: {e}")

try:
    from dotenv import load_dotenv
    print("✅ python-dotenv instalado")
except ImportError as e:
    print(f"❌ python-dotenv no instalado: {e}")

print("\n" + "=" * 50)
print("✅ Diagnóstico completado")