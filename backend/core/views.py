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

    def get_queryset(self):
        user = self.request.user
        from django.db.models import Q
        return Group.objects.filter(
            Q(created_by=user) | Q(members__user=user)
        ).distinct()

    def create(self, request, *args, **kwargs):
        data = request.data
        name = data.get("name")
        members_data = data.get("members", [])

        if not name:
            return Response({"error": "Group name is required"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            group = Group.objects.create(
                name=name,
                created_by=request.user
            )

            # 1. Add the creator as a member of the group
            creator_name = request.user.first_name or request.user.username
            Member.objects.create(
                group=group,
                user=request.user,
                name=creator_name,
                phone=request.user.username
            )

            # 2. Add other members
            from django.contrib.auth.models import User
            for m in members_data:
                member_name = m.get("name", "").strip()
                member_phone = m.get("phone", "").strip()

                if not member_name and not member_phone:
                    continue

                member_user = None
                if member_phone:
                    # Prevent adding the creator again
                    if member_phone == request.user.username:
                        continue
                    member_user = User.objects.filter(username=member_phone).first()

                if member_user and member_user == request.user:
                    continue

                if not member_name and member_user:
                    member_name = member_user.first_name or member_user.username
                elif not member_name:
                    member_name = member_phone

                Member.objects.create(
                    group=group,
                    user=member_user,
                    name=member_name,
                    phone=member_phone,
                    is_guest=(member_user is None)
                )

            serializer = self.get_serializer(group)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
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

    def get_queryset(self):
        queryset = super().get_queryset()
        group_id = self.request.query_params.get('group')
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        return queryset

    @action(
    detail=False,
    methods=["post"]
)
    def bulk_import(self, request):
        """
        Creates a group with members and bulk-imports all expenses in one atomic transaction.
        Payload:
        {
          "group_name": "Historical Import",
          "members": [{"name": "Sourav", "phone": "9778470167"}, ...],
          "expenses": [
            {
              "description": "Dinner",
              "amount": 1500,
              "expense_date": "2026-06-12",
              "currency": "INR",
              "paid_by_phone": "9778470167",
              "split_type": "equal",
              "participants_phones": ["9778470167", "9999999999"]
            }, ...
          ]
        }
        """
        from django.contrib.auth.models import User as AuthUser
        data = request.data
        group_name = data.get("group_name", "Historical Import")
        members_data = data.get("members", [])
        expenses_data = data.get("expenses", [])

        try:
            with transaction.atomic():
                # 1. Create the group
                group = Group.objects.create(
                    name=group_name,
                    created_by=request.user
                )

                # 2. Build member maps: phone -> Member and name (lowercase) -> Member
                phone_to_member = {}
                name_to_member = {}
                all_members = []   # track ALL members for default participant fallback

                # Always add creator as a member
                creator_phone = request.user.username
                creator_name = request.user.first_name or request.user.username
                creator_member = Member.objects.create(
                    group=group,
                    user=request.user,
                    name=creator_name,
                    phone=creator_phone
                )
                phone_to_member[creator_phone] = creator_member
                name_to_member[creator_name.lower()] = creator_member
                all_members.append(creator_member)

                # Add other members
                for m in members_data:
                    m_phone = m.get("phone", "").strip()
                    m_name = m.get("name", "").strip()
                    if not m_phone and not m_name:
                        continue
                    if m_phone == creator_phone:
                        continue
                    if m_phone and m_phone in phone_to_member:
                        continue

                    linked_user = None
                    if m_phone:
                        linked_user = AuthUser.objects.filter(username=m_phone).first()

                    if not m_name and linked_user:
                        m_name = linked_user.first_name or linked_user.username
                    elif not m_name:
                        m_name = m_phone or "Unknown"

                    member = Member.objects.create(
                        group=group,
                        user=linked_user,
                        name=m_name,
                        phone=m_phone if m_phone else None,
                        is_guest=(linked_user is None)
                    )
                    if m_phone:
                        phone_to_member[m_phone] = member
                    name_to_member[m_name.lower()] = member
                    all_members.append(member)

                # 3. Create all expenses
                created_count = 0
                for exp in expenses_data:
                    # Payer resolution: try phone → name → creator
                    paid_by_phone = str(exp.get("paid_by_phone", "")).strip()
                    paid_by_name = str(exp.get("paid_by_name", "")).strip().lower()

                    payer_member = None
                    if paid_by_phone and paid_by_phone in phone_to_member:
                        payer_member = phone_to_member[paid_by_phone]
                    elif paid_by_name and paid_by_name in name_to_member:
                        payer_member = name_to_member[paid_by_name]
                    else:
                        payer_member = creator_member  # default to creator
                    amount = Decimal(str(exp.get("amount", 0)))
                    split_type = exp.get("split_type", "equal")
                    participants_phones = exp.get("participants_phones", [])

                    expense_date_val = exp.get("expense_date", "01-01-2026")
                    parsed_date = None
                    for fmt in ["%d-%m-%Y", "%Y-%m-%d"]:
                        try:
                            from datetime import datetime
                            parsed_date = datetime.strptime(str(expense_date_val).strip(), fmt).date()
                            break
                        except ValueError:
                            continue
                    if parsed_date is None:
                        parsed_date = expense_date_val

                    expense = Expense.objects.create(
                        group=group,
                        paid_by=payer_member,
                        description=exp.get("description", "Imported Expense"),
                        amount=amount,
                        currency=exp.get("currency", "INR"),
                        expense_date=parsed_date,
                        split_type=split_type if split_type in ["equal", "percentage", "exact"] else "equal"
                    )

                    participants_phones = exp.get("participants_phones", [])
                    participants_names = exp.get("participants_names", [])

                    participant_members = []
                    for p in participants_phones:
                        p_str = str(p).strip()
                        if p_str and p_str in phone_to_member:
                            participant_members.append(phone_to_member[p_str])

                    for name in participants_names:
                        name_lower = str(name).strip().lower()
                        if name_lower and name_lower in name_to_member:
                            mem_obj = name_to_member[name_lower]
                            if mem_obj not in participant_members:
                                participant_members.append(mem_obj)

                    if not participant_members:
                        # No specific phones/names given → include ALL group members
                        participant_members = list(all_members)

                    if expense.split_type == "equal":
                        share = amount / len(participant_members)
                        for mem in participant_members:
                            ExpenseParticipant.objects.create(
                                expense=expense,
                                member=mem,
                                share_amount=share
                            )
                    elif expense.split_type == "exact":
                        share_amounts = exp.get("share_amounts", {})
                        for mem in participant_members:
                            # Try to get by phone first, then by name, then default to equal
                            val = share_amounts.get(mem.phone) if mem.phone else None
                            if val is None:
                                val = share_amounts.get(mem.name)
                            if val is None:
                                val = amount / len(participant_members)
                            share = Decimal(str(val))
                            ExpenseParticipant.objects.create(
                                expense=expense,
                                member=mem,
                                share_amount=share
                            )
                    else:
                        share = amount / len(participant_members)
                        for mem in participant_members:
                            ExpenseParticipant.objects.create(
                                expense=expense,
                                member=mem,
                                share_amount=share
                            )

                    created_count += 1

                return Response({
                    "message": f"Successfully imported {created_count} expenses into group '{group_name}'.",
                    "group_id": group.id,
                    "group_name": group_name,
                    "member_count": len(phone_to_member),
                    "expense_count": created_count
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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

                expense_date_val = data.get("expense_date", "01-01-2026")
                parsed_date = None
                for fmt in ["%d-%m-%Y", "%Y-%m-%d"]:
                    try:
                        from datetime import datetime
                        parsed_date = datetime.strptime(str(expense_date_val).strip(), fmt).date()
                        break
                    except ValueError:
                        continue
                if parsed_date is None:
                    parsed_date = expense_date_val

                expense = Expense.objects.create(
                    group_id=data["group"],
                    paid_by_id=data["paid_by"],
                    description=data["description"],
                    amount=data["amount"],
                    currency=data.get("currency", "INR"),
                    expense_date=parsed_date,
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

    def get(self, request):
        total_groups = Group.objects.count()
        total_members = Member.objects.count()
        total_expenses = Expense.objects.count()
        total_settlements = Settlement.objects.count()

        amount_to_get = Decimal("0")
        amount_you_owe = Decimal("0")
        personal_expense = Decimal("0")

        # Only query groups the user belongs to (same filter as GroupViewSet)
        from django.db.models import Q
        user_groups = Group.objects.filter(
            Q(created_by=request.user) | Q(members__user=request.user)
        ).distinct()

        for group in user_groups:
            # Find the member record for this user in this group
            user_member = group.members.filter(user=request.user).first()
            if not user_member:
                continue

            calculator = BalanceCalculator(group)
            summary = calculator.get_balance_summary()

            # summary is keyed by str(member.id) now
            member_summary = summary.get(str(user_member.id))
            if member_summary:
                bal = member_summary["balance"]
                if bal > 0:
                    amount_to_get += bal
                elif bal < 0:
                    amount_you_owe += abs(bal)
                personal_expense += member_summary.get("share", Decimal("0"))

        total_expense_amount = Expense.objects.aggregate(total=Sum("amount"))["total"] or 0

        return Response(
            {
                "total_groups": total_groups,
                "total_members": total_members,
                "total_expenses": total_expenses,
                "total_settlements": total_settlements,
                "pending_balance": float(amount_to_get),
                "total_expenses_owed": float(amount_you_owe),
                "personal_expense": float(personal_expense),
                "total_expense_amount": float(total_expense_amount)
            }
        )