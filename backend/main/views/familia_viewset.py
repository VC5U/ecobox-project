# views/familia_views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.shortcuts import get_object_or_404
import secrets
import string
import logging
logger = logging.getLogger(__name__)

from ..models import Familia, FamiliaUsuario, Usuario, Rol  # <- AGREGAR Rol aquí
from ..serializers.familia_serializer import (
    FamiliaSerializer, 
    CrearFamiliaSerializer, 
    UnirseFamiliaSerializer,
    CambiarRolSerializer
)

class FamiliaViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = FamiliaSerializer
    queryset = Familia.objects.all()

    def get_queryset(self):
        """Retorna solo las familias del usuario actual"""
        return Familia.objects.filter(
            miembros__usuario=self.request.user,
            miembros__activo=True
        ).distinct()
    
    @action(detail=False, methods=['post'])
    def crear_familia(self, request):
        """Crear nueva familia y asignar usuario como administrador - CORREGIDO"""
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
                
                # SOLUCIÓN: Asignar rol "Administrador" (ID: 1)
                rol_admin = Rol.objects.get(id=1)  # Rol "Administrador"
                print(f"🎯 Asignando rol admin: {rol_admin.nombre}")
                
                # Asignar usuario como administrador CON ROL
                FamiliaUsuario.objects.create(
                    familia=familia,
                    usuario=request.user,
                    rol=rol_admin,  # <- AGREGAR ROL
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
            print(f"❌ Error creando familia: {str(e)}")
            return Response({
                'success': False,
                'error': f'Error al crear la familia: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def unirse_familia(self, request):
        """Unirse a una familia usando código de invitación - VERSIÓN CORREGIDA"""
        serializer = UnirseFamiliaSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': 'Código de invitación requerido',
                'detalles': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            codigo = serializer.validated_data['codigo_invitacion']
            print(f"🔍 Buscando familia con código: {codigo}")
            
            # Buscar familia
            familia = Familia.objects.get(codigo_invitacion=codigo)
            print(f"✅ Familia encontrada: {familia.nombre} (ID: {familia.id})")
            
            # Verificar si ya es miembro
            if FamiliaUsuario.objects.filter(
                familia=familia,
                usuario=request.user,
                activo=True
            ).exists():
                return Response({
                    'success': False,
                    'error': 'Ya eres miembro de esta familia'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            print(f"👤 Creando membresía para usuario: {request.user.id}")
            
            # SOLUCIÓN: Asignar rol "Miembro" (ID: 2)
            rol_miembro = Rol.objects.get(id=2)  # Rol "Miembro"
            print(f"🎯 Asignando rol: {rol_miembro.nombre}")
            
            # Crear membresía CON el campo rol
            nueva_membresia = FamiliaUsuario.objects.create(
                familia=familia,
                usuario=request.user,
                rol=rol_miembro,  # <- ESTE ERA EL PROBLEMA
                es_administrador=False,
                activo=True
            )
            
            print(f"✅ Membresía creada exitosamente: {nueva_membresia.id}")
            
            # Serializar la familia para la respuesta
            familia_data = FamiliaSerializer(familia, context={'request': request}).data
            
            return Response({
                'success': True,
                'mensaje': 'Te has unido a la familia exitosamente',
                'familia': familia_data
            })
            
        except Familia.DoesNotExist:
            print(f"❌ Código no encontrado: {codigo}")
            return Response({
                'success': False,
                'error': 'Código de invitación inválido'
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            print(f"💥 ERROR CRÍTICO: {str(e)}")
            import traceback
            print(f"💥 TRACEBACK: {traceback.format_exc()}")
            
            return Response({
                'success': False,
                'error': f'Error del servidor: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def agregar_miembro(self, request, pk=None):
        """Agregar miembro a la familia - CORREGIDO"""
        try:
            familia = self.get_object()
            print(f"👥 Agregando miembro a familia: {familia.nombre}")
            
            usuario_id = request.data.get('usuario_id')
            es_administrador = request.data.get('es_administrador', False)
            
            if not usuario_id:
                return Response({
                    'success': False,
                    'error': 'ID de usuario requerido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Buscar usuario
            usuario = Usuario.objects.get(id=usuario_id)
            print(f"👤 Usuario a agregar: {usuario.email}")
            
            # Verificar si ya es miembro
            membresia_existente = FamiliaUsuario.objects.filter(
                familia=familia,
                usuario=usuario,
                activo=True
            ).first()
            
            if membresia_existente:
                return Response({
                    'success': False,
                    'error': 'El usuario ya es miembro de esta familia'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # SOLUCIÓN: Asignar rol según si es admin o no
            if es_administrador:
                rol = Rol.objects.get(id=1)  # Administrador
            else:
                rol = Rol.objects.get(id=2)  # Miembro
            
            # Crear membresía CON ROL
            nueva_membresia = FamiliaUsuario.objects.create(
                familia=familia,
                usuario=usuario,
                rol=rol,  # <- AGREGAR ROL
                es_administrador=es_administrador,
                activo=True
            )
            
            print(f"✅ Miembro agregado: {usuario.email} a {familia.nombre} como {rol.nombre}")
            
            return Response({
                'success': True,
                'mensaje': 'Miembro agregado exitosamente',
                'membresia_id': nueva_membresia.id
            })
            
        except Usuario.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Usuario no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"❌ Error agregando miembro: {str(e)}")
            return Response({
                'success': False,
                'error': f'Error al agregar miembro: {str(e)}'
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