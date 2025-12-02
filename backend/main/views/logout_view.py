from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import logout

class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({'message': 'Logout exitoso'})