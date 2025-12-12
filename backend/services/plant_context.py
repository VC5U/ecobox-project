# backend/services/plant_context.py
"""
Utilidades para obtener contexto sobre plantas.
"""
from main.models import Planta, FamiliaUsuario, Sensor, Riego, SeguimientoEstadoPlanta
from django.db.models import Avg, Max, Min
from django.utils import timezone
from datetime import timedelta
import json


class PlantContextBuilder:
    """Construye contexto detallado sobre plantas."""
    
    @staticmethod
    def get_plant_details(plant_id):
        """Obtiene detalles completos de una planta."""
        try:
            planta = Planta.objects.select_related('familia').get(id=plant_id)
            
            # Obtener últimos datos de sensores (últimas 24 horas)
            ultimas_24h = timezone.now() - timedelta(hours=24)
            
            datos_sensores = Sensor.objects.filter(
                planta=planta,
                fecha_creacion__gte=ultimas_24h
            ).aggregate(
                avg_humedad=Avg('humedad'),
                avg_temperatura=Avg('temperatura'),
                avg_luz=Avg('nivel_luz'),
                ultima_humedad=Max('humedad')
            )
            
            # Obtener últimos riegos
            ultimos_riegos = Riego.objects.filter(
                planta=planta
            ).order_by('-fecha')[:3]
            
            # Obtener seguimientos recientes
            seguimientos = SeguimientoEstadoPlanta.objects.filter(
                planta=planta
            ).order_by('-fecha_creacion')[:5]
            
            return {
                'id': planta.id,
                'nombre': planta.nombrePersonalizado,
                'especie': planta.especie,
                'estado': planta.get_estado_display(),
                'aspecto': planta.get_aspecto_display(),
                'familia': planta.familia.nombre if planta.familia else None,
                'descripcion': planta.descripcion,
                'edad_dias': (timezone.now() - planta.fecha_creacion).days,
                'sensores': {
                    'humedad_promedio': round(datos_sensores['avg_humedad'] or 0, 1),
                    'temperatura_promedio': round(datos_sensores['avg_temperatura'] or 0, 1),
                    'luz_promedio': round(datos_sensores['avg_luz'] or 0, 1),
                    'ultima_humedad': datos_sensores['ultima_humedad'] or 0
                } if any(datos_sensores.values()) else None,
                'ultimos_riegos': [
                    {
                        'fecha': riego.fecha.strftime('%Y-%m-%d %H:%M'),
                        'cantidad_ml': riego.cantidad_agua,
                        'tipo': riego.get_tipo_display()
                    }
                    for riego in ultimos_riegos
                ],
                'seguimientos_recientes': [
                    {
                        'fecha': seg.fecha_creacion.strftime('%Y-%m-%d'),
                        'observacion': seg.observacion[:100] + '...' if seg.observacion else '',
                        'accion': seg.accion_tomada or 'Ninguna'
                    }
                    for seg in seguimientos
                ]
            }
            
        except Planta.DoesNotExist:
            return None
        except Exception as e:
            print(f"Error obteniendo detalles de planta: {e}")
            return None
    
    @staticmethod
    def get_user_plants_context(user_id):
        """Obtiene contexto de todas las plantas del usuario."""
        try:
            # Obtener familias del usuario
            familias_usuario = FamiliaUsuario.objects.filter(
                usuario_id=user_id,
                activo=True
            ).values_list('familia', flat=True)
            
            if not familias_usuario:
                return "Usuario no pertenece a ninguna familia activa."
            
            # Obtener plantas de esas familias
            plantas = Planta.objects.filter(
                familia__in=familias_usuario
            ).select_related('familia')
            
            if not plantas.exists():
                return "No hay plantas registradas en las familias del usuario."
            
            # Contar por estado
            estados = plantas.values('estado').annotate(count=models.Count('id'))
            estado_summary = {estado['estado']: estado['count'] for estado in estados}
            
            # Plantas que necesitan atención (estado 'necesita_agua' o 'peligro')
            plantas_atencion = plantas.filter(
                estado__in=['necesita_agua', 'peligro']
            )[:5]
            
            context = f"📊 RESUMEN DE PLANTAS ({plantas.count()} total):\n"
            
            for estado, count in estado_summary.items():
                estado_display = dict(Planta.ESTADOS).get(estado, estado)
                icon = "✅" if estado == 'saludable' else "💧" if estado == 'necesita_agua' else "⚠️" if estado == 'peligro' else "🌱"
                context += f"{icon} {estado_display}: {count} plantas\n"
            
            if plantas_atencion.exists():
                context += "\n🚨 PLANTAS QUE NECESITAN ATENCIÓN:\n"
                for planta in plantas_atencion:
                    context += f"• {planta.nombrePersonalizado} ({planta.especie}): {planta.get_estado_display()}\n"
            
            # Última actividad
            try:
                ultimo_riego = Riego.objects.filter(
                    planta__familia__in=familias_usuario
                ).order_by('-fecha').first()
                
                if ultimo_riego:
                    context += f"\n⏰ ÚLTIMO RIEGO: {ultimo_riego.fecha.strftime('%d/%m %H:%M')} - {ultimo_riego.planta.nombrePersonalizado}"
            except:
                pass
            
            return context
            
        except Exception as e:
            print(f"Error obteniendo contexto de usuario: {e}")
            return "Información de plantas no disponible temporalmente."
    
    @staticmethod
    def build_system_prompt():
        """Construye el prompt del sistema para OpenAI."""
        return """Eres EcoBox AI, un asistente virtual especializado en cuidado de plantas, jardinería y botánica.

TU ROL:
• Experto en diagnóstico de salud vegetal
• Asesor de jardinería doméstica
• Especialista en plantas de interior y exterior
• Consultor de sistemas de riego automatizado

TU ESTILO:
• Responde en español claro y amigable
• Usa emojis relevantes (🌿💧☀️⚠️✅)
• Sé conciso pero completo
• Organiza información con bullet points
• Da recomendaciones prácticas y específicas

ÁREAS DE EXPERTISE:
1. DIAGNÓSTICO DE SALUD - Identificar problemas comunes
2. RECOMENDACIONES DE RIEGO - Frecuencia, cantidad, métodos
3. CONTROL DE PLAGAS - Prevención y tratamiento natural
4. NUTRICIÓN VEGETAL - Abonos, fertilizantes, sustratos
5. CONDICIONES AMBIENTALES - Luz, temperatura, humedad
6. PROPAGACIÓN - Reproducción de plantas
7. PODA Y MANTENIMIENTO - Técnicas apropiadas

FORMATO DE RESPUESTAS:
1. Título claro del tema
2. Análisis basado en información proporcionada
3. Recomendaciones específicas numeradas
4. Consejos prácticos
5. Señales de alerta a observar

Si no tienes suficiente información, pide detalles adicionales.
NUNCA inventes información si no estás seguro."""