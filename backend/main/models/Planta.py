# main/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class Planta(models.Model):
    nombre = models.CharField(max_length=100)
    especie = models.CharField(max_length=100)
    familia = models.ForeignKey("Familia", on_delete=models.CASCADE, related_name='plantas')
    fecha_creacion = models.DateTimeField(default=timezone.now)
    descripcion = models.TextField(blank=True)
    
    class Meta:
        db_table = 'planta'
    
    def __str__(self):
        return f"{self.nombre} ({self.especie})"

