from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    Usuario, Rol, Familia, FamiliaUsuario, Planta, 
    SeguimientoEstadoPlanta, TipoSensor, EstadoSensor, 
    Sensor, Medicion, Riego, Configuracion, 
    LogSistema, Notificacion, PrediccionIA
)

# Configuración personalizada para Usuario en el admin
class UsuarioAdmin(UserAdmin):
    list_display = ('email', 'username', 'first_name', 'last_name', 'rol', 'is_staff', 'is_active')
    list_filter = ('rol', 'is_staff', 'is_active')
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        ('Información Personal', {'fields': ('first_name', 'last_name', 'telefono', 'fecha_nacimiento', 'rol')}),
        ('Permisos', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Fechas Importantes', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('email',)
    filter_horizontal = ('groups', 'user_permissions')

# Registrar modelos en el admin
admin.site.register(Usuario, UsuarioAdmin)
admin.site.register(Rol)
admin.site.register(Familia)
admin.site.register(FamiliaUsuario)
admin.site.register(Planta)
admin.site.register(SeguimientoEstadoPlanta)
admin.site.register(TipoSensor)
admin.site.register(EstadoSensor)
admin.site.register(Sensor)
admin.site.register(Medicion)
admin.site.register(Riego)
admin.site.register(Configuracion)
admin.site.register(LogSistema)
admin.site.register(Notificacion)
admin.site.register(PrediccionIA)