# main/serializers/profile_serializers.py
from rest_framework import serializers
from django.contrib.auth.hashers import check_password
from ..models import Usuario


class UserProfileSerializer(serializers.ModelSerializer):
    fecha_registro_formatted = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    
    # Campos que mapean a los nombres correctos del modelo
    nombre = serializers.CharField(source='first_name', required=False)
    apellido = serializers.CharField(source='last_name', required=False)
    fecha_registro = serializers.DateTimeField(source='date_joined', read_only=True)
    
    class Meta:
        model = Usuario
        fields = [
            'id', 'nombre', 'apellido', 'email', 'username', 
            'telefono', 'fecha_registro', 'fecha_registro_formatted',
            'avatar_url', 'is_active'
        ]
        read_only_fields = ['id', 'email', 'fecha_registro', 'is_active']
    
    def get_fecha_registro_formatted(self, obj):
        if obj.date_joined:
            return obj.date_joined.strftime('%d/%m/%Y')
        return None
    
    def get_avatar_url(self, obj):
        """Generar avatar con iniciales"""
        # Usar first_name y last_name en lugar de nombre/apellido
        first_name = obj.first_name or ''
        last_name = obj.last_name or ''
        
        if first_name and last_name:
            iniciales = f"{first_name[0]}{last_name[0]}".upper()
        elif first_name:
            iniciales = first_name[0].upper()
        elif obj.username:
            iniciales = obj.username[0].upper()
        else:
            iniciales = "U"
        
        # Color basado en ID para consistencia
        colors = ['4CAF50', '2196F3', 'FF9800', 'E91E63', '9C27B0', '00BCD4', 'FF5722']
        color_index = obj.id % len(colors) if obj.id else 0
        
        return f"https://ui-avatars.com/api/?name={iniciales}&background={colors[color_index]}&color=fff&size=150&bold=true"
    
    def update(self, instance, validated_data):
        # Mapear 'nombre' y 'apellido' a 'first_name' y 'last_name'
        if 'first_name' in validated_data:
            instance.first_name = validated_data.get('first_name', instance.first_name)
        if 'last_name' in validated_data:
            instance.last_name = validated_data.get('last_name', instance.last_name)
        
        # También manejar el caso si vienen directamente como 'nombre' y 'apellido'
        if 'nombre' in validated_data:
            instance.first_name = validated_data.get('nombre', instance.first_name)
        if 'apellido' in validated_data:
            instance.last_name = validated_data.get('apellido', instance.last_name)
        
        # Actualizar otros campos
        if 'username' in validated_data:
            instance.username = validated_data.get('username', instance.username)
        if 'telefono' in validated_data:
            instance.telefono = validated_data.get('telefono', instance.telefono)
        
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(
        required=True, 
        write_only=True,
        error_messages={'required': 'La contraseña actual es requerida'}
    )
    new_password = serializers.CharField(
        required=True, 
        write_only=True,
        min_length=6,
        error_messages={
            'min_length': 'La contraseña debe tener al menos 6 caracteres',
            'required': 'La nueva contraseña es requerida'
        }
    )
    confirm_password = serializers.CharField(
        required=True, 
        write_only=True,
        error_messages={'required': 'La confirmación de contraseña es requerida'}
    )
    
    def validate_old_password(self, value):
        user = self.context.get('user')
        if user and not user.check_password(value):
            raise serializers.ValidationError('La contraseña actual es incorrecta')
        return value
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Las contraseñas no coinciden'
            })
        
        # Validar que la nueva contraseña sea diferente a la actual
        user = self.context.get('user')
        if user and user.check_password(data['new_password']):
            raise serializers.ValidationError({
                'new_password': 'La nueva contraseña debe ser diferente a la actual'
            })
        
        return data