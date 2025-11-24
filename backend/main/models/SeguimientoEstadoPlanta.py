from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils import timezone
from .Planta import Planta

class SeguimientoEstadoPlanta(models.Model):
    planta = models.ForeignKey("Planta", on_delete=models.CASCADE, related_name='seguimientos')
    estado = models.CharField(max_length=100)  # saludable, estresada, enferma, etc.
    observaciones = models.TextField(blank=True)
    fecha_registro = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'seguimiento_estado_planta'
        indexes = [
            models.Index(fields=['planta', 'fecha_registro']),
        ]
    
    def __str__(self):
        return f"Estado {self.planta.nombre} - {self.estado}"
