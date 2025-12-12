# backend/services/__init__.py
print("📦 Inicializando paquete services (OpenAI v2.x)")

try:
    from .ai_service import (
        process_user_message,
        analyze_plant_health,
        get_daily_recommendations,
        check_ai_status
    )
    
    print("✅ Servicios de IA cargados correctamente")
    
    __all__ = [
        'process_user_message',
        'analyze_plant_health',
        'get_daily_recommendations',
        'check_ai_status'
    ]
    
except ImportError as e:
    print(f"❌ Error importando servicios: {e}")
    import traceback
    traceback.print_exc()
    
    # Funciones dummy como respaldo
    from django.utils import timezone
    
    def process_user_message(message, user_id=None, plant_id=None):
        return {
            'text': f'🌿 Servicio temporal: "{message}"',
            'timestamp': timezone.now().isoformat()
        }
    
    def check_ai_status():
        return {
            'status': 'error',
            'timestamp': timezone.now().isoformat()
        }
    
    # Exportar las funciones dummy
    __all__ = ['process_user_message', 'check_ai_status']