from rest_framework import viewsets

from .models import (
    Group,
    Member,
    Expense,
    Settlement
)

from .serializers import (
    GroupSerializer,
    MemberSerializer,
    ExpenseSerializer,
    SettlementSerializer
)
class GroupViewSet(viewsets.ModelViewSet):

    queryset = Group.objects.all()

    serializer_class = GroupSerializer
class MemberViewSet(viewsets.ModelViewSet):

    queryset = Member.objects.all()

    serializer_class = MemberSerializer
class ExpenseViewSet(viewsets.ModelViewSet):

    queryset = Expense.objects.all()

    serializer_class = ExpenseSerializer
class SettlementViewSet(viewsets.ModelViewSet):

    queryset = Settlement.objects.all()

    serializer_class = SettlementSerializer
