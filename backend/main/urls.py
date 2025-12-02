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
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
     # Autenticación

    path('auth/registro/', RegistroView.as_view(), name='registro'),
    path('auth/solicitar-reset-password/', SolicitarResetPasswordView.as_view(), name='solicitar_reset_password'),
    path('auth/reset-password/<str:token>/', ResetPasswordView.as_view(), name='reset_password'),

]