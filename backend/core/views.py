from rest_framework import viewsets
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from .balance_calculator import BalanceCalculator
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from .csv_importer import CSVImporter
from .report_generator import ReportGenerator
from django.db import transaction
from decimal import Decimal
from rest_framework.permissions import IsAuthenticated
import csv
import io
from .models import (
    Group,
    Member,
    Expense,
    ExpenseParticipant,
    Settlement,
    ImportSession,
    ImportAnomaly
)
from .serializers import (
    GroupSerializer,
    MemberSerializer,
    ExpenseSerializer,
    ExpenseParticipantSerializer,
    SettlementSerializer,
    ImportSessionSerializer,
    ImportAnomalySerializer
)
class ExpenseParticipantViewSet(
    viewsets.ModelViewSet
):
    permission_classes = [
        IsAuthenticated
    ]
    queryset = (
        ExpenseParticipant.objects.all()
    )

    serializer_class = (
        ExpenseParticipantSerializer
    )
class GroupViewSet(viewsets.ModelViewSet):
    permission_classes = [
        IsAuthenticated
    ]
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    @action(
        detail=True,
        methods=["get"]
    )
    def balance_summary(self, request, pk=None):
        group = self.get_object()
        calculator = BalanceCalculator(group)
        summary = (
            calculator.get_balance_summary()
        )
        return Response(summary)
    @action(
        detail=True,
        methods=["get"]
    )
    def settlements(self, request, pk=None):
        group = self.get_object()
        calculator = BalanceCalculator(group)
        settlements = (
            calculator.generate_settlements()
        )
        return Response(settlements)
    @action(
    detail=True,
    methods=["get"]
)
    def stats(self, request, pk=None):

        group = self.get_object()

        members = (
            group.members.count()
        )

        expenses = (
            Expense.objects.filter(
                group=group
            )
        )

        expense_count = (
            expenses.count()
        )

        total_expenses = (
            expenses.aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

        spenders = {}

        for expense in expenses:

            payer = expense.paid_by

            spenders[payer.id] = (
                spenders.get(
                    payer.id,
                    0
                )
                + float(expense.amount)
            )

        top_spender = None
        top_spender_amount = 0

        if spenders:

            winner = max(
                spenders,
                key=spenders.get
            )

            member = Member.objects.get(
                id=winner
            )

            top_spender = member.name

            top_spender_amount = (
                spenders[winner]
            )

        return Response(
            {
                "group_name":
                    group.name,

                "member_count":
                    members,

                "expense_count":
                    expense_count,

                "total_expenses":
                    total_expenses,

                "top_spender":
                    top_spender,

                "top_spender_amount":
                    top_spender_amount
            }
        )
class MemberViewSet(viewsets.ModelViewSet):
    permission_classes = [
        IsAuthenticated
    ]
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
class ExpenseViewSet(viewsets.ModelViewSet):
    permission_classes = [
        IsAuthenticated
    ]
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

    @action(
    detail=False,
    methods=["post"]
)
    def create_with_participants(self, request):

        data = request.data

        participants = data.get("participants", [])

        if not participants:
            return Response(
                {"error": "Participants required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            with transaction.atomic():

                expense = Expense.objects.create(
                    group_id=data["group"],
                    paid_by_id=data["paid_by"],
                    description=data["description"],
                    amount=data["amount"],
                    currency=data.get("currency", "INR"),
                    expense_date=data["expense_date"],
                    split_type=data["split_type"]
                )

                amount = Decimal(str(expense.amount))

                # Equal Split
                if expense.split_type == "equal":

                    share = amount / len(participants)

                    for member_id in participants:

                        ExpenseParticipant.objects.create(
                            expense=expense,
                            member_id=member_id,
                            share_amount=share
                        )

                # Percentage Split
                elif expense.split_type == "percentage":

                    total_percentage = sum(
                        Decimal(str(p["percentage"]))
                        for p in participants
                    )

                    if total_percentage != Decimal("100"):

                        return Response(
                            {
                                "error":
                                "Total percentage must be 100"
                            },
                            status=400
                        )

                    for p in participants:

                        share_amount = (
                            amount *
                            Decimal(str(p["percentage"]))
                        ) / Decimal("100")

                        ExpenseParticipant.objects.create(
                            expense=expense,
                            member_id=p["member_id"],
                            percentage=p["percentage"],
                            share_amount=share_amount
                        )

                # Exact Split
                elif expense.split_type == "exact":

                    total_share = sum(
                        Decimal(str(p["share_amount"]))
                        for p in participants
                    )

                    if total_share != amount:

                        return Response(
                            {
                                "error":
                                "Exact shares must equal expense amount"
                            },
                            status=400
                        )

                    for p in participants:

                        ExpenseParticipant.objects.create(
                            expense=expense,
                            member_id=p["member_id"],
                            share_amount=p["share_amount"]
                        )

                else:

                    return Response(
                        {"error": "Invalid split type"},
                        status=400
                    )

                return Response(
                    {
                        "message":
                        "Expense created successfully",
                        "expense_id":
                        expense.id
                    },
                    status=status.HTTP_201_CREATED
                )

        except Exception as e:

            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
class SettlementViewSet(viewsets.ModelViewSet):
    permission_classes = [
        IsAuthenticated
    ]
    queryset = Settlement.objects.all()
    serializer_class = SettlementSerializer
class ImportSessionViewSet(
    viewsets.ModelViewSet
):
    permission_classes = [
        IsAuthenticated
    ]
    queryset = ImportSession.objects.all()

    serializer_class = (
        ImportSessionSerializer
    )

    parser_classes = [
        MultiPartParser
    ]

    @action(
    detail=False,
    methods=["post"]
)
    def upload(self, request):

        uploaded_file = request.FILES.get("file")

        if not uploaded_file:
            return Response(
                {
                    "error": "CSV file is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        session = ImportSession.objects.create(
            imported_by=request.user,
            file_name=uploaded_file.name,
            status="PROCESSING"
        )

        try:

            decoded_file = (
                uploaded_file
                .read()
                .decode("utf-8")
            )

            reader = csv.DictReader(
                io.StringIO(decoded_file)
            )

            expenses = list(reader)

            importer = CSVImporter()

            result = importer.import_expenses(
                expenses
            )

            anomalies = result.get(
                "anomalies",
                []
            )

            for item in anomalies:
                anomaly = item.get(
                    "anomaly",
                    {}
                )

                severity = anomaly.get(
                    "severity",
                    "warning"
                ).lower()

                severity_mapping = {
                    "critical": "CRITICAL",
                    "warning": "MEDIUM",
                    "info": "LOW"
                }

                ImportAnomaly.objects.create(
                    import_session=session,
                    anomaly_type=anomaly.get(
                        "type",
                        "unknown"
                    ),
                    severity=severity_mapping.get(
                        severity,
                        "MEDIUM"
                    ),
                    anomaly_data=item
                )

            session.total_rows = len(expenses)

            session.anomaly_count = len(
                anomalies
            )

            session.imported_rows = (
                len(expenses)
                - len(anomalies)
            )

            if anomalies:
                session.status = (
                    "WAITING_FOR_REVIEW"
                )
            else:
                session.status = (
                    "COMPLETED"
                )

            session.save()

            report = (
                ReportGenerator()
                .generate_report(result)
            )

            return Response(
                {
                    "session_id":
                        session.id,

                    "status":
                        session.status,

                    "total_rows":
                        session.total_rows,

                    "anomaly_count":
                        session.anomaly_count,

                    "report":
                        report
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:

            session.status = "FAILED"
            session.save()

            return Response(
                {
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    @action(
        detail=True,
        methods=["get"]
    )
    def anomalies(
        self,
        request,
        pk=None
    ):

        session = self.get_object()

        serializer = (
            ImportAnomalySerializer(
                session.anomalies.all(),
                many=True
            )
        )

        return Response(
            serializer.data
        )
class ImportAnomalyViewSet(
    viewsets.ModelViewSet
):
    permission_classes = [
        IsAuthenticated
    ]
    queryset = (
        ImportAnomaly.objects.all()
    )

    serializer_class = (
        ImportAnomalySerializer
    )
    @action(
    detail=True,
    methods=["post"]
)
    def resolve(self, request, pk=None):

        anomaly = self.get_object()

        anomaly.resolved = True
        anomaly.save()

        return Response(
            {
                "message": "Anomaly resolved",
                "anomaly_id": anomaly.id
            }
        )
class DashboardViewSet(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

        total_groups = Group.objects.count()

        total_members = Member.objects.count()

        total_expenses = Expense.objects.count()

        total_settlements = (
            Settlement.objects.count()
        )

        total_expense_amount = (
            Expense.objects.aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

        total_settlement_amount = (
            Settlement.objects.aggregate(
                total=Sum("amount")
            )["total"]
            or 0
        )

        pending_balance = (
            total_expense_amount
            - total_settlement_amount
        )

        return Response(
            {
                "total_groups":
                    total_groups,

                "total_members":
                    total_members,

                "total_expenses":
                    total_expenses,

                "total_settlements":
                    total_settlements,

                "pending_balance":
                    pending_balance
            }
        )