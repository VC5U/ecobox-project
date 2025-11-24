from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils import timezone


class Notificacion(models.Model):
    usuario = models.ForeignKey("Usuario", on_delete=models.CASCADE, related_name='notificaciones')
    mensaje = models.TextField()
    leida = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    tipo = models.CharField(max_length=50, default='info')  # info, warning, error, success
    
    class Meta:
        db_table = 'notificacion'
        indexes = [
            models.Index(fields=['usuario', 'leida']),
        ]
    
    def __str__(self):
        return f"Notificación {self.usuario.email} - {self.tipo}"

