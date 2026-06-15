from rest_framework import serializers
from .models import (
    Group,
    Member,
    Expense,
    ExpenseParticipant,
    Settlement,
    ImportSession,
    ImportAnomaly
)
class GroupSerializer(serializers.ModelSerializer):
    members = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = "__all__"

    def get_members(self, obj):
        # We need to fetch the member details. We can just return basic member info or use MemberSerializer.
        return [{"id": m.id, "name": m.name, "email": m.email} for m in obj.members.all()]
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
class ImportSessionSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = ImportSession
        fields = "__all__"


class ImportAnomalySerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = ImportAnomaly
        fields = "__all__"