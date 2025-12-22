# backend/main/models/alert.py
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()

class AlertaPlanta(models.Model):
    CRITICA = 'CRITICA'
    ADVERTENCIA = 'ADVERTENCIA'
    INFO = 'INFO'
    EXITO = 'EXITO'
    
    TIPOS_ALERTA = [
        (CRITICA, 'Crítica - Riego inmediato'),
        (ADVERTENCIA, 'Advertencia - Monitorear'),
        (INFO, 'Información - Todo normal'),
        (EXITO, 'Éxito - Acción completada'),
    ]
    
    planta = models.ForeignKey(
        "Planta", 
        on_delete=models.CASCADE, 
        related_name='alertas'
    )
    tipo_alerta = models.CharField(
        max_length=20, 
        choices=TIPOS_ALERTA,
        default=ADVERTENCIA
    )
    mensaje = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_resolucion = models.DateTimeField(null=True, blank=True)
    resuelta = models.BooleanField(default=False)
    sensor_relacionado = models.ForeignKey(
        "Sensor",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alertas'
    )
    
    # NUEVOS CAMPOS para el sistema de notificaciones
    usuario = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='alertas',
        null=True,
        blank=True
    )
    leida = models.BooleanField(default=False)
    notificada = models.BooleanField(default=False)
    datos_extra = models.JSONField(default=dict, blank=True)
    
    class Meta:
        db_table = 'alerta_planta'
        indexes = [
            models.Index(fields=['planta', 'resuelta', 'fecha_creacion']),
            models.Index(fields=['tipo_alerta']),
            models.Index(fields=['usuario', 'leida']),
        ]
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"Alerta {self.tipo_alerta} - {self.planta.nombrePersonalizado}"
    
    def resolver(self):
        self.resuelta = True
        self.fecha_resolucion = timezone.now()
        self.save()
    
    def marcar_como_leida(self):
        self.leida = True
        self.save()
    
    def marcar_como_notificada(self):
        self.notificada = True
        self.save()
    
    def get_icono(self):
        iconos = {
            self.CRITICA: '🚨',
            self.ADVERTENCIA: '⚠️',
            self.INFO: 'ℹ️',
            self.EXITO: '✅',
        }
        return iconos.get(self.tipo_alerta, '📢')
    
    def get_color(self):
        colores = {
            self.CRITICA: '#dc3545',
            self.ADVERTENCIA: '#ffc107',
            self.INFO: '#17a2b8',
            self.EXITO: '#28a745',
        }
        return colores.get(self.tipo_alerta, '#6c757d')
    
    def get_prioridad(self):
        mapeo = {
            self.CRITICA: 'URGENTE',
            self.ADVERTENCIA: 'ADVERTENCIA',
            self.INFO: 'INFO',
            self.EXITO: 'SUCCESS',
        }
        return mapeo.get(self.tipo_alerta, 'INFO')
    
    def to_dict(self):
        try:
            planta_nombre = self.planta.nombrePersonalizado
        except:
            planta_nombre = self.planta.nombre if hasattr(self.planta, 'nombre') else 'Planta'
            
        return {
            'id': self.id,
            'titulo': f"Alerta en {planta_nombre}",
            'mensaje': self.mensaje,
            'tipo': self.tipo_alerta,
            'prioridad': self.get_prioridad(),
            'leida': self.leida,
            'resuelta': self.resuelta,
            'creada_en': self.fecha_creacion.isoformat(),
            'fecha_resolucion': self.fecha_resolucion.isoformat() if self.fecha_resolucion else None,
            'plant_id': self.planta.id,
            'plant_nombre': planta_nombre,
            'icono': self.get_icono(),
            'color': self.get_color(),
            'notificada': self.notificada,
        }