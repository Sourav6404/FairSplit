from rest_framework import generics, permissions
from rest_framework.response import Response
from django.contrib.auth.models import User

from .auth_serializers import (
    RegisterSerializer
)


class RegisterView(
    generics.CreateAPIView
):

    queryset = User.objects.all()

    serializer_class = (
        RegisterSerializer
    )

class MeView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "email": user.email
        })