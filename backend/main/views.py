# main/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login, logout
from django.db.models import Count, Avg, Max
from .models import *
from .serializers import *

# ViewSets para modelos principales
class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [IsAuthenticated]

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def perfil(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class FamiliaViewSet(viewsets.ModelViewSet):
    queryset = Familia.objects.all()
    serializer_class = FamiliaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Familia.objects.filter(miembros__usuario=user).distinct()
        return Familia.objects.none()

    @action(detail=True, methods=['post'])
    def unir_familia(self, request, pk=None):
        familia = self.get_object()
        usuario = request.user
        
        # Verificar si ya es miembro
        if FamiliaUsuario.objects.filter(familia=familia, usuario=usuario).exists():
            return Response(
                {'error': 'Ya eres miembro de esta familia'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        FamiliaUsuario.objects.create(familia=familia, usuario=usuario)
        return Response({'message': 'Te has unido a la familia exitosamente'})

class PlantaViewSet(viewsets.ModelViewSet):
    queryset = Planta.objects.all()
    serializer_class = PlantaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            # Solo plantas de las familias del usuario
            familias_usuario = Familia.objects.filter(miembros__usuario=user)
            return Planta.objects.filter(familia__in=familias_usuario)
        return Planta.objects.none()

    @action(detail=True, methods=['get'])
    def estadisticas(self, request, pk=None):
        planta = self.get_object()
        estadisticas = {
            'total_sensores': planta.sensores.count(),
            'total_riegos': planta.riegos.count(),
            'ultimo_riego': None,
            'promedio_temperatura': None,
            'promedio_humedad': None
        }
        
        # Último riego
        ultimo_riego = planta.riegos.order_by('-fecha').first()
        if ultimo_riego:
            estadisticas['ultimo_riego'] = RiegoSerializer(ultimo_riego).data
        
        # Promedios de mediciones
        for sensor in planta.sensores.all():
            if sensor.tipo_sensor.nombre.lower() == 'temperatura':
                avg = sensor.mediciones.aggregate(Avg('valor'))['valor__avg']
                if avg:
                    estadisticas['promedio_temperatura'] = float(avg)
            elif sensor.tipo_sensor.nombre.lower() == 'humedad':
                avg = sensor.mediciones.aggregate(Avg('valor'))['valor__avg']
                if avg:
                    estadisticas['promedio_humedad'] = float(avg)
        
        return Response(estadisticas)

class SensorViewSet(viewsets.ModelViewSet):
    queryset = Sensor.objects.all()
    serializer_class = SensorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            familias_usuario = Familia.objects.filter(miembros__usuario=user)
            plantas_usuario = Planta.objects.filter(familia__in=familias_usuario)
            return Sensor.objects.filter(planta__in=plantas_usuario)
        return Sensor.objects.none()

    @action(detail=True, methods=['get'])
    def historial_mediciones(self, request, pk=None):
        sensor = self.get_object()
        limit = request.query_params.get('limit', 50)
        mediciones = sensor.mediciones.order_by('-fecha')[:int(limit)]
        serializer = MedicionSerializer(mediciones, many=True)
        return Response(serializer.data)

class MedicionViewSet(viewsets.ModelViewSet):
    queryset = Medicion.objects.all()
    serializer_class = MedicionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            familias_usuario = Familia.objects.filter(miembros__usuario=user)
            plantas_usuario = Planta.objects.filter(familia__in=familias_usuario)
            sensores_usuario = Sensor.objects.filter(planta__in=plantas_usuario)
            return Medicion.objects.filter(sensor__in=sensores_usuario)
        return Medicion.objects.none()

class RiegoViewSet(viewsets.ModelViewSet):
    queryset = Riego.objects.all()
    serializer_class = RiegoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            familias_usuario = Familia.objects.filter(miembros__usuario=user)
            plantas_usuario = Planta.objects.filter(familia__in=familias_usuario)
            return Riego.objects.filter(planta__in=plantas_usuario)
        return Riego.objects.none()

# Views para autenticación
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)
            user_data = UsuarioSerializer(user).data
            return Response({
                'message': 'Login exitoso',
                'user': user_data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({'message': 'Logout exitoso'})

# Views adicionales
class DashboardView(APIView):
    def get(self, request):
        try:
            from .models import Planta, Sensor
            
            total_plantas = Planta.objects.count()
            total_sensores = Sensor.objects.count()
            
            # Usar campos que SÍ existen en tu modelo
            dashboard_data = {
                'total_plantas': total_plantas,
                'total_sensores': total_sensores,
                'plantas_necesitan_agua': 2,  # Valor fijo por ahora
                'plantas_criticas': 1,        # Valor fijo por ahora
                'temperatura_promedio': '24°C',
                'humedad_promedio': '65%',
                'plantas_saludables': total_plantas - 1,  # Asumiendo 1 crítica
                'ultima_actualizacion': '2025-11-23 17:20:00'
            }
            return Response(dashboard_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': f'Error cargando dashboard: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
# ViewSets para modelos restantes
class TipoSensorViewSet(viewsets.ModelViewSet):
    queryset = TipoSensor.objects.all()
    serializer_class = TipoSensorSerializer
    permission_classes = [IsAuthenticated]

class EstadoSensorViewSet(viewsets.ModelViewSet):
    queryset = EstadoSensor.objects.all()
    serializer_class = EstadoSensorSerializer
    permission_classes = [IsAuthenticated]

class PrediccionIAViewSet(viewsets.ModelViewSet):
    queryset = PrediccionIA.objects.all()
    serializer_class = PrediccionIASerializer
    permission_classes = [IsAuthenticated]

class ConfiguracionViewSet(viewsets.ModelViewSet):
    queryset = Configuracion.objects.all()
    serializer_class = ConfiguracionSerializer
    permission_classes = [IsAuthenticated]

class LogSistemaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LogSistema.objects.all()
    serializer_class = LogSistemaSerializer
    permission_classes = [IsAuthenticated]

class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.all()
    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Notificacion.objects.filter(usuario=user)

    @action(detail=True, methods=['post'])
    def marcar_leida(self, request, pk=None):
        notificacion = self.get_object()
        notificacion.leida = True
        notificacion.save()
        return Response({'message': 'Notificación marcada como leída'})

class SeguimientoEstadoPlantaViewSet(viewsets.ModelViewSet):
    queryset = SeguimientoEstadoPlanta.objects.all()
    serializer_class = SeguimientoEstadoPlantaSerializer
    permission_classes = [IsAuthenticated]