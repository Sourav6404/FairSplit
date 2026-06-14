from rest_framework import serializers

from .models import (
    Group,
    Member,
    Expense,
    ExpenseParticipant,
    Settlement
)
class GroupSerializer(serializers.ModelSerializer):

    class Meta:
        model = Group
        fields = "__all__"
class MemberSerializer(serializers.ModelSerializer):

    class Meta:
        model = Member
        fields = "__all__"
class ExpenseParticipantSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = ExpenseParticipant
        fields = "__all__"
class ExpenseSerializer(
    serializers.ModelSerializer
):

    participants = (
        ExpenseParticipantSerializer(
            many=True,
            read_only=True
        )
    )

    class Meta:
        model = Expense
        fields = "__all__"
class SettlementSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = Settlement
        fields = "__all__"
