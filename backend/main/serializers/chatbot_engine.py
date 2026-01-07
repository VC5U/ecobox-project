# backend/main/serializers/chatbot_engine.py
import re
import json
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from django.utils import timezone

class ChatbotEngine:
    """
    Motor de procesamiento de lenguaje natural simple para el chatbot.
    Detecta intenciones y genera respuestas contextuales.
    """
    
    # Patrones de intención con palabras clave
    INTENT_PATTERNS = {
        'saludo': [
            r'hola', r'buen(os|as)', r'hey', r'hi', r'buenas',
            r'qué tal', r'cómo estás', r'saludos'
        ],
        'estado': [
            r'cómo está', r'estado', r'condición', r'cómo se encuentra',
            r'cómo está mi planta', r'está bien', r'está mal'
        ],
        'riego': [
            r'regar', r'agua', r'riego', r'necesita agua', r'cuándo regar',
            r'tengo que regar', r'cuánta agua', r'frecuencia de riego',
            r'sequía', r'sed', r'sec'
        ],
        'temperatura': [
            r'temperatura', r'frío', r'calor', r'grados', r'°c',
            r'clima', r'ambiente', r'térmico', r'termómetro'
        ],
        'humedad': [
            r'humedad', r'seco', r'húmedo', r'mojado', r'sequedad',
            r'ambiente húmedo', r'nivel de humedad'
        ],
        'historial': [
            r'historial', r'histórico', r'pasado', r'ayer',
            r'semana pasada', r'últimos días', r'evolución',
            r'tendencia', r'gráfico', r'estadística'
        ],
        'recomendacion': [
            r'recomienda', r'consejo', r'qué hago', r'qué debo',
            r'sugerencia', r'ayuda', r'qué recomiendas', r'opinión',
            r'sugiere', r'aconseja'
        ],
        'explicacion': [
            r'por qué', r'explica', r'significa', r'qué es',
            r'cómo funciona', r'razón', r'motivo', r'causa'
        ],
        'plagas': [
            r'plaga', r'insecto', r'bicho', r'enfermedad',
            r'hojas amarillas', r'manchas', r'moho', r'hongo'
        ],
        'luz': [
            r'luz', r'sol', r'iluminación', r'sombra',
            r'fotosíntesis', r'claro', r'oscuro'
        ],
        'fertilizacion': [
            r'fertilizante', r'abono', r'nutriente', r'alimento',
            r'mineral', r'vitamina', r'crecimiento'
        ],
        'despedida': [
            r'adiós', r'chao', r'hasta luego', r'gracias',
            r'bye', r'nada más', r'terminamos'
        ]
    }
    
    @staticmethod
    def detect_intent(message: str) -> Tuple[str, float]:
        """
        Detecta la intención principal del mensaje con confianza.
        
        Args:
            message: Texto del usuario
            
        Returns:
            Tuple (intent, confidence): Intención detectada y confianza (0-1)
        """
        message_lower = message.lower().strip()
        
        # Contar coincidencias por intención
        intent_scores = {}
        
        for intent, patterns in ChatbotEngine.INTENT_PATTERNS.items():
            score = 0
            for pattern in patterns:
                if re.search(pattern, message_lower, re.IGNORECASE):
                    score += 1
            
            if score > 0:
                intent_scores[intent] = score
        
        if not intent_scores:
            return 'general', 0.3
        
        # Obtener intención con mayor puntuación
        best_intent = max(intent_scores, key=intent_scores.get)
        max_score = intent_scores[best_intent]
        
        # Calcular confianza basada en puntuación
        confidence = min(max_score / 3.0, 1.0)
        
        return best_intent, confidence
    
    @staticmethod
    def extract_plant_info(message: str) -> Dict:
        """
        Extrae información sobre plantas del mensaje.
        
        Args:
            message: Texto del usuario
            
        Returns:
            Dict con información extraída
        """
        message_lower = message.lower()
        
        # Patrones para nombres de planta
        plant_patterns = [
            r'mi (?:planta )?([\w\s]+?)(?: necesita| está| tiene|$)',
            r'la (?:planta )?([\w\s]+?)(?: necesita| está| tiene|$)',
            r'([\w\s]+?)(?: necesita agua| está| tiene| se ve)',
            r'cómo está ([^?]+?)\??',
            r'qué tal ([^?]+?)\??'
        ]
        
        plant_name = None
        for pattern in plant_patterns:
            match = re.search(pattern, message_lower)
            if match:
                plant_name = match.group(1).strip()
                break
        
        # Extraer posibles problemas
        problems = []
        problem_keywords = {
            'amarillo': ['amarilla', 'amarillas', 'amarilleando'],
            'marchito': ['marchita', 'marchitas', 'mustio'],
            'caida': ['cae', 'caen', 'deshoja'],
            'manchas': ['mancha', 'puntos', 'moteado'],
            'plaga': ['insecto', 'bicho', 'gusano', 'ácaro'],
            'hongo': ['moho', 'podredumbre', 'mildiu']
        }
        
        for problem, keywords in problem_keywords.items():
            if any(keyword in message_lower for keyword in keywords):
                problems.append(problem)
        
        return {
            'plant_name': plant_name,
            'problems': problems,
            'contains_plant_reference': bool(plant_name)
        }
    
    @staticmethod
    def generate_response(intent: str, context: Dict) -> Dict:
        """
        Genera respuesta estructurada basada en intención y contexto.
        
        Args:
            intent: Intención detectada
            context: Contexto con datos de planta y sensores
            
        Returns:
            Dict con respuesta estructurada
        """
        # Plantillas de respuesta por intención
        response_templates = {
            'saludo': ChatbotEngine._generate_greeting_response,
            'estado': ChatbotEngine._generate_status_response,
            'riego': ChatbotEngine._generate_watering_response,
            'temperatura': ChatbotEngine._generate_temperature_response,
            'humedad': ChatbotEngine._generate_humidity_response,
            'recomendacion': ChatbotEngine._generate_recommendation_response,
            'explicacion': ChatbotEngine._generate_explanation_response,
            'plagas': ChatbotEngine._generate_pests_response,
            'luz': ChatbotEngine._generate_light_response,
            'fertilizacion': ChatbotEngine._generate_fertilization_response,
            'historial': ChatbotEngine._generate_history_response,
            'despedida': ChatbotEngine._generate_farewell_response
        }
        
        generator = response_templates.get(intent, ChatbotEngine._generate_general_response)
        return generator(context)
    
    @staticmethod
    def _generate_greeting_response(context: Dict) -> Dict:
        """Genera respuesta de saludo."""
        plant_name = context.get('plant_name', 'tus plantas')
        
        greetings = [
            f"¡Hola! 👋 Soy EcoBot, tu asistente de plantas inteligente. Me alegra ayudarte con {plant_name}.",
            f"¡Buenas! 🌱 Soy EcoBot, listo para ayudarte con el cuidado de {plant_name}.",
            f"¡Hola! 🤖 Soy tu asistente de IA para plantas. ¿En qué puedo ayudarte con {plant_name} hoy?"
        ]
        
        return {
            'title': '👋 ¡Bienvenido!',
            'content': greetings[0],
            'suggestions': [
                f"¿Cómo está {plant_name}?",
                "¿Necesita riego?",
                "Consulta el historial"
            ]
        }
    
    @staticmethod
    def _generate_status_response(context: Dict) -> Dict:
        """Genera respuesta sobre estado de planta."""
        planta = context.get('planta')
        ultima_medicion = context.get('ultima_medicion')
        config_ideal = context.get('config_ideal')
        
        if not planta:
            return {
                'title': '❓ Necesito más información',
                'content': '¿De qué planta te gustaría saber el estado? Por favor, dime el nombre de tu planta.'
            }
        
        if not ultima_medicion:
            return {
                'title': '📡 Sin datos recientes',
                'content': f"No tengo datos recientes de sensores para **{planta.nombre}**. Revisa que los sensores estén conectados y funcionando.",
                'action': 'Verificar conexión de sensores'
            }
        
        # Formatear respuesta detallada
        content = f"**🌱 {planta.nombre}**\n"
        if planta.tipoPlanta:
            content += f"**Tipo:** {planta.tipoPlanta}\n\n"
        
        content += "📊 **ESTADO ACTUAL:**\n"
        
        # Aquí deberías agregar los datos reales de tus sensores
        # Por ahora, un ejemplo:
        content += "• 💧 **Humedad suelo:** 45% (Óptimo: 40-60%)\n"
        content += "• 🌡️ **Temperatura:** 24°C (Ideal: 22-26°C)\n"
        content += "• 💨 **Humedad ambiente:** 65%\n"
        content += "• ☀️ **Luz:** Buena iluminación indirecta\n\n"
        
        content += "✅ **RESUMEN:** La planta está en condiciones óptimas."
        
        return {
            'title': '📈 ANÁLISIS COMPLETO',
            'content': content,
            'metrics': {
                'humidity': 45,
                'temperature': 24,
                'light': 'good',
                'health_score': 85
            }
        }
    
    @staticmethod
    def _generate_watering_response(context: Dict) -> Dict:
        """Genera respuesta sobre riego."""
        planta = context.get('planta')
        
        if not planta:
            return {
                'title': '💧 Recomendación general de riego',
                'content': "Para saber si tu planta necesita agua:\n\n1. **Toca la tierra:** Si está seca a 2-3 cm de profundidad\n2. **Observa las hojas:** Si están ligeramente caídas\n3. **Pesa la maceta:** Si está muy ligera\n\nPara recomendaciones específicas, dime el nombre de tu planta."
            }
        
        # Ejemplo de lógica de riego (ajustar según tus datos reales)
        watering_schedule = {
            'suculenta': {'frequency': 'cada 2-3 semanas', 'amount': 'poca agua'},
            'cactus': {'frequency': 'cada 3-4 semanas', 'amount': 'muy poca agua'},
            'tropical': {'frequency': 'cada 3-4 días', 'amount': 'agua moderada'},
            'orquídea': {'frequency': 'cada 7-10 días', 'amount': 'riego por inmersión'}
        }
        
        plant_type = (planta.tipoPlanta or '').lower()
        schedule = watering_schedule.get(plant_type, {'frequency': 'cada 5-7 días', 'amount': 'agua moderada'})
        
        content = f"**💧 PLAN DE RIEGO PARA {planta.nombre.upper()}**\n\n"
        content += f"**Frecuencia recomendada:** {schedule['frequency']}\n"
        content += f"**Cantidad:** {schedule['amount']}\n"
        content += f"**Mejor momento:** Mañana temprano\n\n"
        content += "🔍 **CONSEJOS:**\n"
        content += "• Usa agua a temperatura ambiente\n"
        content += "• Riega directamente en la tierra, no en las hojas\n"
        content += "• Asegura buen drenaje para evitar raíces podridas"
        
        return {
            'title': '🚰 RECOMENDACIÓN DE RIEGO',
            'content': content,
            'urgency': 'low'
        }
    
    @staticmethod
    def _generate_temperature_response(context: Dict) -> Dict:
        """Genera respuesta sobre temperatura."""
        return {
            'title': '🌡️ TEMPERATURA IDEAL',
            'content': "La temperatura ideal para la mayoría de plantas de interior:\n\n• **Día:** 18-24°C\n• **Noche:** 15-18°C\n• **Evitar:** Cambios bruscos y corrientes de aire\n\n¿Tu planta muestra signos de estrés por temperatura?"
        }
    
    @staticmethod
    def _generate_general_response(context: Dict) -> Dict:
        """Genera respuesta general cuando no se detecta intención clara."""
        return {
            'title': '🤖 ECOBOT ASSISTANT',
            'content': "Puedo ayudarte con:\n\n"
                      "🌿 **Consultas:** Estado de plantas, necesidades de riego\n"
                      "💡 **Recomendaciones:** Cuidados específicos por especie\n"
                      "⚠️ **Alertas:** Problemas detectados por sensores\n"
                      "📊 **Análisis:** Tendencias y patrones de crecimiento\n\n"
                      "¿En qué puedo asistirte específicamente?",
            'suggestions': [
                "¿Cómo está mi planta?",
                "¿Necesito regar hoy?",
                "Revisar problemas comunes"
            ]
        }
    
    # Otros métodos de generación de respuesta...
    @staticmethod
    def _generate_humidity_response(context: Dict) -> Dict:
        return {
            'title': '💨 CONTROL DE HUMEDAD',
            'content': "La humedad ideal para plantas:\n\n"
                      "• **Plantas tropicales:** 60-80%\n"
                      "• **Plantas de interior comunes:** 40-60%\n"
                      "• **Cactus y suculentas:** 30-50%\n\n"
                      "Para aumentar humedad:\n"
                      "1. Usa humidificador\n"
                      "2. Coloca bandeja con agua y piedras\n"
                      "3. Agrupa plantas"
        }
    
    @staticmethod
    def _format_plant_data(planta, medicion) -> str:
        """Formatea datos de planta para respuestas."""
        # Implementar según tus modelos
        return ""