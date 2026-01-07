from django.db import models
from django.utils import timezone

class Medicion(models.Model):
    sensor = models.ForeignKey("Sensor", on_delete=models.CASCADE, related_name='mediciones')
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    fecha = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'medicion'
        indexes = [
            models.Index(fields=['sensor', 'fecha']),
        ]
    
    def __str__(self):
        return f"Medición {self.sensor.tipo_sensor.nombre}: {self.valor}"

