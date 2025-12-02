from django.db import models

class LogSistema(models.Model):
    NIVELES = [
        ('INFO', 'Informativo'),
        ('WARNING', 'Advertencia'),
        ('ERROR', 'Error'),
        ('DEBUG', 'Depuración')
    ]
    
    nivel = models.CharField(max_length=10, choices=NIVELES)
    mensaje = models.TextField()
    fecha = models.DateTimeField(auto_now_add=True)
    # CORREGIDO: Usar string 'Usuario'
    usuario = models.ForeignKey('Usuario', on_delete=models.SET_NULL, null=True, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.nivel} - {self.mensaje[:50]}"
