# main/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone
from .UsuarioManager import UsuarioManager

class Familia(models.Model):
    nombre = models.CharField(max_length=100)
    codigo_invitacion = models.CharField(max_length=50, unique=True)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    cantidad_plantas = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'familia'
    
    def __str__(self):
        return self.nombre