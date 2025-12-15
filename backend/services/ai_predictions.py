# backend/services/ai_predictions.py
"""
Servicio avanzado de predicciones de IA para EcoBox.
Genera predicciones inteligentes basadas en datos de sensores, riegos y contexto histórico.
"""
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from django.utils import timezone
from django.db.models import Avg, Max, Min, Count, Q

logger = logging.getLogger(__name__)

print("🤖 Inicializando servicio de predicciones avanzadas")

class AIPredictionService:
    """Servicio avanzado de predicciones de IA para plantas"""
    
    def __init__(self):
        self.context_cache = {}
        self.plant_knowledge_base = self._load_plant_knowledge()
    
    def _load_plant_knowledge(self) -> Dict:
        """Base de conocimiento de plantas comunes"""
        return {
            'tomate': {
                'type': 'hortaliza',
                'water_needs': 'alta',
                'ideal_temp_range': (20, 28),
                'ideal_humidity_range': (60, 75),
                'common_problems': ['pulgones', 'mildiu', 'carencia_calcio'],
                'watering_frequency_days': 2,
                'watering_amount_ml': 500
            },
            'albahaca': {
                'type': 'aromatica',
                'water_needs': 'media',
                'ideal_temp_range': (18, 25),
                'ideal_humidity_range': (50, 70),
                'common_problems': ['pulgones', 'hongos', 'exceso_agua'],
                'watering_frequency_days': 3,
                'watering_amount_ml': 300
            },
            'lavanda': {
                'type': 'aromatica',
                'water_needs': 'baja',
                'ideal_temp_range': (15, 25),
                'ideal_humidity_range': (40, 60),
                'common_problems': ['exceso_agua', 'falta_luz'],
                'watering_frequency_days': 7,
                'watering_amount_ml': 200
            },
            'cactus': {
                'type': 'suculenta',
                'water_needs': 'muy_baja',
                'ideal_temp_range': (20, 35),
                'ideal_humidity_range': (30, 50),
                'common_problems': ['exceso_agua', 'hongos'],
                'watering_frequency_days': 14,
                'watering_amount_ml': 100
            },
            'orquidea': {
                'type': 'ornamental',
                'water_needs': 'media',
                'ideal_temp_range': (18, 25),
                'ideal_humidity_range': (50, 80),
                'common_problems': ['exceso_agua', 'falta_humedad'],
                'watering_frequency_days': 5,
                'watering_amount_ml': 200
            }
        }
    
    def get_plant_knowledge(self, plant_name: str) -> Dict:
        """Obtiene conocimiento específico de una planta por su nombre"""
        plant_name_lower = plant_name.lower()
        
        # Buscar coincidencias parciales
        for key, knowledge in self.plant_knowledge_base.items():
            if key in plant_name_lower or plant_name_lower in key:
                return knowledge
        
        # Default para plantas no identificadas
        return {
            'type': 'general',
            'water_needs': 'media',
            'ideal_temp_range': (18, 25),
            'ideal_humidity_range': (50, 70),
            'common_problems': ['generico'],
            'watering_frequency_days': 5,
            'watering_amount_ml': 300
        }
    
    def create_plant_context(self, plant_id: int) -> Dict:
        """Crea un contexto enriquecido para una planta específica"""
        
        try:
            from main.models import Planta, Sensor, Riego, Medicion, PrediccionIA
            
            planta = Planta.objects.get(id=plant_id)
            
            # Obtener mediciones recientes de sensores
            sensores = planta.sensores.filter(activo=True)
            mediciones_recientes = {}
            
            for sensor in sensores:
                ultima_medicion = sensor.mediciones.order_by('-fecha').first()
                if ultima_medicion:
                    mediciones_recientes[sensor.tipo_sensor.nombre] = {
                        'valor': float(ultima_medicion.valor),
                        'unidad': sensor.tipo_sensor.unidad_medida,
                        'fecha': ultima_medicion.fecha
                    }
            
            # Obtener riegos recientes (últimos 5)
            riegos_recientes = planta.riegos.order_by('-fecha')[:5]
            ultimo_riego = riegos_recientes.first()
            
            # Calcular estadísticas de riego
            ahora = timezone.now()
            hace_7_dias = ahora - timedelta(days=7)
            
            riegos_ultima_semana = planta.riegos.filter(fecha__gte=hace_7_dias)
            frecuencia_riego = riegos_ultima_semana.count() / 7 if riegos_ultima_semana.count() > 0 else 0
            
            # Obtener predicciones anteriores
            predicciones_recientes = PrediccionIA.objects.filter(
                planta=planta
            ).order_by('-fecha_creacion')[:3]
            
            # Conocimiento específico de la planta
            plant_knowledge = self.get_plant_knowledge(planta.especie)
            
            context = {
                'planta': {
                    'id': planta.id,
                    'nombre': planta.nombrePersonalizado,
                    'especie': planta.especie,
                    'estado': planta.estado,
                    'aspecto': planta.aspecto,
                    'familia': str(planta.familia) if hasattr(planta, 'familia') and planta.familia else None,
                    'fecha_creacion': planta.fecha_creacion.isoformat() if planta.fecha_creacion else None,
                },
                'conocimiento_planta': plant_knowledge,
                'condiciones_actuales': mediciones_recientes,
                'historial_riego': {
                    'ultimo_riego': {
                        'fecha': ultimo_riego.fecha if ultimo_riego else None,
                        'cantidad_agua': float(ultimo_riego.cantidad_agua) if ultimo_riego and ultimo_riego.cantidad_agua else None,
                        'duracion': ultimo_riego.duracion if ultimo_riego else None
                    },
                    'frecuencia_semanal': round(frecuencia_riego, 2),
                    'total_semana': riegos_ultima_semana.count(),
                    'promedio_diario': round(frecuencia_riego / 7, 2) if frecuencia_riego > 0 else 0,
                },
                'predicciones_anteriores': [
                    {
                        'tipo': p.tipo,
                        'recomendacion': p.recomendacion[:100] + '...' if len(p.recomendacion) > 100 else p.recomendacion,
                        'estado': p.estado,
                        'fecha': p.fecha_creacion.isoformat(),
                        'confianza': float(p.confianza)
                    }
                    for p in predicciones_recientes
                ],
                'necesita_atencion': planta.estado in ['necesita_agua', 'peligro'],
                'fecha_analisis': ahora.isoformat(),
                'analisis_id': f"analysis_{plant_id}_{int(ahora.timestamp())}"
            }
            
            self.context_cache[plant_id] = context
            return context
            
        except Exception as e:
            logger.error(f"Error creando contexto para planta {plant_id}: {e}")
            return {
                'error': str(e),
                'planta_id': plant_id,
                'timestamp': timezone.now().isoformat()
            }
    
    def predict_watering_needs(self, plant_id: int) -> Dict:
        """Predice necesidades de riego específicas para una planta"""
        context = self.create_plant_context(plant_id)
        
        if 'error' in context:
            return {
                'error': context['error'],
                'recomendacion': 'No se pudo analizar las necesidades de riego',
                'confianza': 0.0
            }
        
        # Inicializar variables
        confianza = 75.0
        recomendacion = ""
        accion_sugerida = ""
        razon = ""
        prioridad = "MEDIA"
        
        condiciones = context['condiciones_actuales']
        historial = context['historial_riego']
        conocimiento = context['conocimiento_planta']
        planta_info = context['planta']
        
        # 1. Verificar humedad del suelo (si hay sensor)
        humedad_suelo = condiciones.get('humedad_suelo', {}).get('valor')
        ultimo_riego = historial['ultimo_riego']['fecha']
        
        if humedad_suelo is not None:
            # Lógica basada en humedad del suelo
            if humedad_suelo < 30:
                recomendacion = "RIEGO URGENTE NECESARIO"
                accion_sugerida = f"Regar inmediatamente con {conocimiento['watering_amount_ml']}ml de agua"
                razon = f"Humedad del suelo crítica ({humedad_suelo}%)"
                confianza = 92.0
                prioridad = "ALTA"
            elif humedad_suelo < 50:
                recomendacion = "Riego recomendado en las próximas 12 horas"
                accion_sugerida = f"Regar con {int(conocimiento['watering_amount_ml'] * 0.8)}ml de agua"
                razon = f"Humedad del suelo baja ({humedad_suelo}%)"
                confianza = 85.0
                prioridad = "MEDIA"
            else:
                recomendacion = "No es necesario regar ahora"
                accion_sugerida = f"Revisar humedad en {conocimiento['watering_frequency_days']} días"
                razon = f"Humedad del suelo adecuada ({humedad_suelo}%)"
                confianza = 80.0
                prioridad = "BAJA"
        
        else:
            # 2. Sin sensor - usar lógica basada en tiempo y conocimiento de la planta
            if ultimo_riego:
                horas_desde_riego = (timezone.now() - ultimo_riego).total_seconds() / 3600
                dias_desde_riego = horas_desde_riego / 24
                
                # Umbrales basados en tipo de planta
                umbral_riego = conocimiento['watering_frequency_days']
                
                if dias_desde_riego > umbral_riego * 1.5:  # 50% más del tiempo normal
                    recomendacion = "RIEGO NECESARIO"
                    accion_sugerida = f"Regar con {conocimiento['watering_amount_ml']}ml de agua hoy"
                    razon = f"Han pasado {dias_desde_riego:.1f} días desde el último riego (umbral: {umbral_riego} días)"
                    confianza = 85.0
                    prioridad = "MEDIA"
                elif dias_desde_riego > umbral_riego:
                    recomendacion = "Considerar riego pronto"
                    accion_sugerida = f"Regar en los próximos 2 días con {conocimiento['watering_amount_ml']}ml"
                    razon = f"Han pasado {dias_desde_riego:.1f} días desde el último riego"
                    confianza = 75.0
                    prioridad = "BAJA"
                else:
                    recomendacion = "Programa de riego adecuado"
                    accion_sugerida = f"Siguiente riego en {umbral_riego - dias_desde_riego:.1f} días"
                    razon = f"Frecuencia de riego dentro de parámetros normales"
                    confianza = 80.0
                    prioridad = "BAJA"
            else:
                # Sin historial de riego
                recomendacion = "Iniciar programa de riego"
                accion_sugerida = f"Regar hoy con {conocimiento['watering_amount_ml']}ml y establecer recordatorio cada {conocimiento['watering_frequency_days']} días"
                razon = "No hay registro de riegos anteriores"
                confianza = 70.0
                prioridad = "MEDIA"
        
        # 3. Ajustar por condiciones ambientales
        temperatura = condiciones.get('temperatura', {}).get('valor')
        humedad_aire = condiciones.get('humedad_aire', {}).get('valor')
        
        ajustes = []
        if temperatura:
            temp_min, temp_max = conocimiento['ideal_temp_range']
            if temperatura > temp_max:
                ajustes.append(f"Temperatura alta ({temperatura}°C) - considerar riego adicional")
                confianza *= 0.9  # Reducir confianza
            elif temperatura < temp_min:
                ajustes.append(f"Temperatura baja ({temperatura}°C) - reducir frecuencia de riego")
                confianza *= 0.95
        
        if humedad_aire:
            hum_min, hum_max = conocimiento['ideal_humidity_range']
            if humedad_aire < hum_min:
                ajustes.append(f"Humedad ambiente baja ({humedad_aire}%) - puede necesitar más agua")
                confianza *= 0.92
            elif humedad_aire > hum_max:
                ajustes.append(f"Humedad ambiente alta ({humedad_aire}%) - reducir riego")
                confianza *= 0.88
        
        if ajustes:
            razon += f". Considerar: {'; '.join(ajustes)}"
        
        # 4. Considerar estado actual de la planta
        if planta_info['estado'] == 'necesita_agua':
            recomendacion = "RIEGO PRIORITARIO - Planta reportada como 'necesita agua'"
            prioridad = "ALTA"
            confianza = 90.0
        elif planta_info['estado'] == 'peligro':
            recomendacion = "RIEGO DE EMERGENCIA - Planta en peligro"
            prioridad = "ALTA"
            confianza = 95.0
        
        # Metadata detallada
        metadata = {
            'algoritmo_usado': 'reglas_hibridas_contextuales',
            'variables_consideradas': list(condiciones.keys()),
            'conocimiento_planta_usado': conocimiento['type'],
            'horas_desde_ultimo_riego': horas_desde_riego if ultimo_riego else None,
            'temperatura_actual': temperatura,
            'humedad_ambiente': humedad_aire,
            'necesidad_agua_planta': conocimiento['water_needs'],
            'frecuencia_recomendada_dias': conocimiento['watering_frequency_days'],
            'cantidad_recomendada_ml': conocimiento['watering_amount_ml'],
            'factores_ambientales_considerados': len(ajustes)
        }
        
        return {
            'recomendacion': recomendacion,
            'accion_sugerida': accion_sugerida,
            'razon': razon,
            'confianza': round(min(confianza, 100.0), 1),  # Asegurar máximo 100%
            'prioridad': prioridad,
            'metadata': metadata,
            'planta': planta_info['nombre'],
            'tipo_prediccion': 'RIEGO',
            'timestamp': timezone.now().isoformat()
        }
    
    def predict_plant_health(self, plant_id: int) -> Dict:
        """Predice el estado de salud general de la planta"""
        context = self.create_plant_context(plant_id)
        
        if 'error' in context:
            return {
                'error': context['error'],
                'recomendacion': 'No se pudo analizar la salud de la planta',
                'confianza': 0.0
            }
        
        # Inicializar
        confianza = 70.0
        problemas_detectados = []
        recomendaciones = []
        accion_sugerida = ""
        razon = ""
        prioridad = "MEDIA"
        
        condiciones = context['condiciones_actuales']
        planta_info = context['planta']
        conocimiento = context['conocimiento_planta']
        
        # 1. Análisis de temperatura
        temperatura = condiciones.get('temperatura', {}).get('valor')
        if temperatura:
            temp_min, temp_max = conocimiento['ideal_temp_range']
            if temperatura < temp_min:
                problemas_detectados.append(f"Temperatura baja ({temperatura}°C, ideal: {temp_min}-{temp_max}°C)")
                recomendaciones.append(f"Mover a lugar más cálido o usar cubierta protectora")
                confianza -= 15
            elif temperatura > temp_max:
                problemas_detectados.append(f"Temperatura alta ({temperatura}°C, ideal: {temp_min}-{temp_max}°C)")
                recomendaciones.append(f"Mover a sombra parcial o aumentar ventilación")
                confianza -= 15
        
        # 2. Análisis de humedad ambiente
        humedad_aire = condiciones.get('humedad_aire', {}).get('valor')
        if humedad_aire:
            hum_min, hum_max = conocimiento['ideal_humidity_range']
            if humedad_aire < hum_min:
                problemas_detectados.append(f"Humedad ambiente baja ({humedad_aire}%, ideal: {hum_min}-{hum_max}%)")
                recomendaciones.append(f"Rociar hojas con agua o usar humidificador")
                confianza -= 10
            elif humedad_aire > hum_max:
                problemas_detectados.append(f"Humedad ambiente excesiva ({humedad_aire}%, ideal: {hum_min}-{hum_max}%)")
                recomendaciones.append(f"Mejorar ventilación o reducir riego")
                confianza -= 10
        
        # 3. Análisis de luz (si hay sensor)
        luz = condiciones.get('luz', {}).get('valor')
        if luz:
            if luz < 500:
                problemas_detectados.append(f"Luz insuficiente ({luz} lux)")
                recomendaciones.append(f"Mover a lugar más iluminado o usar luz artificial")
                confianza -= 12
            elif luz > 50000:
                problemas_detectados.append(f"Luz excesiva ({luz} lux)")
                recomendaciones.append(f"Proteger del sol directo con malla sombra")
                confianza -= 12
        
        # 4. Considerar estado y aspecto reportado
        if planta_info['estado'] == 'necesita_agua':
            problemas_detectados.append("Planta reportada como 'necesita agua'")
            confianza -= 20
        elif planta_info['estado'] == 'peligro':
            problemas_detectados.append("PLANTA EN PELIGRO - Atención inmediata requerida")
            confianza -= 30
            prioridad = "ALTA"
        
        if planta_info['aspecto'] == 'hojas_amarillas':
            problemas_detectados.append("Hojas amarillas detectadas")
            recomendaciones.append("Verificar drenaje y ajustar riego o fertilización")
            confianza -= 18
        elif planta_info['aspecto'] == 'crecimiento_lento':
            problemas_detectados.append("Crecimiento lento")
            recomendaciones.append("Revisar nutrientes y condiciones ambientales")
            confianza -= 15
        elif planta_info['aspecto'] == 'floreciendo':
            # Aspecto positivo
            recomendaciones.append("¡Excelente! Planta en etapa de floración - mantener cuidados")
            confianza += 10
        
        # 5. Generar diagnóstico final
        if problemas_detectados:
            total_problemas = len(problemas_detectados)
            
            if total_problemas >= 3:
                recomendacion = f"🚨 ESTADO CRÍTICO - {total_problemas} problemas detectados"
                accion_sugerida = "INTERVENCIÓN INMEDIATA REQUERIDA"
                prioridad = "ALTA"
            elif total_problemas >= 2:
                recomendacion = f"⚠️ ATENCIÓN NECESARIA - {total_problemas} problemas detectados"
                accion_sugerida = "Revisar y corregir problemas identificados"
                prioridad = "MEDIA"
            else:
                recomendacion = f"📋 MANTENIMIENTO PREVENTIVO - {total_problemas} problema detectado"
                accion_sugerida = "Ajustar condiciones para prevenir empeoramiento"
                prioridad = "BAJA"
            
            razon = f"Diagnóstico basado en: {', '.join(problemas_detectados[:3])}"
        else:
            recomendacion = "✅ ESTADO SALUDABLE - Condiciones óptimas"
            accion_sugerida = "Continuar con cuidados actuales"
            razon = "Todas las condiciones dentro de parámetros normales"
            prioridad = "BAJA"
            confianza = 85.0  # Boost para plantas saludables
        
        # Asegurar confianza mínima
        confianza = max(confianza, 30.0)
        
        metadata = {
            'problemas_detectados': problemas_detectados,
            'recomendaciones_generadas': recomendaciones,
            'condiciones_analizadas': list(condiciones.keys()),
            'conocimiento_planta_usado': conocimiento['type'],
            'problemas_comunes_esperados': conocimiento['common_problems'],
            'total_analisis_realizados': len(condiciones) + 2,  # +2 por estado y aspecto
            'severidad_total': len(problemas_detectados)
        }
        
        return {
            'recomendacion': recomendacion,
            'accion_sugerida': accion_sugerida,
            'razon': razon,
            'confianza': round(confianza, 1),
            'prioridad': prioridad,
            'metadata': metadata,
            'planta': planta_info['nombre'],
            'tipo_prediccion': 'SALUD',
            'problemas_detectados': problemas_detectados,
            'recomendaciones_especificas': recomendaciones[:5],  # Máximo 5 recomendaciones
            'timestamp': timezone.now().isoformat()
        }
    
    def generate_detailed_analysis(self, plant_id: int) -> Dict:
        """Genera un análisis detallado combinando todas las predicciones"""
        
        watering_prediction = self.predict_watering_needs(plant_id)
        health_prediction = self.predict_plant_health(plant_id)
        context = self.create_plant_context(plant_id)
        
        if 'error' in context or 'error' in watering_prediction or 'error' in health_prediction:
            return {
                'error': 'No se pudo generar análisis completo',
                'timestamp': timezone.now().isoformat()
            }
        
        # Calcular puntuación general
        overall_score = (
            watering_prediction['confianza'] * 0.4 +  # 40% peso riego
            health_prediction['confianza'] * 0.6      # 60% peso salud
        )
        
        # Determinar estado general
        if overall_score >= 85:
            estado_general = "EXCELENTE"
            icono = "🏆"
        elif overall_score >= 70:
            estado_general = "BUENO"
            icono = "✅"
        elif overall_score >= 50:
            estado_general = "REQUIERE ATENCIÓN"
            icono = "⚠️"
        else:
            estado_general = "CRÍTICO"
            icono = "🚨"
        
        # Acciones prioritarias
        acciones_prioritarias = []
        
        if watering_prediction['prioridad'] == 'ALTA':
            acciones_prioritarias.append(watering_prediction['accion_sugerida'])
        
        if health_prediction['prioridad'] == 'ALTA':
            acciones_prioritarias.extend(health_prediction.get('recomendaciones_especificas', [])[:2])
        
        # Si no hay acciones de alta prioridad, usar las de media
        if not acciones_prioritarias:
            if watering_prediction['prioridad'] == 'MEDIA':
                acciones_prioritarias.append(watering_prediction['accion_sugerida'])
            
            if health_prediction['prioridad'] == 'MEDIA':
                acciones_prioritarias.extend(health_prediction.get('recomendaciones_especificas', [])[:1])
        
        # Plan de acción semanal
        plan_semanal = [
            f"Día 1: {watering_prediction['accion_sugerida']}",
            f"Día 2: Revisar {', '.join(health_prediction.get('problemas_detectados', ['condiciones generales'])[:2])}",
            "Día 3: Limpiar hojas y revisar drenaje",
            "Día 4: Verificar crecimiento y ajustar soportes si es necesario",
            "Día 5: Revisar nutrientes y considerar fertilización suave",
            "Día 6: Descanso - solo observación",
            "Día 7: Evaluación semanal completa"
        ]
        
        return {
            'analisis_id': context.get('analisis_id', f"full_analysis_{plant_id}"),
            'planta': context['planta']['nombre'],
            'especie': context['planta']['especie'],
            'estado_general': estado_general,
            'icono_estado': icono,
            'puntuacion_total': round(overall_score, 1),
            'timestamp': timezone.now().isoformat(),
            
            'predicciones': {
                'riego': watering_prediction,
                'salud': health_prediction
            },
            
            'resumen_ejecutivo': {
                'estado_actual': context['planta']['estado'],
                'aspecto_actual': context['planta']['aspecto'],
                'dias_desde_creacion': (timezone.now() - datetime.fromisoformat(context['planta']['fecha_creacion'])).days if context['planta']['fecha_creacion'] else 0,
                'necesita_atencion_inmediata': context['necesita_atencion'],
                'tipo_planta': context['conocimiento_planta']['type'],
                'problemas_potenciales': context['conocimiento_planta']['common_problems']
            },
            
            'acciones_recomendadas': {
                'prioritarias': acciones_prioritarias[:3],  # Máximo 3 acciones prioritarias
                'plan_semanal': plan_semanal,
                'siguiente_revision': (timezone.now() + timedelta(days=3)).isoformat()
            },
            
            'metricas_clave': {
                'confianza_riego': watering_prediction['confianza'],
                'confianza_salud': health_prediction['confianza'],
                'problemas_detectados': len(health_prediction.get('problemas_detectados', [])),
                'recomendaciones_generadas': len(health_prediction.get('recomendaciones_especificas', [])) + 1,
                'variables_analizadas': len(context['condiciones_actuales']) + 3
            }
        }
    
    def save_prediction_to_db(self, plant_id: int, prediction_type: str, prediction_data: Dict) -> bool:
        """Guarda la predicción en la base de datos"""
        try:
            from main.models import Planta, PrediccionIA
            
            planta = Planta.objects.get(id=plant_id)
            
            # Determinar tipo de predicción para el modelo
            tipo_map = {
                'RIEGO': PrediccionIA.TipoPrediccion.RIEGO,
                'SALUD': PrediccionIA.TipoPrediccion.CRECIMIENTO,  # Más cercano a salud
                'ANALISIS': PrediccionIA.TipoPrediccion.CRECIMIENTO
            }
            
            tipo_prediccion = tipo_map.get(prediction_type, PrediccionIA.TipoPrediccion.RIEGO)
            
            # Determinar prioridad
            prioridad_map = {
                'ALTA': PrediccionIA.Prioridad.ALTA,
                'MEDIA': PrediccionIA.Prioridad.MEDIA,
                'BAJA': PrediccionIA.Prioridad.BAJA
            }
            
            prioridad = prioridad_map.get(prediction_data.get('prioridad', 'MEDIA'), PrediccionIA.Prioridad.MEDIA)
            
            # Crear la predicción
            prediccion = PrediccionIA.objects.create(
                planta=planta,
                tipo=tipo_prediccion,
                recomendacion=prediction_data.get('recomendacion', ''),
                accion_sugerida=prediction_data.get('accion_sugerida', ''),
                razon=prediction_data.get('razon', ''),
                confianza=prediction_data.get('confianza', 70.0),
                prioridad=prioridad,
                metadata=prediction_data.get('metadata', {}),
                estado=PrediccionIA.Estado.PENDIENTE
            )
            
            logger.info(f"Predicción {prediction_type} guardada para {planta.nombrePersonalizado} (ID: {prediccion.id})")
            return True
            
        except Exception as e:
            logger.error(f"Error guardando predicción en BD: {e}")
            return False
    
    def batch_analyze_all_plants(self) -> List[Dict]:
        """Analiza todas las plantas y genera predicciones"""
        try:
            from main.models import Planta
            
            plantas = Planta.objects.all()
            resultados = []
            
            for planta in plantas:
                try:
                    analisis = self.generate_detailed_analysis(planta.id)
                    
                    if 'error' not in analisis:
                        # Guardar predicción de riego
                        self.save_prediction_to_db(
                            planta.id,
                            'RIEGO',
                            analisis['predicciones']['riego']
                        )
                        
                        # Guardar predicción de salud
                        self.save_prediction_to_db(
                            planta.id,
                            'SALUD',
                            analisis['predicciones']['salud']
                        )
                        
                        resultados.append({
                            'planta': planta.nombrePersonalizado,
                            'id': planta.id,
                            'puntuacion': analisis['puntuacion_total'],
                            'estado': analisis['estado_general'],
                            'analisis_completo': True
                        })
                    else:
                        resultados.append({
                            'planta': planta.nombrePersonalizado,
                            'id': planta.id,
                            'error': analisis['error'],
                            'analisis_completo': False
                        })
                        
                except Exception as e:
                    logger.error(f"Error analizando planta {planta.id}: {e}")
                    resultados.append({
                        'planta': planta.nombrePersonalizado,
                        'id': planta.id,
                        'error': str(e),
                        'analisis_completo': False
                    })
            
            return {
                'total_plantas': len(plantas),
                'analizadas_exitosamente': len([r for r in resultados if r.get('analisis_completo', False)]),
                'resultados': resultados,
                'timestamp': timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error en análisis por lotes: {e}")
            return {
                'error': str(e),
                'timestamp': timezone.now().isoformat()
            }


# Instancia global del servicio
ai_prediction_service = AIPredictionService()

# Funciones de conveniencia para importación
def predict_watering(plant_id):
    """Predice necesidades de riego para una planta"""
    return ai_prediction_service.predict_watering_needs(plant_id)

def predict_health(plant_id):
    """Predice salud de una planta"""
    return ai_prediction_service.predict_plant_health(plant_id)

def analyze_plant(plant_id):
    """Análisis completo de una planta"""
    return ai_prediction_service.generate_detailed_analysis(plant_id)

def batch_analyze():
    """Análisis de todas las plantas"""
    return ai_prediction_service.batch_analyze_all_plants()

def get_plant_context(plant_id):
    """Obtiene contexto de una planta"""
    return ai_prediction_service.create_plant_context(plant_id)

print("✅ Servicio de predicciones avanzadas inicializado correctamente")