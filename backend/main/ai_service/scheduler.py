# main/ai_service/scheduler.py - COMPLETO
import threading
import time
from datetime import datetime

class RiegoScheduler:
    def __init__(self):
        self.is_running = False
        self.thread = None
    
    def start_scheduler(self):
        """Inicia el scheduler de riegos programados"""
        if self.is_running:
            return
        
        self.is_running = True
        self.thread = threading.Thread(target=self._scheduler_loop)
        self.thread.daemon = True
        self.thread.start()
        print("✅ Scheduler de riegos iniciado")
        return True
    
    def _scheduler_loop(self):
        """Loop principal del scheduler"""
        while self.is_running:
            try:
                self._check_scheduled_riegos()
                time.sleep(60)  # Revisar cada minuto
            except Exception as e:
                print(f"❌ Error en scheduler: {e}")
                time.sleep(30)
    
    def _check_scheduled_riegos(self):
        """Revisa riegos programados"""
        from ..models.Planta import Planta
        from ..models.Riego import Riego
        from django.utils import timezone
        
        ahora = timezone.now()
        
        # Aquí iría la lógica para revisar riegos programados
        # Por ahora solo es un simulador
        if ahora.hour == 8 and ahora.minute == 0:  # 8:00 AM
            print("⏰ Hora de riego matutino simulada")
        
        elif ahora.hour == 18 and ahora.minute == 0:  # 6:00 PM
            print("⏰ Hora de riego vespertino simulada")
    
    def stop_scheduler(self):
        """Detiene el scheduler"""
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=5)
        print("🛑 Scheduler de riegos detenido")
        return True

# ¡IMPORTANTE! Crear instancia
scheduler = RiegoScheduler()