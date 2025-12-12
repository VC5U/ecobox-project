import sys
import os

# Agregar el directorio raíz al path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(os.path.dirname(current_dir))
sys.path.insert(0, backend_dir)

print(f"Current dir: {current_dir}")
print(f"Backend dir: {backend_dir}")
print(f"Python path: {sys.path[:3]}")

try:
    from services import process_user_message, check_ai_status
    print("✅ Importación exitosa de services")
    
    # Probar funciones
    response = process_user_message("Hola")
    print(f"✅ Función process_user_message: {response}")
    
    status = check_ai_status()
    print(f"✅ Función check_ai_status: {status}")
    
except ImportError as e:
    print(f"❌ Error de importación: {e}")
    print("Intentando importación alternativa...")
    
    try:
        # Intentar importación relativa
        sys.path.insert(0, os.path.join(backend_dir, 'services'))
        from services import process_user_message
        print("✅ Importación alternativa exitosa")
    except ImportError as e2:
        print(f"❌ Error en importación alternativa: {e2}")
