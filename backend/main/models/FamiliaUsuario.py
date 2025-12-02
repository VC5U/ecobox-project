from django.db import models

class FamiliaUsuario(models.Model):
    # Usando strings para evitar importaciones circulares
    familia = models.ForeignKey('Familia', on_delete=models.CASCADE, related_name='miembros')
    usuario = models.ForeignKey('Usuario', on_delete=models.CASCADE)
    rol = models.ForeignKey('Rol', on_delete=models.CASCADE) 
    fecha_union = models.DateTimeField(auto_now_add=True)
    es_administrador = models.BooleanField(default=False)
    activo = models.BooleanField(default=True) 
    
    class Meta:
        unique_together = ['familia', 'usuario']
        db_table = 'familia_usuario'