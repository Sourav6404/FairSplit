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
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = "__all__"

    def get_members(self, obj):
        return [{"id": m.id, "name": m.name, "email": m.email, "user_id": m.user_id} for m in obj.members.all()]

    def get_balance(self, obj):
        try:
            request = self.context.get('request')
            if not request or not request.user or request.user.is_anonymous:
                return 0
            
            member = obj.members.filter(user=request.user).first()
            if not member:
                return 0
                
            from .balance_calculator import BalanceCalculator
            calculator = BalanceCalculator(obj)
            balances = calculator.calculate_net_balance()
            return float(balances.get(member.id, 0))
        except Exception:
            return 0
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