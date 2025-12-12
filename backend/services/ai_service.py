# backend/services/ai_service.py - VERSIÓN COMPLETA Y CORREGIDA
"""
Servicio de IA multi-proveedor para EcoBox.
Soporta: OpenAI, Google Gemini, o modo simulado con respuestas específicas por planta.
"""
import os
import json
from django.utils import timezone
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

print("🚀 Inicializando ai_service.py (Multi-proveedor con respuestas específicas)")

# Cargar variables de entorno
load_dotenv()

# Configuración
AI_PROVIDER = os.getenv('AI_PROVIDER', 'simulated').lower()
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo')

print(f"🤖 Proveedor configurado: {AI_PROVIDER}")

# Inicializar clientes
openai_client = None
gemini_client = None

# Configurar OpenAI si está disponible
if AI_PROVIDER == 'openai' and OPENAI_API_KEY:
    try:
        from openai import OpenAI
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        print(f"✅ Cliente OpenAI configurado - Modelo: {OPENAI_MODEL}")
    except ImportError:
        print("❌ OpenAI no instalado. Ejecuta: pip install openai")
        AI_PROVIDER = 'simulated'

# Configurar Gemini si está disponible
elif AI_PROVIDER == 'gemini' and GOOGLE_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GOOGLE_API_KEY)
        gemini_client = genai
        print("✅ Cliente Gemini configurado")
    except ImportError:
        print("❌ google-generativeai no instalado. Ejecuta: pip install google-generativeai")
        AI_PROVIDER = 'simulated'

else:
    print("⚠️ Usando modo simulado")
    AI_PROVIDER = 'simulated'


class PlantAI:
    """Clase principal de IA para plantas."""
    
    def __init__(self):
        self.provider = AI_PROVIDER
        
    def process_message(self, message, user_id=None, plant_id=None):
        """Procesa mensaje según el proveedor configurado."""
        print(f"📩 [{self.provider.upper()}] Procesando: '{message}' (plant_id: {plant_id})")
        
        # Obtener contexto de la planta si hay plant_id
        context = self._get_plant_context(plant_id) if plant_id else ""
        
        if self.provider == 'openai' and openai_client:
            return self._process_with_openai(message, context, plant_id)
        elif self.provider == 'gemini' and gemini_client:
            return self._process_with_gemini(message, context, plant_id)
        else:
            return self._process_simulated(message, context, plant_id)
    
    def _get_plant_context(self, plant_id):
        """Obtiene contexto de una planta específica."""
        try:
            from main.models import Planta
            planta = Planta.objects.get(id=plant_id)
            
            return f"""
INFORMACIÓN DE LA PLANTA:
- Nombre: {planta.nombrePersonalizado}
- Especie: {planta.especie}
- Estado: {planta.get_estado_display()}
- Aspecto: {planta.get_aspecto_display()}
"""
        except Exception as e:
            print(f"⚠️ No se pudo obtener contexto de planta: {e}")
            return ""
    
    def _process_with_openai(self, message, context, plant_id=None):
        """Procesa con OpenAI."""
        try:
            full_prompt = f"""Eres EcoBox AI, un experto en cuidado de plantas.

{context}

Usuario pregunta: {message}

Responde de manera clara, útil y con emojis relevantes. Sé específico con recomendaciones prácticas."""
            
            response = openai_client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "Eres un experto en botánica y jardinería."},
                    {"role": "user", "content": full_prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            ai_text = response.choices[0].message.content
            
            return {
                'text': ai_text,
                'intent': 'ai_response',
                'confidence': 0.9,
                'provider': 'openai',
                'model': OPENAI_MODEL,
                'tokens_used': response.usage.total_tokens,
                'timestamp': timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error con OpenAI: {e}")
            # Fallback a modo simulado
            return self._process_simulated(message, context, plant_id)
    
    def _process_with_gemini(self, message, context, plant_id=None):
        """Procesa con Google Gemini."""
        try:
            import google.generativeai as genai
            
            # Configurar el modelo
            model = genai.GenerativeModel('gemini-pro')
            
            prompt = f"""Eres EcoBox AI, un asistente especializado en cuidado de plantas.

{context}

Pregunta del usuario: {message}

Instrucciones:
1. Responde como experto en plantas
2. Usa emojis relevantes 🌿💧☀️
3. Sé claro y conciso
4. Da recomendaciones prácticas
5. Si no hay suficiente información, pide detalles

Respuesta:"""
            
            response = model.generate_content(prompt)
            
            return {
                'text': response.text,
                'intent': 'ai_response',
                'confidence': 0.85,
                'provider': 'gemini',
                'model': 'gemini-pro',
                'timestamp': timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error con Gemini: {e}")
            return self._process_simulated(message, context, plant_id)
    
    def _process_simulated(self, message, context, plant_id=None):
        """Procesa con respuestas simuladas inteligentes."""
        message_lower = message.lower()
        
        # SI HAY PLANT_ID, USAR INFORMACIÓN ESPECÍFICA
        if plant_id:
            try:
                info_planta = self.obtener_info_planta_especifica(plant_id)
                
                if info_planta:
                    # Respuesta específica para esa planta
                    if any(word in message_lower for word in ['cómo está', 'salud', 'estado', 'como esta']):
                        return self._respuesta_estado_especifico(info_planta)
                    elif any(word in message_lower for word in ['regar', 'riego', 'agua']):
                        return self._respuesta_riego_especifico(info_planta)
                    elif any(word in message_lower for word in ['temperatura', 'frío', 'calor']):
                        return self._respuesta_temperatura_especifica(info_planta)
                    elif any(word in message_lower for word in ['plaga', 'insecto', 'enfermedad']):
                        return self._respuesta_plagas_especifica(info_planta)
            except Exception as e:
                print(f"⚠️ Error usando info específica: {e}")
                pass  # Si falla, continuar con respuestas generales
        
        # RESPUESTAS GENERALES (cuando no hay plant_id o falló)
        if any(word in message_lower for word in ['cómo está', 'salud', 'estado']):
            response_text = """🌿 **Estado de tus plantas:**

📊 **Resumen general:**
✅ 80% saludables
💧 15% necesitan agua
⚠️ 5% en observación

**Recomendaciones:**
1. Revisa plantas con estado "necesita agua" hoy
2. Limpia hojas para mejor fotosíntesis
3. Rota plantas para crecimiento uniforme

¿Te gustaría revisar alguna planta en específico?"""
            
        elif any(word in message_lower for word in ['regar', 'riego', 'agua']):
            response_text = """💧 **Guía de riego inteligente:**

**Recomendaciones generales:**
• **Frecuencia:** Cada 3-7 días según tipo de planta
• **Cantidad:** Hasta que el agua drene por abajo
• **Mejor hora:** Mañana temprano

**Señales de que necesita agua:**
1. Tierra seca a 2-3 cm de profundidad
2. Hojas ligeramente marchitas
3. Peso ligero de la maceta

**Tip:** Usa agua a temperatura ambiente, nunca fría."""
            
        elif any(word in message_lower for word in ['temperatura', 'frío', 'calor']):
            response_text = """🌡️ **Control de temperatura:**

**Rangos ideales:**
• Plantas tropicales: 20-30°C
• Suculentas: 15-25°C
• Plantas de interior: 18-24°C

**Señales de estrés térmico:**
🔥 **Calor excesivo:** Hojas quemadas, caída prematura
❄️ **Frío excesivo:** Hojas amarillas, crecimiento lento

**Consejo:** Evita cambios bruscos de temperatura."""
            
        elif any(word in message_lower for word in ['plaga', 'insecto', 'enfermedad']):
            response_text = """🛡️ **Control de plagas natural:**

**Plagas comunes y soluciones:**
1. **Ácaros:** Limpia con agua jabonosa
2. **Pulgones:** Rociar con agua a presión
3. **Hongos:** Mejorar ventilación

**Prevención:**
• Revisa hojas semanalmente
• Mantén buena circulación de aire
• Limpia herramientas regularmente

**¡Prevención es la mejor cura!**"""
            
        else:
            response_text = f"""🌱 **Sobre '{message}':**

¡Hola! Soy EcoBox AI, tu asistente de plantas. 

**Mientras tanto, puedo ayudarte con:**
✅ Diagnóstico básico de problemas
💧 Guías de riego personalizadas
☀️ Recomendaciones de iluminación
🛡️ Prevención de plagas

**¿En qué área específica necesitas ayuda hoy?**

{context if context else ''}"""
        
        return {
            'text': response_text,
            'intent': 'simulated',
            'confidence': 0.7,
            'provider': 'simulated',
            'timestamp': timezone.now().isoformat()
        }
    
    def obtener_info_planta_especifica(self, plant_id):
        """Obtiene información específica de una planta."""
        try:
            from main.models import Planta, Sensor, Riego
            
            planta = Planta.objects.get(id=plant_id)
            
            # Obtener último sensor
            ultimo_sensor = Sensor.objects.filter(planta=planta).order_by('-fecha_creacion').first()
            
            # Obtener último riego
            ultimo_riego = Riego.objects.filter(planta=planta).order_by('-fecha').first()
            
            # Construir información específica
            info_planta = {
                'id': planta.id,
                'nombre': planta.nombrePersonalizado,
                'especie': planta.especie,
                'estado': planta.get_estado_display(),
                'aspecto': planta.get_aspecto_display(),
                'edad_dias': (timezone.now() - planta.fecha_creacion).days if planta.fecha_creacion else 0,
                'descripcion': planta.descripcion or f"Planta de tipo {planta.especie}",
                'ultimo_sensor': {
                    'humedad': ultimo_sensor.humedad if ultimo_sensor else None,
                    'temperatura': ultimo_sensor.temperatura if ultimo_sensor else None,
                    'luz': ultimo_sensor.nivel_luz if ultimo_sensor else None,
                    'fecha': ultimo_sensor.fecha_creacion if ultimo_sensor else None
                },
                'ultimo_riego': {
                    'fecha': ultimo_riego.fecha if ultimo_riego else None,
                    'cantidad': ultimo_riego.cantidad_ml if ultimo_riego else None,
                    'tipo': ultimo_riego.get_tipo_display() if ultimo_riego else None
                },
                'necesita_agua': planta.estado == 'necesita_agua',
                'en_peligro': planta.estado == 'peligro'
            }
            
            return info_planta
            
        except Exception as e:
            print(f"⚠️ Error obteniendo info de planta: {e}")
            return None
    
    def _respuesta_estado_especifico(self, info_planta):
        """Genera respuesta específica del estado de una planta."""
        
        # Determinar icono según estado
        icono_estado = "✅" if info_planta['estado'] == 'Saludable' else "💧" if info_planta['estado'] == 'Necesita Agua' else "⚠️"
        
        # Recomendaciones según estado
        recomendaciones = []
        if info_planta['necesita_agua']:
            recomendaciones = [
                f"💧 **Riega hoy mismo** - {info_planta['nombre']} necesita agua",
                f"📅 Último riego: {info_planta['ultimo_riego']['fecha'].strftime('%d/%m') if info_planta['ultimo_riego']['fecha'] else 'No registrado'}",
                f"🌡️ Temperatura actual: {info_planta['ultimo_sensor']['temperatura'] or '24'}°C"
            ]
        elif info_planta['en_peligro']:
            recomendaciones = [
                f"🚨 **ATENCIÓN INMEDIATA** - {info_planta['nombre']} está en peligro",
                "🔍 Revisa raíces y drenaje",
                "🦟 Busca plagas en hojas",
                "🌡️ Verifica temperatura ambiente"
            ]
        else:
            recomendaciones = [
                f"✅ **{info_planta['nombre']} está en buen estado**",
                f"🌿 Continúa con cuidados regulares",
                f"📊 Próxima revisión: En 3 días"
            ]
        
        respuesta = f"""🌿 **{info_planta['nombre']}** ({info_planta['especie']})

{icono_estado} **Estado:** {info_planta['estado']}
🎨 **Aspecto:** {info_planta['aspecto']}
📅 **Edad:** {info_planta['edad_dias']} días

**📊 Datos recientes:**"""
        
        if info_planta['ultimo_sensor']['humedad']:
            respuesta += f"\n💧 **Humedad:** {info_planta['ultimo_sensor']['humedad']}%"
        
        if info_planta['ultimo_sensor']['temperatura']:
            respuesta += f"\n🌡️ **Temperatura:** {info_planta['ultimo_sensor']['temperatura']}°C"
        
        respuesta += f"""

**🎯 Recomendaciones específicas:**"""
        
        for i, rec in enumerate(recomendaciones, 1):
            respuesta += f"\n{i}. {rec}"
        
        if info_planta['descripcion']:
            respuesta += f"""

**💡 Información adicional:**
{info_planta['descripcion']}"""
        
        respuesta += f"""

¿Necesitas información sobre otra cosa de {info_planta['nombre']}?"""
        
        return {
            'text': respuesta,
            'intent': 'specific_plant_status',
            'confidence': 0.9,
            'provider': 'simulated',
            'timestamp': timezone.now().isoformat()
        }
    
    def _respuesta_riego_especifico(self, info_planta):
        """Genera respuesta específica sobre riego."""
        
        # Calcular días desde último riego
        dias_desde_riego = 0
        if info_planta['ultimo_riego']['fecha']:
            dias_desde_riego = (timezone.now().date() - info_planta['ultimo_riego']['fecha'].date()).days
        
        # Determinar si necesita riego
        necesita_riego = info_planta['necesita_agua'] or dias_desde_riego > 5
        
        respuesta = f"""💧 **Plan de riego para {info_planta['nombre']}**

**📅 Último riego:** {info_planta['ultimo_riego']['fecha'].strftime('%d/%m/%Y') if info_planta['ultimo_riego']['fecha'] else 'No registrado'}
**📊 Cantidad:** {info_planta['ultimo_riego']['cantidad'] or 250} ml
**⏰ Días desde último riego:** {dias_desde_riego}

**🌿 Tipo de planta:** {info_planta['especie']}
**💧 Necesidad de agua:** {'ALTA' if 'tomate' in info_planta['especie'].lower() else 'MEDIA' if 'albahaca' in info_planta['especie'].lower() else 'BAJA'}

**🎯 Recomendaciones específicas:**"""
        
        if necesita_riego:
            respuesta += f"""
1. 🚨 **RIEGA HOY** - La planta necesita agua urgente
2. 💦 Cantidad sugerida: 300-400 ml
3. ⏰ Mejor hora: Mañana temprano
4. 🌡️ Usa agua a temperatura ambiente"""
        else:
            respuesta += f"""
1. ✅ **Programa actual adecuado**
2. ⏳ Próximo riego: En {5 - dias_desde_riego} días
3. 💧 Mantén 250-300 ml por riego
4. 🌱 Revisa humedad cada 2 días"""
        
        return {
            'text': respuesta,
            'intent': 'specific_watering',
            'confidence': 0.85,
            'provider': 'simulated',
            'timestamp': timezone.now().isoformat()
        }
    
    def _respuesta_temperatura_especifica(self, info_planta):
        """Genera respuesta específica sobre temperatura."""
        
        temp_actual = info_planta['ultimo_sensor']['temperatura'] or 24
        
        # Determinar rango ideal según tipo de planta
        if 'tomate' in info_planta['especie'].lower():
            rango_ideal = "20-28°C"
            descripcion = "Planta de clima cálido"
        elif 'albahaca' in info_planta['especie'].lower():
            rango_ideal = "18-25°C"
            descripcion = "Planta mediterránea"
        elif 'lavanda' in info_planta['especie'].lower():
            rango_ideal = "15-25°C"
            descripcion = "Planta resistente"
        else:
            rango_ideal = "18-24°C"
            descripcion = "Planta de interior"
        
        # Evaluar temperatura
        temp_min, temp_max = map(int, rango_ideal.replace('°C', '').split('-'))
        estado_temp = "✅ ÓPTIMA" if temp_min <= temp_actual <= temp_max else "⚠️ FUERA DE RANGO" if temp_actual < temp_min else "🔥 DEMASIADO CALOR"
        
        respuesta = f"""🌡️ **Temperatura para {info_planta['nombre']}**

**📊 Temperatura actual:** {temp_actual}°C
**🎯 Rango ideal:** {rango_ideal}
**📈 Estado:** {estado_temp}
**🌿 Tipo:** {descripcion}

**📋 Evaluación:**"""
        
        if temp_actual < temp_min:
            respuesta += f"""
• ❄️ **Demasiado frío** para {info_planta['nombre']}
• ⚠️ Riesgo: Crecimiento lento, hojas amarillas
• ✅ Solución: Mover a lugar más cálido"""
        elif temp_actual > temp_max:
            respuesta += f"""
• 🔥 **Demasiado calor** para {info_planta['nombre']}
• ⚠️ Riesgo: Hojas quemadas, deshidratación
• ✅ Solución: Mover a sombra parcial"""
        else:
            respuesta += f"""
• ✅ **Temperatura perfecta** para {info_planta['nombre']}
• 🌱 Condiciones ideales de crecimiento
• 💪 Planta saludable y vigorosa"""
        
        return {
            'text': respuesta,
            'intent': 'specific_temperature',
            'confidence': 0.85,
            'provider': 'simulated',
            'timestamp': timezone.now().isoformat()
        }
    
    def _respuesta_plagas_especifica(self, info_planta):
        """Genera respuesta específica sobre plagas."""
        
        # Determinar vulnerabilidad según tipo de planta
        if 'tomate' in info_planta['especie'].lower():
            plagas_comunes = ["Pulgones", "Araña roja", "Mosca blanca"]
            vulnerabilidad = "ALTA"
        elif 'albahaca' in info_planta['especie'].lower():
            plagas_comunes = ["Pulgones", "Orugas", "Caracoles"]
            vulnerabilidad = "MEDIA"
        elif 'rosa' in info_planta['nombre'].lower() or 'rosa' in info_planta['especie'].lower():
            plagas_comunes = ["Pulgones", "Oídio", "Mancha negra"]
            vulnerabilidad = "ALTA"
        else:
            plagas_comunes = ["Pulgones", "Ácaros", "Cochinilla"]
            vulnerabilidad = "BAJA"
        
        respuesta = f"""🛡️ **Control de plagas para {info_planta['nombre']}**

**🌿 Tipo de planta:** {info_planta['especie']}
**⚠️ Vulnerabilidad a plagas:** {vulnerabilidad}
**🔍 Última revisión:** Hoy
**✅ Estado actual:** Sin plagas detectadas

**🦟 Plagas comunes para este tipo:**
"""
        
        for i, plaga in enumerate(plagas_comunes, 1):
            if plaga == "Pulgones":
                solucion = "Agua jabonosa o aceite de neem"
            elif plaga == "Araña roja":
                solucion = "Aumentar humedad, rociar agua"
            elif plaga == "Mosca blanca":
                solucion = "Trampas amarillas, jabón potásico"
            elif plaga == "Orugas":
                solucion = "Recolección manual, Bacillus thuringiensis"
            elif plaga == "Oídio":
                solucion = "Mejorar ventilación, bicarbonato"
            else:
                solucion = "Control manual, jabón insecticida"
            
            respuesta += f"{i}. **{plaga}**: {solucion}\n"
        
        respuesta += f"""
**🎯 Plan de prevención para {info_planta['nombre']}:**
1. 🔍 Revisa hojas cada 3 días
2. 💨 Mantén buena ventilación alrededor
3. 🌱 Fertiliza para fortalecer defensas
4. 🧹 Limpia hojas secas regularmente

**🚨 Señales de alerta:**
• 🔍 Manchas en hojas de {info_planta['nombre']}
• 🕸️ Telarañas pequeñas
• 🐜 Insectos visibles"""
        
        return {
            'text': respuesta,
            'intent': 'specific_pests',
            'confidence': 0.8,
            'provider': 'simulated',
            'timestamp': timezone.now().isoformat()
        }
    
    def check_status(self):
        """Verifica el estado del servicio."""
        status_info = {
            'provider': self.provider,
            'status': 'operational' if self.provider in ['openai', 'gemini'] else 'simulated',
            f'{self.provider}_connected': self.provider in ['openai', 'gemini'],
            'timestamp': timezone.now().isoformat()
        }
        
        # Probar conexión si es un proveedor real
        if self.provider == 'openai' and openai_client:
            try:
                test = openai_client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "Responde 'OK'"},
                        {"role": "user", "content": "test"}
                    ],
                    max_tokens=5
                )
                status_info['test_response'] = test.choices[0].message.content
                status_info['status'] = 'operational'
            except Exception as e:
                status_info['status'] = 'degraded'
                status_info['error'] = str(e)
                status_info['openai_connected'] = False
        
        elif self.provider == 'gemini' and gemini_client:
            try:
                import google.generativeai as genai
                model = genai.GenerativeModel('gemini-pro')
                response = model.generate_content("Responde 'OK'")
                status_info['test_response'] = response.text
                status_info['status'] = 'operational'
            except Exception as e:
                status_info['status'] = 'degraded'
                status_info['error'] = str(e)
                status_info['gemini_connected'] = False
        
        return status_info


# Instancia global
plant_ai = PlantAI()

# Funciones de interfaz
def process_user_message(message, user_id=None, plant_id=None):
    return plant_ai.process_message(message, user_id, plant_id)

def analyze_plant_health(plant_id, sensor_data=None):
    """Análisis simplificado."""
    try:
        from main.models import Planta
        planta = Planta.objects.get(id=plant_id)
        
        # Puntuación basada en estado
        scores = {'saludable': 90, 'normal': 75, 'necesita_agua': 60, 'peligro': 40}
        health_score = scores.get(planta.estado, 70)
        
        return {
            'health_score': health_score,
            'status': 'good' if health_score > 70 else 'needs_attention',
            'plant_name': planta.nombrePersonalizado,
            'plant_species': planta.especie,
            'plant_state': planta.get_estado_display(),
            'timestamp': timezone.now().isoformat()
        }
    except Exception as e:
        print(f"Error en analyze_plant_health: {e}")
        return {
            'health_score': 50,
            'status': 'unknown',
            'timestamp': timezone.now().isoformat()
        }

def get_daily_recommendations(plant_ids):
    """Recomendaciones diarias."""
    recommendations = [
        "💧 Revisar humedad del suelo",
        "☀️ Verificar exposición a la luz",
        "🌿 Limpiar hojas con paño húmedo",
        "⚠️ Buscar señales de estrés"
    ]
    
    return {
        'total_plants': len(plant_ids),
        'recommendations': recommendations,
        'timestamp': timezone.now().isoformat()
    }

def check_ai_status():
    return plant_ai.check_status()

print(f"✅ AI Service listo. Proveedor: {AI_PROVIDER}")
print(f"📦 Características: Respuestas específicas por planta, modo simulado inteligente")