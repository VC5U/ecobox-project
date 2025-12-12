# backend/api/ai/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AIViewSet

router = DefaultRouter()
router.register(r'', AIViewSet, basename='ai')

urlpatterns = [
    path('', include(router.urls)),
]
app_name = 'ai_api'