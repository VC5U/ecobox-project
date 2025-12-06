# main/models.py
from django.db import models
from django.utils import timezone

class Planta(models.Model):
    ESTADOS = [
        ('saludable', 'Saludable'),
        ('necesita_agua', 'Necesita Agua'),
        ('peligro', 'En Peligro'),
        ('normal', 'Normal'),
    ]
    
    ASPECTOS = [
        ('normal', 'Normal'),
        ('floreciendo', 'Floreciendo'),
        ('con_frutos', 'Con Frutos'),
        ('hojas_amarillas', 'Hojas Amarillas'),
        ('crecimiento_lento', 'Crecimiento Lento'),
        ('exuberante', 'Exuberante'),
    ]
    
    # Renombra o agrega campos para coincidir con frontend
    nombrePersonalizado = models.CharField(max_length=100)  # Cambiado de 'nombre'
    especie = models.CharField(max_length=100)  # Mantener
    familia = models.ForeignKey("Familia", on_delete=models.CASCADE, related_name='plantas')
    estado = models.CharField(max_length=20, choices=ESTADOS, default='normal')
    aspecto = models.CharField(max_length=20, choices=ASPECTOS, default='normal')
    fecha_creacion = models.DateTimeField(default=timezone.now)
    descripcion = models.TextField(blank=True)
    foto = models.ImageField(upload_to='plantas/', null=True, blank=True)
    
    class Meta:
        db_table = 'planta'
    
    def __str__(self):
        return f"{self.nombrePersonalizado} ({self.especie})"