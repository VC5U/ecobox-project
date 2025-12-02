from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils import timezone

class PrediccionIA(models.Model):
    planta = models.ForeignKey("Planta", on_delete=models.CASCADE, related_name='predicciones')
    recomendacion = models.TextField()
    fecha_creacion = models.DateTimeField(default=timezone.now)
    confianza = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)  # 0-1 scale
    
    class Meta:
        db_table = 'prediccion_ia'
    
    def __str__(self):
        return f"Predicción {self.planta.nombre} - {self.fecha_creacion.date()}"
