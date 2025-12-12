from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

class PrediccionIA(models.Model):
    # Opciones para campos choices
    class TipoPrediccion(models.TextChoices):
        CHAT = 'CHAT', 'Chatbot'
        RIEGO = 'RIEGO', 'Recomendación de Riego'
        TEMPERATURA = 'TEMPERATURA', 'Control de Temperatura'
        HUMEDAD = 'HUMEDAD', 'Control de Humedad'
        FERTILIZACION = 'FERTILIZACION', 'Recomendación de Fertilización'
        PLAGAS = 'PLAGAS', 'Detección de Plagas'
        CRECIMIENTO = 'CRECIMIENTO', 'Predicción de Crecimiento'
    
    class Prioridad(models.TextChoices):
        ALTA = 'ALTA', 'Alta'
        MEDIA = 'MEDIA', 'Media'
        BAJA = 'BAJA', 'Baja'
    
    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        EJECUTADA = 'EJECUTADA', 'Ejecutada'
        DESCARTADA = 'DESCARTADA', 'Descartada'
        ACERTADA = 'ACERTADA', 'Acertada'
        ERRONEA = 'ERRONEA', 'Errónea'
    
    # --- CAMPOS EXISTENTES (NO MODIFICAR) ---
    planta = models.ForeignKey(
        "Planta", 
        on_delete=models.CASCADE, 
        related_name='predicciones',
        db_index=True  # Índice para mejor rendimiento
    )
    recomendacion = models.TextField()
    fecha_creacion = models.DateTimeField(default=timezone.now)
    confianza = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    
    # --- CAMPOS NUEVOS ---
    tipo = models.CharField(
        max_length=50,
        choices=TipoPrediccion.choices,
        default=TipoPrediccion.RIEGO,
        db_index=True
    )
    
    prioridad = models.CharField(
        max_length=10,
        choices=Prioridad.choices,
        default=Prioridad.MEDIA,
        db_index=True
    )
    
    estado = models.CharField(
        max_length=15,
        choices=Estado.choices,
        default=Estado.PENDIENTE,
        db_index=True
    )
    
    accion_sugerida = models.TextField(
        blank=True,
        help_text="Acción concreta que sugiere el sistema"
    )
    
    razon = models.TextField(
        blank=True,
        help_text="Explicación del porqué de la recomendación"
    )
    
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Datos adicionales en formato JSON"
    )
    
    ejecutada_en = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha y hora en que se ejecutó la acción sugerida"
    )
    
    # --- MÉTODOS DE CLASE ---
    class Meta:
        db_table = 'predicciones_ia'
        verbose_name = 'Predicción de IA'
        verbose_name_plural = 'Predicciones de IA'
        indexes = [
            models.Index(fields=['-fecha_creacion']),
            models.Index(fields=['estado', 'prioridad']),
            models.Index(fields=['planta', 'tipo']),
        ]
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"Predicción {self.tipo} para {self.planta} - {self.estado}"
    
    # --- MÉTODOS NUEVOS ---
    
    def marcar_ejecutada(self):
        """Marca la predicción como ejecutada"""
        self.estado = self.Estado.EJECUTADA
        self.ejecutada_en = timezone.now()
        self.save(update_fields=['estado', 'ejecutada_en'])
    
    def marcar_acertada(self):
        """Marca la predicción como acertada (después de verificación)"""
        self.estado = self.Estado.ACERTADA
        self.save(update_fields=['estado'])
    
    def marcar_erronea(self):
        """Marca la predicción como errónea"""
        self.estado = self.Estado.ERRONEA
        self.save(update_fields=['estado'])
    
    def marcar_descartada(self):
        """Marca la predicción como descartada"""
        self.estado = self.Estado.DESCARTADA
        self.save(update_fields=['estado'])
    
    def es_urgente(self):
        """Devuelve True si es de prioridad alta"""
        return self.prioridad == self.Prioridad.ALTA
    
    def necesita_accion(self):
        """Devuelve True si requiere acción (pendiente)"""
        return self.estado == self.Estado.PENDIENTE
    
    def obtener_resumen(self):
        """Devuelve un resumen de la predicción"""
        return {
            'id': self.id,
            'tipo': self.get_tipo_display(),
            'planta': str(self.planta),
            'recomendacion': self.recomendacion[:100] + '...' if len(self.recomendacion) > 100 else self.recomendacion,
            'accion_sugerida': self.accion_sugerida,
            'prioridad': self.get_prioridad_display(),
            'estado': self.get_estado_display(),
            'confianza': float(self.confianza),
            'fecha_creacion': self.fecha_creacion.isoformat()
        }