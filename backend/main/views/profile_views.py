# main/views/profile_views.py
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from ..models import Usuario, Planta, Medicion, Riego
from ..serializers.profile_serializers import UserProfileSerializer, ChangePasswordSerializer


class UserProfileView(APIView):
    """
    Vista para obtener y actualizar el perfil del usuario
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Obtener perfil del usuario actual"""
        try:
            user = request.user
            
            # Serializar datos del usuario
            serializer = UserProfileSerializer(user, context={'request': request})
            data = serializer.data
            
            # Calcular estadísticas básicas
            try:
                plantas_count = Planta.objects.filter(usuario=user).count()
                mediciones_count = Medicion.objects.filter(sensor__planta__usuario=user).count()
                
                hoy = timezone.now().date()
                riegos_hoy = Riego.objects.filter(
                    planta__usuario=user,
                    fecha_hora__date=hoy
                ).count()
                
                # Semanas activo usando date_joined
                if user.date_joined:
                    fecha_base = user.date_joined.date()
                    dias_activo = (timezone.now().date() - fecha_base).days
                    semanas_activo = max(1, dias_activo // 7)
                else:
                    semanas_activo = 1
                
                data['estadisticas'] = {
                    'plantas_count': plantas_count,
                    'mediciones_count': mediciones_count,
                    'riegos_hoy': riegos_hoy,
                    'semanas_activo': semanas_activo,
                }
                
            except Exception as stats_error:
                print(f"⚠️ Error en estadísticas: {stats_error}")
                data['estadisticas'] = {
                    'plantas_count': 0,
                    'mediciones_count': 0,
                    'riegos_hoy': 0,
                    'semanas_activo': 1,
                }
            
            return Response(data)
            
        except Exception as e:
            print(f"❌ Error al obtener perfil: {str(e)}")
            return Response(
                {'error': f'Error al obtener perfil: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request):
        """Actualizar perfil del usuario"""
        try:
            user = request.user
            
            # Usar el serializer directamente
            serializer = UserProfileSerializer(
                user, 
                data=request.data, 
                partial=True,
                context={'request': request}
            )
            
            if serializer.is_valid():
                serializer.save()
                
                return Response({
                    'success': True,
                    'message': 'Perfil actualizado correctamente',
                    'user': serializer.data
                }, status=status.HTTP_200_OK)
            
            return Response(
                {
                    'success': False,
                    'error': 'Datos inválidos',
                    'details': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            
        except Exception as e:
            print(f"❌ Error al actualizar perfil: {str(e)}")
            return Response(
                {
                    'success': False,
                    'error': f'Error al actualizar perfil: {str(e)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChangePasswordView(APIView):
    """
    Vista para cambiar la contraseña del usuario
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Cambiar contraseña del usuario"""
        try:
            user = request.user
            
            # Validar datos con el serializer
            serializer = ChangePasswordSerializer(
                data=request.data,
                context={'user': user}
            )
            
            if serializer.is_valid():
                # Cambiar la contraseña
                new_password = serializer.validated_data['new_password']
                user.set_password(new_password)
                user.save()
                
                return Response({
                    'success': True,
                    'message': 'Contraseña actualizada exitosamente'
                }, status=status.HTTP_200_OK)
            
            return Response({
                'success': False,
                'error': 'Error de validación',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print(f"❌ Error al cambiar contraseña: {str(e)}")
            return Response({
                'success': False,
                'error': f'Error al cambiar contraseña: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)