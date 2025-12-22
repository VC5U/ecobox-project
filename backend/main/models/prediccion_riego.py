from django.db import models
from django.utils import timezone

class PrediccionRiego(models.Model):
    planta = models.ForeignKey(
        "Planta", 
        on_delete=models.CASCADE, 
        related_name='predicciones_riego'
    )
    fecha_prediccion = models.DateTimeField(auto_now_add=True)
    fecha_riego_recomendada = models.DateTimeField()
    probabilidad_necesidad = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        help_text="Probabilidad 0-1 de que necesite riego"
    )
    accion_tomada = models.BooleanField(default=False)
    duracion_recomendada = models.IntegerField(
        default=30,
        help_text="Duración recomendada en segundos"
    )
    humedad_predicha = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Humedad predicha por la IA"
    )
    
    class Meta:
        db_table = 'prediccion_riego'
        indexes = [
            models.Index(fields=['planta', 'fecha_riego_recomendada']),
            models.Index(fields=['accion_tomada']),
        ]
        ordering = ['fecha_riego_recomendada']
    
    def __str__(self):
        return f"Predicción {self.planta.nombre} - {self.fecha_riego_recomendada.strftime('%Y-%m-%d %H:%M')}"