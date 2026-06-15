from django.contrib.auth.models import User
from rest_framework import serializers


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True
    )

    class Meta:
        model = User

        fields = [
            "username",
            "email",
            "password",
            "first_name"
        ]

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", "")
        )
        try:
            from .models import Member
            Member.objects.filter(phone=user.username).update(
                user=user,
                is_guest=False
            )
        except Exception as e:
            print("Error linking guest members:", e)
        return user