# backend/ai_service/monitor.py
import threading
import time
from datetime import timedelta
from django.utils import timezone
from django.db import connection

class MonitoringService:
    def __init__(self):
        self.is_running = False
        self.check_interval = 300  # 5 minutos
        self.thread = None
    
    def start_monitoring(self):
        """Inicia el monitoreo en segundo plano"""
        if self.is_running:
            return
        
        self.is_running = True
        self.thread = threading.Thread(target=self._monitoring_loop)
        self.thread.daemon = True
        self.thread.start()
        print("✅ Servicio de monitoreo iniciado")
    
    def _monitoring_loop(self):
        """Loop principal de monitoreo"""
        while self.is_running:
            try:
                self._check_all_plants()
                time.sleep(self.check_interval)
            except Exception as e:
                print(f"❌ Error en monitoreo: {e}")
                time.sleep(60)  # Esperar 1 minuto si hay error
    
    def _check_all_plants(self):
        """Revisa todas las plantas"""
        from ..models.Planta import Planta
        
        plantas = Planta.objects.all()
        
        for planta in plantas:
            self._check_plant(planta)
    
    def _check_plant(self, planta):
        """Revisa una planta específica"""
        # Obtener última humedad
        query = """
        SELECT m.valor, m.fecha
        FROM medicion m
        JOIN main_sensor s ON m.sensor_id = s.id
        JOIN tipo_sensor ts ON s.tipo_sensor_id = ts.id
        WHERE s.planta_id = %s 
            AND ts.nombre = 'Humedad'
            AND s.activo = true
        ORDER BY m.fecha DESC
        LIMIT 1
        """
        
        with connection.cursor() as cursor:
            cursor.execute(query, [planta.id])
            resultado = cursor.fetchone()
        
        if not resultado:
            # Sin datos del sensor
            self._crear_alerta(
                planta.id,
                'INFO',
                'No hay datos del sensor de humedad'
            )
            return
        
        humedad = float(resultado[0])
        fecha_medicion = resultado[1]
        tiempo_transcurrido = timezone.now() - fecha_medicion
        
        # Verificar condiciones
        if humedad < 20:
            self._crear_alerta(
                planta.id,
                'CRITICA',
                f'Humedad crítica: {humedad}%. Necesita riego inmediato.'
            )
            self._activar_riego_emergencia(planta.id)
            
        elif humedad < 30:
            self._crear_alerta(
                planta.id,
                'ADVERTENCIA',
                f'Humedad baja: {humedad}%. Considerar riego pronto.'
            )
            
        elif tiempo_transcurrido > timedelta(hours=2):
            self._crear_alerta(
                planta.id,
                'INFO',
                f'Sin datos recientes. Última medición hace {tiempo_transcurrido.seconds//3600} horas.'
            )
    
    def _crear_alerta(self, planta_id, tipo, mensaje):
        """Crea una alerta en la base de datos"""
        from ..models.AlertaPlanta import AlertaPlanta
        
        # Verificar si ya existe una alerta similar no resuelta
        alerta_existente = AlertaPlanta.objects.filter(
            planta_id=planta_id,
            mensaje__contains=mensaje[:100],  # Comparar parte del mensaje
            resuelta=False
        ).first()
        
        if not alerta_existente:
            AlertaPlanta.objects.create(
                planta_id=planta_id,
                tipo_alerta=tipo,
                mensaje=mensaje
            )
            print(f"📢 Alerta {tipo} creada para planta {planta_id}")
    
    def _activar_riego_emergencia(self, planta_id):
        """Activa riego de emergencia"""
        from ..models.Riego import Riego
        
        # Calcular duración basada en humedad
        duracion = self._calcular_duracion_riego(planta_id)
        
        # Crear registro en BD
        riego = Riego.objects.create(
            planta_id=planta_id,
            duracion=duracion,
            cantidad_agua=duracion * 10,  # 10ml por segundo
            fecha=timezone.now()
        )
        
        # Aquí iría la activación del hardware
        print(f"💧 ACTIVANDO RIEGO DE EMERGENCIA para planta {planta_id} - {duracion}s")
        
        return riego
    
    def _calcular_duracion_riego(self, planta_id):
        """Calcula duración de riego basado en humedad actual"""
        # Obtener humedad actual
        query = """
        SELECT m.valor
        FROM medicion m
        JOIN main_sensor s ON m.sensor_id = s.id
        JOIN tipo_sensor ts ON s.tipo_sensor_id = ts.id
        WHERE s.planta_id = %s 
            AND ts.nombre = 'Humedad Suelo'
            AND s.activo = true
        ORDER BY m.fecha DESC
        LIMIT 1
        """
        
        with connection.cursor() as cursor:
            cursor.execute(query, [planta_id])
            resultado = cursor.fetchone()
        
        if not resultado:
            return 30  # Default
        
        humedad = float(resultado[0])
        
        # Lógica de duración según humedad
        if humedad < 10:
            return 90  # 90 segundos
        elif humedad < 15:
            return 75  # 75 segundos
        elif humedad < 20:
            return 60  # 60 segundos
        elif humedad < 25:
            return 45  # 45 segundos
        else:
            return 30  # 30 segundos
    
    def activar_riego_emergencia(self, planta_id, duracion=30):
        """Método público para activar riego"""
        from ..models.Riego import Riego
        
        # Crear registro
        riego = Riego.objects.create(
            planta_id=planta_id,
            duracion=duracion,
            cantidad_agua=duracion * 10,
            fecha=timezone.now()
        )
        
        # Simular activación hardware
        print(f"💧 RIEGO MANUAL activado para planta {planta_id} - {duracion}s")
        
        # Resolver alertas si existen
        from ..models.AlertaPlanta import AlertaPlanta
        alertas_resueltas = AlertaPlanta.objects.filter(
            planta_id=planta_id,
            resuelta=False,
            tipo_alerta__in=['CRITICA', 'ADVERTENCIA']
        ).update(
            resuelta=True,
            fecha_resolucion=timezone.now()
        )
        
        if alertas_resueltas:
            print(f"✅ {alertas_resueltas} alertas resueltas")
        
        return riego
    
    def stop_monitoring(self):
        """Detiene el monitoreo"""
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=5)
        print("🛑 Servicio de monitoreo detenido")
        
monitor = MonitoringService()