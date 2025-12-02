from django.db import models
from django.contrib.auth.models import BaseUserManager

class UsuarioManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        
        # Importación diferida para evitar dependencia circular
        from django.apps import apps
        Rol = apps.get_model('main', 'Rol')
        
        if 'rol' not in extra_fields:
            rol_usuario, created = Rol.objects.get_or_create(
                nombre="Usuario",
                defaults={'descripcion': 'Usuario regular del sistema'}
            )
            extra_fields['rol'] = rol_usuario
            
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        # Importación diferida para evitar dependencia circular
        from django.apps import apps
        Rol = apps.get_model('main', 'Rol')
        
        rol_admin, created = Rol.objects.get_or_create(
            nombre="Administrador",
            defaults={'descripcion': 'Rol administrativo del sistema'}
        )
        extra_fields['rol'] = rol_admin
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
            
        return self.create_user(email, password, **extra_fields)
