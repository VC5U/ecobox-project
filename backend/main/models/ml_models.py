# main/models/ml_models.py
from django.db import models
from django.utils import timezone

class MLModel(models.Model):
    """Modelo para guardar información de modelos de IA entrenados"""
    
    MODEL_TYPES = [
        ('RANDOM_FOREST', 'Random Forest'),
        ('GRADIENT_BOOSTING', 'Gradient Boosting'),
        ('NEURAL_NET', 'Neural Network'),
    ]
    
    name = models.CharField(max_length=100, default="Modelo IA")
    plant_id = models.IntegerField(default=0)  # ID de la planta asociada
    model_type = models.CharField(max_length=50, choices=MODEL_TYPES, default='RANDOM_FOREST')
    accuracy = models.FloatField(default=0.0)  # Precisión del modelo
    last_trained = models.DateTimeField(default=timezone.now)
    model_file = models.CharField(max_length=255, default="")  # Ruta al archivo .joblib
    is_active = models.BooleanField(default=True)
    training_samples = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Modelo de IA"
        verbose_name_plural = "Modelos de IA"
    
    def __str__(self):
        return f"{self.name} - Planta {self.plant_id} ({self.accuracy:.1%})"


class TrainingSession(models.Model):
    """Registro de sesiones de entrenamiento"""
    
    STATUS_CHOICES = [
        ('RUNNING', 'Entrenando'),
        ('COMPLETED', 'Completado'),
        ('FAILED', 'Fallido'),
    ]
    
    session_id = models.CharField(max_length=100, unique=True, default="")
    plant_id = models.IntegerField(null=True, blank=True)
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='COMPLETED')
    metrics = models.JSONField(default=dict, blank=True)  # Métricas de entrenamiento
    samples_used = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Sesión de Entrenamiento"
        verbose_name_plural = "Sesiones de Entrenamiento"
    
    def __str__(self):
        return f"Sesión {self.session_id} - {self.status}"