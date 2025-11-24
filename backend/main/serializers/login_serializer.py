from rest_framework import serializers
from ..models import Usuario

class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        print(f"🔐 [LOGIN] Email recibido: {email}")
        
        if not email or not password:
            raise serializers.ValidationError('Debe proporcionar email y password')
        
        # Verificar si existe algún usuario con ese email
        users_with_email = Usuario.objects.filter(email=email)
        print(f"🔍 [LOGIN] Usuarios con ese email: {users_with_email.count()}")
        
        for user in users_with_email:
            print(f"🔍 [LOGIN] Usuario encontrado: {user.username} (activo: {user.is_active})")
        
        try:
            user = Usuario.objects.get(email=email)
            print(f"✅ [LOGIN] Usuario específico: {user.username}")
            print(f"🔑 [LOGIN] Verificando contraseña...")
            
            if user.check_password(password):
                print("✅ [LOGIN] Contraseña CORRECTA")
                if user.is_active:
                    print("✅ [LOGIN] Usuario ACTIVO - Login exitoso")
                    data['user'] = user
                    return data
                else:
                    print("❌ [LOGIN] Usuario INACTIVO")
                    raise serializers.ValidationError('Usuario desactivado')
            else:
                print("❌ [LOGIN] Contraseña INCORRECTA")
                print(f"🔑 [LOGIN] Contraseña proporcionada: '{password}'")
                raise serializers.ValidationError('Credenciales inválidas')
                
        except Usuario.DoesNotExist:
            print("❌ [LOGIN] No existe usuario con ese email")
            # Mostrar todos los emails disponibles para debug
            all_emails = Usuario.objects.values_list('email', flat=True)
            print(f"📧 [LOGIN] Emails disponibles: {list(all_emails)}")
            raise serializers.ValidationError('Credenciales inválidas')