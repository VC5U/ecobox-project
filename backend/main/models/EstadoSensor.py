from django.db import models

class EstadoSensor(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True)
    
    class Meta:
        db_table = 'estado_sensor'
    
    def __str__(self):
        return self.nombre

