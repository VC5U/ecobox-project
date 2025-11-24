from django.db import models

class Sensor(models.Model):
    nombre = models.CharField(max_length=100)
    # Usando strings para evitar importaciones circulares
    planta = models.ForeignKey('Planta', on_delete=models.CASCADE, related_name='sensores')
    tipo_sensor = models.ForeignKey('TipoSensor', on_delete=models.CASCADE)
    estado_sensor = models.ForeignKey('EstadoSensor', on_delete=models.CASCADE)
    ubicacion = models.CharField(max_length=200, blank=True)
    fecha_instalacion = models.DateTimeField(auto_now_add=True)
    activo = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.nombre} - {self.planta.nombre}"
