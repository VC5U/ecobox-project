from django.db import models

class Rol(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True)
    
    class Meta:
        db_table = 'rol'
        verbose_name_plural = "Roles"
    
    def __str__(self):
        return self.nombre
