# backend/main/models/riego.py - VERSIÓN CORREGIDA
# backend/main/models/riego.py - VERSIÓN SIMPLIFICADA
from django.db import models
from django.utils import timezone

class Riego(models.Model):
    TIPO_CHOICES = [
        ('MANUAL', 'Manual - Usuario'),
        ('AUTOMATICO', 'Automático - Programa'),
        ('IA', 'IA - Predicción automática'),
        ('EMERGENCIA', 'Emergencia - Alerta'),
    ]
    
    ESTADO_CHOICES = [
        ('PROGRAMADO', 'Programado'),
        ('EN_CURSO', 'En curso'),
        ('COMPLETADO', 'Completado'),
        ('CANCELADO', 'Cancelado'),
        ('ERROR', 'Error'),
    ]
    
    planta = models.ForeignKey(
        "Planta", 
        on_delete=models.CASCADE, 
        related_name='riegos'
    )
    
    # Opción 1: Usar get_user_model (más seguro)
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='riegos',
        null=True,
        blank=True
    )

    # Datos del riego
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='MANUAL')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PROGRAMADO')
    duracion_segundos = models.IntegerField(default=30)
    cantidad_ml = models.IntegerField(null=True, blank=True)
    
    # Programación
    fecha_programada = models.DateTimeField(null=True, blank=True)
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    # Resultados
    exito = models.BooleanField(default=True)
    mensaje_error = models.TextField(blank=True)
    humedad_inicial = models.FloatField(null=True, blank=True)
    humedad_final = models.FloatField(null=True, blank=True)
    
    # Datos adicionales
    datos_extra = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'riego'
        indexes = [
            models.Index(fields=['planta', 'fecha_creacion']),
            models.Index(fields=['estado', 'fecha_programada']),
            models.Index(fields=['usuario', 'tipo']),
        ]
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        try:
            planta_nombre = self.planta.nombrePersonalizado
        except:
            planta_nombre = self.planta.nombre if hasattr(self.planta, 'nombre') else 'Planta'
        return f"Riego {self.tipo} - {planta_nombre}"
    
    def iniciar(self):
        self.estado = 'EN_CURSO'
        self.fecha_inicio = timezone.now()
        self.save()
    
    def completar(self, exito=True, mensaje_error=''):
        self.estado = 'COMPLETADO'
        self.fecha_fin = timezone.now()
        self.exito = exito
        self.mensaje_error = mensaje_error
        self.save()
    
    def cancelar(self):
        self.estado = 'CANCELADO'
        self.save()
    
    def to_dict(self):
        try:
            planta_nombre = self.planta.nombrePersonalizado
        except:
            planta_nombre = self.planta.nombre if hasattr(self.planta, 'nombre') else 'Planta'
            
        return {
            'id': self.id,
            'planta_id': self.planta.id,
            'planta_nombre': planta_nombre,
            'tipo': self.tipo,
            'estado': self.estado,
            'duracion': self.duracion_segundos,
            'cantidad_ml': self.cantidad_ml,
            'fecha_programada': self.fecha_programada.isoformat() if self.fecha_programada else None,
            'fecha_inicio': self.fecha_inicio.isoformat() if self.fecha_inicio else None,
            'fecha_fin': self.fecha_fin.isoformat() if self.fecha_fin else None,
            'fecha_creacion': self.fecha_creacion.isoformat(),
            'exito': self.exito,
            'humedad_inicial': self.humedad_inicial,
            'humedad_final': self.humedad_final,
            'icono': self.get_icono(),
            'color': self.get_color(),
            'acciones_disponibles': self.get_acciones_disponibles(),
        }
    
    def get_icono(self):
        iconos = {
            'MANUAL': '👆',
            'AUTOMATICO': '🤖',
            'IA': '🧠',
            'EMERGENCIA': '🚨',
            'PROGRAMADO': '⏰',
            'EN_CURSO': '💧',
            'COMPLETADO': '✅',
            'CANCELADO': '❌',
            'ERROR': '⚠️',
        }
        return iconos.get(self.estado, iconos.get(self.tipo, '💧'))
    
    def get_color(self):
        colores = {
            'PROGRAMADO': '#ffc107',
            'EN_CURSO': '#17a2b8',
            'COMPLETADO': '#28a745',
            'CANCELADO': '#6c757d',
            'ERROR': '#dc3545',
        }
        return colores.get(self.estado, '#4dabf7')
    
    def get_acciones_disponibles(self):
        if self.estado == 'PROGRAMADO':
            return ['iniciar', 'cancelar']
        elif self.estado == 'EN_CURSO':
            return ['completar', 'cancelar']
        elif self.estado == 'COMPLETADO':
            return []
        elif self.estado == 'CANCELADO':
            return []
        return []