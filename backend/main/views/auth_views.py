from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
import secrets

from ..models import Usuario
from ..serializers import UsuarioSerializer

class RegistroView(APIView):
    def post(self, request):
        try:
            data = request.data
            print("📝 Datos de registro recibidos:", data)
            
            # Validar campos requeridos
            required_fields = ['email', 'password', 'nombre', 'username']
            for field in required_fields:
                if not data.get(field):
                    return Response(
                        {'error': f'El campo {field} es requerido'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Verificar si el usuario ya existe
            if Usuario.objects.filter(email=data['email']).exists():
                return Response(
                    {'error': 'Ya existe un usuario con este email'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if Usuario.objects.filter(username=data['username']).exists():
                return Response(
                    {'error': 'Este nombre de usuario ya está en uso'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Crear nuevo usuario
            usuario = Usuario.objects.create_user(
                email=data['email'],
                username=data['username'],
                password=data['password'],
                first_name=data.get('nombre', ''),
                last_name=data.get('apellido', ''),
                telefono=data.get('telefono', ''),
                is_active=True
            )
            
            # Asignar rol de usuario por defecto
            usuario.rol_id = 2  # Rol de Usuario
            usuario.save()
            
            print(f"✅ Usuario registrado: {usuario.email}")
            
            # Autenticar al usuario después del registro
            user = authenticate(username=data['email'], password=data['password'])
            
            if user:
                return Response({
                    'message': 'Usuario registrado exitosamente',
                    'user': UsuarioSerializer(user).data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'message': 'Usuario registrado, pero error en autenticación automática'
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            print(f"💥 Error en registro: {str(e)}")
            return Response(
                {'error': f'Error en el servidor: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# En main/views/auth_views.py - Agrega esta clase
class SolicitarResetPasswordView(APIView):
    def post(self, request):
        email = request.data.get('email')
        
        print(f"🔐 Solicitud reset password para: {email}")
        
        try:
            usuario = Usuario.objects.get(email=email)
            
            # Generar token único
            token = secrets.token_urlsafe(32)
            usuario.reset_password_token = token
            usuario.reset_password_expires = timezone.now() + timezone.timedelta(hours=24)
            usuario.save()
            
            # Construir el enlace
            reset_url = f"http://localhost:3000/reset-password/{token}"
            
            # Enviar email REAL
            subject = 'Recuperación de contraseña - EcoBox'
            
            # Mensaje en texto plano
            message = f'''
            Hola {usuario.first_name or 'usuario'},

            Has solicitado restablecer tu contraseña en EcoBox.

            Haz clic en el siguiente enlace para crear una nueva contraseña:
            {reset_url}

            Este enlace expirará en 24 horas.

            Si no solicitaste este cambio, ignora este email.

            Saludos,
            Equipo EcoBox
            '''
            
            # Mensaje HTML
            html_message = f'''
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #4CAF50; text-align: center;">Recuperación de contraseña - EcoBox</h2>
                    <p>Hola <strong>{usuario.first_name or 'usuario'}</strong>,</p>
                    <p>Has solicitado restablecer tu contraseña en EcoBox.</p>
                    <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
                    <p style="text-align: center;">
                        <a href="{reset_url}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                            Restablecer Contraseña
                        </a>
                    </p>
                    <p>O copia y pega este enlace en tu navegador:<br>
                    <code style="background-color: #f5f5f5; padding: 8px; border-radius: 4px; word-break: break-all;">{reset_url}</code></p>
                    <p><em>Este enlace expirará en 24 horas.</em></p>
                    <p>Si no solicitaste este cambio, ignora este email.</p>
                    <br>
                    <p>Saludos,<br><strong>Equipo EcoBox</strong></p>
                </div>
            </body>
            </html>
            '''
            
            # Enviar el email
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
            
            print(f"📧 Email de recuperación ENVIADO REALMENTE a: {email}")
            print(f"📧 Token generado: {token}")
            
            return Response({
                'message': 'Se ha enviado un enlace de recuperación a tu email'
            }, status=status.HTTP_200_OK)
            
        except Usuario.DoesNotExist:
            print(f"❌ Usuario no encontrado: {email}")
            return Response({
                'error': 'No existe un usuario con este email'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"❌ Error enviando email: {str(e)}")
            return Response({
                'error': f'Error al enviar el email de recuperación: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ResetPasswordView(APIView):
    def post(self, request):
        try:
            token = request.data.get('token')
            nueva_password = request.data.get('password')
            confirmar_password = request.data.get('confirmPassword')
            
            if not token:
                return Response(
                    {'error': 'Token es requerido'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not nueva_password or not confirmar_password:
                return Response(
                    {'error': 'La contraseña y confirmación son requeridas'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if nueva_password != confirmar_password:
                return Response(
                    {'error': 'Las contraseñas no coinciden'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                usuario = Usuario.objects.get(
                    reset_password_token=token,
                    reset_password_expires__gt=timezone.now()
                )
            except Usuario.DoesNotExist:
                return Response(
                    {'error': 'Token inválido o expirado'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Actualizar contraseña
            usuario.set_password(nueva_password)
            usuario.reset_password_token = None
            usuario.reset_password_expires = None
            usuario.save()
            
            print(f"✅ Contraseña actualizada para: {usuario.email}")
            
            return Response({
                'message': 'Contraseña actualizada exitosamente'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"💥 Error en reset password: {str(e)}")
            return Response(
                {'error': f'Error en el servidor: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )