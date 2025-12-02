from django.db import models

class Configuracion(models.Model):
    # Usando string para evitar importación circular
    usuario = models.ForeignKey('Usuario', on_delete=models.CASCADE, related_name='configuraciones')
    preferencias = models.JSONField(default=dict)  # Almacena configuraciones flexibles
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'configuracion'
        unique_together = ['usuario']
    
    def __str__(self):
        return f"Configuración {self.usuario.email}"
