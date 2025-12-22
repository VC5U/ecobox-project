# backend/main/urls.py - VERSIÓN SIMPLIFICADA
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView, LogoutView, DashboardView,
    UsuarioViewSet, RolViewSet, FamiliaViewSet, 
    PlantaViewSet, SensorViewSet, MedicionViewSet, 
    RiegoViewSet, TipoSensorViewSet, EstadoSensorViewSet,
    PrediccionIAViewSet, ConfiguracionViewSet, 
    LogSistemaViewSet, NotificacionViewSet, 
    SeguimientoEstadoPlantaViewSet,
)
from .views.auth_views import RegistroView, SolicitarResetPasswordView, ResetPasswordView
from .views.profile_views import UserProfileView
from .views.ai_views import (
    AIStatusView, AIControlView, 
    PredictionView, TrainingStatusView
)
from .views import alert_views
from .views import riego_viewset
from .views.HumidityHistoryView import HumidityHistoryView
from .views.recommendation_views import RecommendationView
# IMPORTAR LAS FUNCIONES DE HISTORIAL DESDE EL ARCHIVO CORRECTO
from .views.historial_planta import historial_planta_real as historial_planta
from .views.historial_planta import historial_mediciones_sensor
from . import views
router = DefaultRouter()
router.register(r'roles', RolViewSet)
router.register(r'usuarios', UsuarioViewSet)
router.register(r'familias', FamiliaViewSet)
router.register(r'plantas', PlantaViewSet)
router.register(r'tipos-sensor', TipoSensorViewSet)
router.register(r'estados-sensor', EstadoSensorViewSet)
router.register(r'sensores', SensorViewSet)
router.register(r'mediciones', MedicionViewSet)
router.register(r'predicciones-ia', PrediccionIAViewSet)
router.register(r'riegos', RiegoViewSet)
router.register(r'configuraciones', ConfiguracionViewSet)
router.register(r'logs-sistema', LogSistemaViewSet)
router.register(r'notificaciones', NotificacionViewSet)
router.register(r'seguimientos-estado', SeguimientoEstadoPlantaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # Autenticación
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/registro/', RegistroView.as_view(), name='registro'),
    path('auth/solicitar-reset-password/', SolicitarResetPasswordView.as_view(), name='solicitar_reset_password'),
    path('auth/reset-password/<str:token>/', ResetPasswordView.as_view(), name='reset_password'),
    path('auth/profile/', UserProfileView.as_view(), name='user_profile'),
    
    # Dashboard
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    
    # IA
    path('ai/status/', AIStatusView.as_view(), name='ai-status'),
    path('ai/control/', AIControlView.as_view(), name='ai-control'),
    path('ai/predict/', PredictionView.as_view(), name='ai-predict-all'),
    path('ai/predict/<int:plant_id>/', PredictionView.as_view(), name='ai-predict-single'),
    path('ai/training-status/', TrainingStatusView.as_view(), name='training-status'),
    path('ai/metrics/', AIStatusView.as_view(), name='ai-metrics'),
    
    # Alertas
    path('alerts/', alert_views.AlertListView.as_view(), name='alert_list'),
    path('alerts/stats/', alert_views.AlertStatsView.as_view(), name='alert_stats'),
    path('alerts/mark-read/', alert_views.AlertMarkAsReadView.as_view(), name='alert_mark_read'),
    path('alerts/mark-resolved/', alert_views.AlertMarkAsResolvedView.as_view(), name='alert_mark_resolved'),
    path('alerts/create/', alert_views.AlertCreateView.as_view(), name='alert_create'),
    path('alerts/test/', alert_views.AlertTestView.as_view(), name='alert_test'),
    
    # Riegos (APIView adicionales)
    path('riegos/list/', riego_viewset.RiegoListView.as_view(), name='riego_list'),
    path('riegos/create/', riego_viewset.RiegoCreateView.as_view(), name='riego_create'),
    path('riegos/action/', riego_viewset.RiegoActionView.as_view(), name='riego_action'),
    path('riegos/stats/', riego_viewset.RiegoStatsView.as_view(), name='riego_stats'),
    path('riegos/quick/', riego_viewset.RiegoQuickActionView.as_view(), name='riego_quick'),
    path('riegos/schedule/', riego_viewset.RiegoScheduleView.as_view(), name='riego_schedule'),
     # Historial
    path('plantas/<int:id_planta>/historial/', historial_planta, name='historial_planta'),
  # NUEVO: Endpoint para historial REAL
    path('sensores/<int:sensor_id>/historial/', historial_mediciones_sensor, name='historial_sensor'),

     # NOTA: HumidityHistoryView y RecommendationView 
    path('humidity-history/', HumidityHistoryView.as_view(), name='humidity_history'),
    path('recommendations/', RecommendationView.as_view(), name='recommendations'),
]