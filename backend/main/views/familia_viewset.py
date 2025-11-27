# views/familia_views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.shortcuts import get_object_or_404
import secrets
import string

from ..models import Familia, FamiliaUsuario, Usuario
from ..serializers.familia_serializer import (
    FamiliaSerializer, 
    CrearFamiliaSerializer, 
    UnirseFamiliaSerializer,
    CambiarRolSerializer
)

class FamiliaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = FamiliaSerializer
    queryset = Familia.objects.all()  # <- AGREGA ESTA LÍNEA

    def get_queryset(self):
        """Retorna solo las familias del usuario actual"""
        return Familia.objects.filter(
            miembros__usuario=self.request.user,
            miembros__activo=True
        ).distinct()
    
    @action(detail=False, methods=['post'])
    def crear_familia(self, request):
        """Crear nueva familia y asignar usuario como administrador"""
        serializer = CrearFamiliaSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': 'Datos inválidos',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Generar código único de invitación
                codigo_invitacion = self.generar_codigo_invitacion()
                
                # Crear la familia
                familia = Familia.objects.create(
                    nombre=serializer.validated_data['nombre_familia'],
                    codigo_invitacion=codigo_invitacion,
                    cantidad_plantas=0
                )
                
                # Asignar usuario como administrador
                FamiliaUsuario.objects.create(
                    familia=familia,
                    usuario=request.user,
                    es_administrador=True,
                    activo=True
                )
                
                # Serializar la respuesta
                familia_data = FamiliaSerializer(familia, context={'request': request}).data
                
                return Response({
                    'success': True,
                    'mensaje': 'Familia creada exitosamente',
                    'familia': familia_data
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Error al crear la familia'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def unirse_familia(self, request):
        """Unirse a una familia usando código de invitación"""
        serializer = UnirseFamiliaSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': 'Código de invitación requerido',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            codigo = serializer.validated_data['codigo_invitacion']
            familia = Familia.objects.get(codigo_invitacion=codigo)
            
            # Verificar si el usuario ya es miembro activo
            membresia_existente = FamiliaUsuario.objects.filter(
                familia=familia,
                usuario=request.user,
                activo=True
            ).exists()
            
            if membresia_existente:
                return Response({
                    'success': False,
                    'error': 'Ya eres miembro de esta familia'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Crear nueva membresía
            FamiliaUsuario.objects.create(
                familia=familia,
                usuario=request.user,
                es_administrador=False,  # Nuevos miembros no son administradores
                activo=True
            )
            
            # Serializar la familia para la respuesta
            familia_data = FamiliaSerializer(familia, context={'request': request}).data
            
            return Response({
                'success': True,
                'mensaje': 'Te has unido a la familia exitosamente',
                'familia': familia_data
            })
            
        except Familia.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Código de invitación inválido'
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Error al unirse a la familia'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def cambiar_rol_miembro(self, request, pk=None):
        """Cambiar rol de un miembro (solo administradores)"""
        familia = self.get_object()
        
        # Verificar permisos de administrador
        es_admin = FamiliaUsuario.objects.filter(
            familia=familia,
            usuario=request.user,
            es_administrador=True,
            activo=True
        ).exists()
        
        if not es_admin:
            return Response({
                'success': False,
                'error': 'No tienes permisos para esta acción'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = CambiarRolSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': 'Datos inválidos',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            usuario_id = serializer.validated_data['id_usuario']
            nuevo_rol = serializer.validated_data['es_administrador']
            
            # Obtener la membresía del usuario
            membresia = FamiliaUsuario.objects.get(
                familia=familia,
                usuario_id=usuario_id,
                activo=True
            )
            
            # No permitir que un administrador se quite sus propios permisos
            if membresia.usuario == request.user:
                return Response({
                    'success': False,
                    'error': 'No puedes cambiar tu propio rol'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Actualizar el rol
            membresia.es_administrador = nuevo_rol
            membresia.save()
            
            return Response({
                'success': True,
                'mensaje': 'Rol actualizado exitosamente'
            })
            
        except FamiliaUsuario.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Miembro no encontrado en esta familia'
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Error al cambiar el rol'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def eliminar_miembro(self, request, pk=None):
        """Eliminar miembro de la familia (solo administradores)"""
        familia = self.get_object()
        
        # Verificar permisos de administrador
        es_admin = FamiliaUsuario.objects.filter(
            familia=familia,
            usuario=request.user,
            es_administrador=True,
            activo=True
        ).exists()
        
        if not es_admin:
            return Response({
                'success': False,
                'error': 'No tienes permisos para esta acción'
            }, status=status.HTTP_403_FORBIDDEN)
        
        usuario_id = request.data.get('id_usuario')
        if not usuario_id:
            return Response({
                'success': False,
                'error': 'ID de usuario requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Obtener la membresía a eliminar
            membresia = FamiliaUsuario.objects.get(
                familia=familia,
                usuario_id=usuario_id,
                activo=True
            )
            
            # No permitir eliminarse a sí mismo
            if membresia.usuario == request.user:
                return Response({
                    'success': False,
                    'error': 'No puedes eliminarte a ti mismo'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Marcar como inactivo en lugar de eliminar
            membresia.activo = False
            membresia.save()
            
            return Response({
                'success': True,
                'mensaje': 'Miembro eliminado exitosamente'
            })
            
        except FamiliaUsuario.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Miembro no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def generar_codigo_invitacion(self, request, pk=None):
        """Generar nuevo código de invitación (solo administradores)"""
        familia = self.get_object()
        
        # Verificar permisos de administrador
        es_admin = FamiliaUsuario.objects.filter(
            familia=familia,
            usuario=request.user,
            es_administrador=True,
            activo=True
        ).exists()
        
        if not es_admin:
            return Response({
                'success': False,
                'error': 'No tienes permisos para esta acción'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Generar nuevo código
            nuevo_codigo = self.generar_codigo_invitacion()
            familia.codigo_invitacion = nuevo_codigo
            familia.save()
            
            return Response({
                'success': True,
                'mensaje': 'Código de invitación generado',
                'codigo_invitacion': nuevo_codigo
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': 'Error al generar código de invitación'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def generar_codigo_invitacion(self):
        """Generar código alfanumérico único de 8 caracteres"""
        while True:
            caracteres = string.ascii_uppercase + string.digits
            codigo = ''.join(secrets.choice(caracteres) for _ in range(8))
            if not Familia.objects.filter(codigo_invitacion=codigo).exists():
                return codigo