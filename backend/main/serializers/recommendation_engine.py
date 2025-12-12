# backend/services/recommendation_engine.py
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Avg, Max, Min, Count
import json

class RecommendationEngine:
    """
    Motor de recomendaciones basado en análisis de datos de sensores.
    Genera recomendaciones proactivas para el cuidado de plantas.
    """
    
    # Umbrales de alerta (ajustar según necesidades)
    THRESHOLDS = {
        'soil_humidity': {
            'critical_low': 20,   # Necesita riego urgente
            'low': 30,            # Considerar riego pronto
            'optimal_min': 40,
            'optimal_max': 70,
            'high': 80,           # Riesgo de exceso
            'critical_high': 90   # Peligro de podredumbre
        },
        'temperature': {
            'critical_low': 10,
            'low': 15,
            'optimal_min': 18,
            'optimal_max': 28,
            'high': 32,
            'critical_high': 35
        },
        'humidity': {
            'low': 30,
            'optimal_min': 40,
            'optimal_max': 70,
            'high': 85
        }
    }
    
    @staticmethod
    def analyze_plant(planta) -> List[Dict]:
        """
        Analiza una planta y genera recomendaciones.
        
        Args:
            planta: Instancia del modelo Planta
            
        Returns:
            Lista de recomendaciones
        """
        recommendations = []
        
        try:
            from ..models import Medicion, Configuracion
            
            # 1. Obtener datos recientes (últimas 24 horas)
            time_threshold = timezone.now() - timedelta(hours=24)
            recent_measurements = Medicion.objects.filter(
                sensor__planta=planta,
                fechaHora__gte=time_threshold
            ).order_by('fechaHora')
            
            if not recent_measurements.exists():
                recommendations.append(
                    RecommendationEngine._create_no_data_recommendation(planta)
                )
                return recommendations
            
            # 2. Obtener última medición
            last_measurement = recent_measurements.last()
            
            # 3. Obtener configuración ideal
            ideal_config = Configuracion.objects.filter(
                tipoPlanta=planta.tipoPlanta
            ).first()
            
            # 4. Generar recomendaciones basadas en datos
            if last_measurement.valor:  # Asumiendo que valor es la humedad
                hum_recommendations = RecommendationEngine._analyze_humidity(
                    planta, last_measurement.valor, ideal_config
                )
                recommendations.extend(hum_recommendations)
            
            # 5. Análisis de tendencias si hay suficientes datos
            if recent_measurements.count() >= 3:
                trend_recommendations = RecommendationEngine._analyze_trends(
                    planta, recent_measurements
                )
                recommendations.extend(trend_recommendations)
            
            # 6. Recomendación preventiva si no hay problemas
            if not recommendations:
                recommendations.append(
                    RecommendationEngine._create_preventive_recommendation(planta)
                )
            
        except Exception as e:
            print(f"Error analizando planta {planta.id}: {e}")
            recommendations.append({
                'type': 'ERROR',
                'priority': 'MEDIA',
                'message': 'Error en análisis',
                'suggested_action': 'Revisar sistema',
                'reason': str(e),
                'confidence': 0.3
            })
        
        return recommendations
    
    @staticmethod
    def _analyze_humidity(planta, current_humidity: float, ideal_config) -> List[Dict]:
        """Analiza humedad del suelo y genera recomendaciones."""
        recommendations = []
        thresholds = RecommendationEngine.THRESHOLDS['soil_humidity']
        
        # Usar configuración ideal si existe, sino umbrales por defecto
        min_ideal = getattr(ideal_config, 'humedadMin', thresholds['optimal_min'])
        max_ideal = getattr(ideal_config, 'humedadMax', thresholds['optimal_max'])
        
        if current_humidity < thresholds['critical_low']:
            recommendations.append({
                'type': 'RIEGO',
                'priority': 'ALTA',
                'message': f'RIEGO DE EMERGENCIA REQUERIDO - {planta.nombre}',
                'suggested_action': f'Regar inmediatamente con 200-300ml de agua',
                'reason': f'Humedad crítica del suelo: {current_humidity}% (mínimo seguro: {thresholds["critical_low"]}%)',
                'confidence': 0.98,
                'metadata': {
                    'current_humidity': current_humidity,
                    'threshold': thresholds['critical_low'],
                    'plant_type': planta.tipoPlanta
                }
            })
        
        elif current_humidity < min_ideal:
            recommendations.append({
                'type': 'RIEGO',
                'priority': 'MEDIA',
                'message': f'Riego recomendado para {planta.nombre}',
                'suggested_action': f'Regar en las próximas horas con 150-200ml',
                'reason': f'Humedad baja: {current_humidity}% (óptimo mínimo: {min_ideal}%)',
                'confidence': 0.85,
                'metadata': {
                    'current_humidity': current_humidity,
                    'optimal_min': min_ideal
                }
            })
        
        elif current_humidity > thresholds['critical_high']:
            recommendations.append({
                'type': 'RIEGO',
                'priority': 'ALTA',
                'message': f'EXCESO DE AGUA DETECTADO - {planta.nombre}',
                'suggested_action': 'Suspender riego, mejorar drenaje, revisar raíces',
                'reason': f'Humedad peligrosamente alta: {current_humidity}% (máximo seguro: {thresholds["critical_high"]}%)',
                'confidence': 0.95,
                'metadata': {
                    'current_humidity': current_humidity,
                    'threshold': thresholds['critical_high']
                }
            })
        
        return recommendations
    
    @staticmethod
    def _analyze_trends(planta, measurements) -> List[Dict]:
        """Analiza tendencias en los datos."""
        recommendations = []
        
        try:
            # Calcular tasa de cambio de humedad
            values = list(measurements.values_list('valor', flat=True))
            times = list(measurements.values_list('fechaHora', flat=True))
            
            if len(values) >= 2:
                # Calcular cambio por hora
                time_diff = (times[-1] - times[0]).total_seconds() / 3600
                if time_diff > 0:
                    humidity_change = values[-1] - values[0]
                    change_per_hour = humidity_change / time_diff
                    
                    # Si la humedad baja rápidamente
                    if change_per_hour < -1.5:  # Baja más de 1.5% por hora
                        hours_to_critical = (values[-1] - 30) / abs(change_per_hour)
                        
                        if hours_to_critical < 12:
                            recommendations.append({
                                'type': 'RIEGO',
                                'priority': 'ALTA',
                                'message': f'Pérdida rápida de humedad detectada',
                                'suggested_action': 'Monitorear de cerca, regar pronto',
                                'reason': f'Humedad bajando {abs(change_per_hour):.1f}% por hora. Llegará a 30% en ~{hours_to_critical:.1f} horas',
                                'confidence': 0.75,
                                'metadata': {
                                    'trend': change_per_hour,
                                    'hours_to_critical': hours_to_critical
                                }
                            })
        
        except Exception as e:
            print(f"Error analizando tendencias: {e}")
        
        return recommendations
    
    @staticmethod
    def _create_no_data_recommendation(planta) -> Dict:
        """Crea recomendación cuando no hay datos."""
        return {
            'type': 'MONITOREO',
            'priority': 'MEDIA',
            'message': f'Sin datos recientes de {planta.nombre}',
            'suggested_action': 'Verificar conexión de sensores',
            'reason': 'No hay mediciones en las últimas 24 horas',
            'confidence': 0.6,
            'metadata': {'data_available': False}
        }
    
    @staticmethod
    def _create_preventive_recommendation(planta) -> Dict:
        """Crea recomendación preventiva cuando todo está bien."""
        return {
            'type': 'PREVENTIVO',
            'priority': 'BAJA',
            'message': f'{planta.nombre} está en buenas condiciones',
            'suggested_action': 'Continuar cuidados rutinarios',
            'reason': 'Todos los parámetros están dentro de rangos óptimos',
            'confidence': 0.9,
            'metadata': {'status': 'optimal'}
        }