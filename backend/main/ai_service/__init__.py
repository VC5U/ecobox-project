# main/ai_service/__init__.py - VERSIÓN CORREGIDA
from .predictor import predictor
from .monitor import monitor
from .scheduler import scheduler  # ¡Ya es una instancia!

# SOLO importa las instancias, NO las clases
__all__ = ['predictor', 'monitor', 'scheduler']

print("📦 Inicializando servicios de IA")