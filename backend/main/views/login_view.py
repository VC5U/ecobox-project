from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.contrib.auth import login
from rest_framework.authtoken.models import Token

from ..serializers import LoginSerializer, UsuarioSerializer

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        print("🔐 Solicitud de login recibida:", request.data)  # DEBUG
        serializer = LoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            print(f"✅ Usuario autenticado: {user.email}")  # DEBUG
            
            login(request, user)
            
            # Obtener o crear el token
            token, created = Token.objects.get_or_create(user=user)
            print(f"🔑 Token {'creado' if created else 'existente'}: {token.key}")  # DEBUG
            
            user_data = UsuarioSerializer(user).data
            response_data = {
                'message': 'Login exitoso',
                'user': user_data,
                'token': token.key
            }
            print("📤 Enviando respuesta:", response_data)  # DEBUG
            
            return Response(response_data)
        
        print("❌ Errores de validación:", serializer.errors)  # DEBUG
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)