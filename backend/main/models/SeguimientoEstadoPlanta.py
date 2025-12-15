# models.py - Asegúrate de tener estos campos
from django.db import models
from django.core.validators import FileExtensionValidator
from django.utils import timezone
class SeguimientoEstadoPlanta(models.Model):
    planta = models.ForeignKey("Planta", on_delete=models.CASCADE, related_name='seguimientos')
    estado = models.CharField(max_length=100)
    observaciones = models.TextField(blank=True)
    fecha_registro = models.DateTimeField(default=timezone.now)
    
    # Campos para imágenes (añade estos si no los tienes)
    imagen = models.ImageField(
        upload_to='seguimientos/%Y/%m/%d/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'gif', 'webp'])]
    )
    imagen_miniatura = models.ImageField(
        upload_to='seguimientos/miniaturas/%Y/%m/%d/',
        blank=True,
        null=True
    )
    
    class Meta:
        db_table = 'seguimiento_estado_planta'
        indexes = [
            models.Index(fields=['planta', 'fecha_registro']),
        ]
    
    def __str__(self):
        return f"Estado {self.planta.nombre} - {self.estado}"
    
    def save(self, *args, **kwargs):
        # Si hay imagen, crear miniatura
        creating = self.pk is None
        super().save(*args, **kwargs)
        
        if self.imagen and creating:
            self.create_thumbnail()
    
    def create_thumbnail(self):
        from PIL import Image
        import os
        
        try:
            if not self.imagen:
                return
            
            image_path = self.imagen.path
            thumb_path = os.path.join(
                os.path.dirname(image_path),
                'thumb_' + os.path.basename(image_path)
            )
            
            # Abrir imagen original
            image = Image.open(image_path)
            
            # Crear miniatura (max 300x300)
            image.thumbnail((300, 300), Image.Resampling.LANCZOS)
            
            # Guardar miniatura
            image.save(thumb_path)
            
            # Actualizar campo miniatura
            relative_path = os.path.relpath(thumb_path, settings.MEDIA_ROOT)
            self.imagen_miniatura.name = relative_path
            self.save(update_fields=['imagen_miniatura'])
            
        except Exception as e:
            print(f"Error creando miniatura: {e}")