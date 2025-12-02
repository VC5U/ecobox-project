# main/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class TipoSensor(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    unidad_medida = models.CharField(max_length=20)
    descripcion = models.TextField(blank=True)
    
    class Meta:
        db_table = 'tipo_sensor'
    
    def __str__(self):
        return f"{self.nombre} ({self.unidad_medida})"


