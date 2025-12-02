from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils import timezone
from .Planta import Planta
class Riego(models.Model):
    planta = models.ForeignKey("Planta", on_delete=models.CASCADE, related_name='riegos')
    fecha = models.DateTimeField(default=timezone.now)
    duracion = models.IntegerField(help_text="Duración en segundos")
    cantidad_agua = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="Cantidad en ml")
    
    class Meta:
        db_table = 'riego'
    
    def __str__(self):
        return f"Riego {self.planta.nombre} - {self.fecha.date()}"

