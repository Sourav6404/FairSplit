from rest_framework import generics
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