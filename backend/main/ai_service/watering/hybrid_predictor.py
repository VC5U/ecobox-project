# main/ai_service/watering/hybrid_predictor.py
from django.utils import timezone
from datetime import datetime, timedelta
import math
from main.models import Planta, Medicion, Sensor, Riego
from main.ai_service.weather_service import weather_service

class HybridWateringPredictor:
    """
    Sistema híbrido: reglas expertas + ML básico
    Funciona HOY con datos limitados
    """
    
    # CONOCIMIENTO BOTÁNICO POR ESPECIE
    PLANT_RULES = {
        'Rosa hybrida': {
            'min_humidity': 40,    # % mínimo de humedad
            'ideal_humidity': 60,  # % ideal
            'max_humidity': 80,    # % máximo
            'watering_duration': 180,  # segundos (3 min)
            'prefers_morning': True,
            'sensitive_to_overwatering': True
        },
        'Lavandula angustifolia': {  # Lavanda
            'min_humidity': 20,    # Muy resistente a sequía
            'ideal_humidity': 40,
            'max_humidity': 60,
            'watering_duration': 120,  # 2 min
            'prefers_morning': True,
            'sensitive_to_overwatering': True
        },
        'Solanum lycopersicum': {  # Tomate
            'min_humidity': 50,    # Necesita más agua
            'ideal_humidity': 70,
            'max_humidity': 85,
            'watering_duration': 240,  # 4 min
            'prefers_morning': True,
            'water_frequently': True
        },
        'Ocimum basilicum': {  # Albahaca
            'min_humidity': 45,
            'ideal_humidity': 65,
            'max_humidity': 75,
            'watering_duration': 150,  # 2.5 min
            'prefers_morning': True,
            'likes_moisture': True
        },
        'Cactaceae': {  # Cactus
            'min_humidity': 15,    # Muy baja
            'ideal_humidity': 30,
            'max_humidity': 50,
            'watering_duration': 60,   # 1 min
            'prefers_morning': False,  # Mejor tarde
            'sensitive_to_overwatering': True
        }
    }
    
    def __init__(self):
        self.weather_service = weather_service
    
    def predict(self, plant_id):
        """
        Predice si una planta necesita riego
        Retorna: dict con decisión y razones
        """
        try:
            print(f"🌱 Prediciendo riego para planta {plant_id}")
            
            # 1. OBTENER DATOS BÁSICOS
            planta = Planta.objects.get(id=plant_id)
            current_hour = timezone.now().hour
            
            # 2. OBTENER HUMEDAD ACTUAL (el dato MÁS IMPORTANTE)
            humidity = self._get_current_humidity(plant_id)
            
            # 3. OBTENER CLIMA ACTUAL
            weather = self._get_current_weather()
            
            # 4. OBTENER ÚLTIMO RIEGO
            last_watering = self._get_last_watering(plant_id)
            
            # 5. APLICAR REGLAS HÍBRIDAS
            decision = self._apply_hybrid_rules(
                planta=planta,
                current_humidity=humidity,
                weather=weather,
                current_hour=current_hour,
                last_watering=last_watering
            )
            
            # 6. AÑADIR INFORMACIÓN ADICIONAL
            decision.update({
                'plant_id': plant_id,
                'plant_name': planta.nombrePersonalizado,
                'plant_species': planta.especie,
                'current_humidity': humidity,
                'current_hour': current_hour,
                'weather': weather.get('description', 'Desconocido'),
                'timestamp': timezone.now().isoformat()
            })
            
            print(f"✅ Decisión: {decision['action']} (confianza: {decision['confidence']:.0%})")
            return decision
            
        except Exception as e:
            print(f"❌ Error en predicción: {e}")
            # Fallback seguro
            return {
                'action': 'NO_ACTION',
                'confidence': 0.0,
                'duration_seconds': 0,
                'reason': f'Error: {str(e)[:50]}',
                'recommendation': 'Revisar sensores',
                'plant_id': plant_id,
                'timestamp': timezone.now().isoformat()
            }
    
    def _get_current_humidity(self, plant_id):
        """Obtiene la humedad actual de la planta"""
        try:
            # Buscar sensor de humedad de esta planta
            sensor = Sensor.objects.filter(
                planta_id=plant_id,
                tipo_sensor__nombre='Humedad Suelo',
                activo=True
            ).first()
            
            if sensor:
                # Última medición
                medicion = Medicion.objects.filter(
                    sensor=sensor
                ).order_by('-fecha').first()
                
                if medicion:
                    return float(medicion.valor)
            
            # Si no hay datos, usar valor por defecto basado en especie
            planta = Planta.objects.get(id=plant_id)
            rules = self.PLANT_RULES.get(planta.especie, self.PLANT_RULES['Rosa hybrida'])
            return rules['ideal_humidity'] - 10  # Asumir algo bajo
            
        except:
            return 50.0  # Valor por defecto seguro
    
    def _get_current_weather(self):
        """Obtiene clima actual"""
        try:
            return self.weather_service.get_current_weather()
        except:
            return {
                'temperature': 22.0,
                'humidity': 65,
                'description': 'Desconocido',
                'success': False
            }
    
    def _get_last_watering(self, plant_id):
        """Obtiene información del último riego"""
        try:
            last = Riego.objects.filter(
                planta_id=plant_id,
                exito=True
            ).order_by('-fecha_creacion').first()
            
            if last:
                hours_ago = (timezone.now() - last.fecha_creacion).total_seconds() / 3600
                return {
                    'hours_ago': hours_ago,
                    'duration': last.duracion_segundos,
                    'date': last.fecha_creacion
                }
        except:
            pass
        
        return {'hours_ago': 48, 'duration': 0}  # Asumir 2 días
    
    def _apply_hybrid_rules(self, planta, current_humidity, weather, current_hour, last_watering):
        """Aplica reglas híbridas para decidir riego"""
        
        # Obtener reglas para esta especie
        rules = self.PLANT_RULES.get(planta.especie, self.PLANT_RULES['Rosa hybrida'])
        
        # INICIALIZAR PUNTUACIÓN (0-100)
        score = 0
        reasons = []
        confidence_factors = []
        
        # 1. FACTOR HUMEDAD (MÁS IMPORTANTE - 50%)
        humidity_factor = self._calculate_humidity_factor(current_humidity, rules)
        score += humidity_factor * 0.5
        confidence_factors.append(humidity_factor)
        
        if humidity_factor > 0.7:
            reasons.append(f"Humedad baja ({current_humidity:.0f}% < {rules['min_humidity']}%)")
        elif humidity_factor < 0.3:
            reasons.append(f"Humedad adecuada ({current_humidity:.0f}%)")
        
        # 2. FACTOR TIEMPO DESDE ÚLTIMO RIEGO (25%)
        time_factor = self._calculate_time_factor(last_watering['hours_ago'], planta.especie)
        score += time_factor * 0.25
        confidence_factors.append(time_factor)
        
        if time_factor > 0.6:
            reasons.append(f"Han pasado {last_watering['hours_ago']:.0f}h desde último riego")
        
        # 3. FACTOR HORA DEL DÍA (15%)
        time_of_day_factor = self._calculate_time_of_day_factor(current_hour, rules)
        score += time_of_day_factor * 0.15
        confidence_factors.append(time_of_day_factor)
        
        # 4. FACTOR CLIMA (10%)
        weather_factor = self._calculate_weather_factor(weather)
        score += weather_factor * 0.10
        confidence_factors.append(weather_factor)
        
        if weather_factor > 0.7:
            reasons.append("Clima favorable (soleado/templado)")
        elif weather_factor < 0.3:
            reasons.append("Clima desfavorable (lluvia/frío)")
        
        # CALCULAR CONFIANZA (promedio de factores)
        confidence = sum(confidence_factors) / len(confidence_factors) if confidence_factors else 0.5
        
        # TOMAR DECISIÓN
        if score > 0.6 and confidence > 0.6:  # Umbral ajustable
            action = 'WATER'
            duration = self._calculate_duration(rules, current_humidity, weather)
            reason = " | ".join(reasons) if reasons else "Condiciones óptimas detectadas"
        else:
            action = 'WAIT'
            duration = 0
            reason = "Condiciones no óptimas" if not reasons else " | ".join(reasons)
        
        return {
            'action': action,
            'confidence': confidence,
            'duration_seconds': duration,
            'reason': reason,
            'recommendation': self._get_recommendation(action, planta.especie, current_humidity)
        }
    
    def _calculate_humidity_factor(self, humidity, rules):
        """Calcula factor basado en humedad (0-1)"""
        if humidity < rules['min_humidity']:
            return 1.0  # Necesita riego urgente
        elif humidity < rules['ideal_humidity']:
            # Interpolación lineal entre min e ideal
            return (rules['ideal_humidity'] - humidity) / (rules['ideal_humidity'] - rules['min_humidity'])
        else:
            return 0.0  # No necesita
    
    def _calculate_time_factor(self, hours_ago, species):
        """Factor basado en tiempo desde último riego"""
        # Especies que necesitan más agua
        thirsty_plants = ['Solanum lycopersicum', 'Ocimum basilicum']
        
        if species in thirsty_plants:
            threshold = 24  # Horas
        else:
            threshold = 48  # Horas
        
        if hours_ago > threshold:
            return min(1.0, (hours_ago - threshold) / 24)  # Normalizado
        return 0.0
    
    def _calculate_time_of_day_factor(self, hour, rules):
        """Mejor hora para regar"""
        if rules.get('prefers_morning', True):
            # Mañana (6-10 AM) es mejor
            if 6 <= hour <= 10:
                return 1.0
            elif 10 < hour <= 16:
                return 0.5  # Medio día (calor)
            else:
                return 0.7  # Tarde/noche
        else:
            # Para cactus, mejor tarde
            if 16 <= hour <= 20:
                return 1.0
            else:
                return 0.5
    
    def _calculate_weather_factor(self, weather):
        """Factor basado en clima"""
        description = weather.get('description', '').lower()
        temp = weather.get('temperature', 22)
        
        # No regar si llueve o hace mucho frío
        if 'rain' in description or 'storm' in description:
            return 0.0
        elif temp < 10:  # Muy frío
            return 0.2
        elif temp > 30:  # Muy caliente (evaporación)
            return 0.3
        else:
            return 0.8  # Clima favorable
    
    def _calculate_duration(self, rules, humidity, weather):
        """Calcula duración del riego en segundos"""
        base_duration = rules['watering_duration']
        
        # Ajustar por humedad
        humidity_ratio = max(0, (rules['min_humidity'] - humidity) / rules['min_humidity'])
        duration_adjustment = 1.0 + (humidity_ratio * 0.5)  # +50% si está muy seco
        
        # Ajustar por temperatura
        temp = weather.get('temperature', 22)
        if temp > 28:
            duration_adjustment *= 1.2  # +20% si hace calor
        elif temp < 15:
            duration_adjustment *= 0.8  # -20% si hace frío
        
        return int(base_duration * duration_adjustment)
    
    def _get_recommendation(self, action, species, humidity):
        """Genera recomendación amigable"""
        if action == 'WATER':
            return f"Recomendado regar {species}. Humedad actual: {humidity:.0f}%"
        else:
            return f"Esperar. {species} tiene humedad adecuada ({humidity:.0f}%)"