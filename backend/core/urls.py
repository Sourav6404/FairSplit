from rest_framework.routers import DefaultRouter

from .views import (
    GroupViewSet,
    MemberViewSet,
    ExpenseViewSet,
    ExpenseParticipantViewSet,
    SettlementViewSet,
    ImportSessionViewSet,
    ImportAnomalyViewSet
)

router = DefaultRouter()

router.register(
    "groups",
    GroupViewSet
)

router.register(
    "members",
    MemberViewSet
)

router.register(
    "expenses",
    ExpenseViewSet
)

router.register(
    "expense-participants",
    ExpenseParticipantViewSet
)

router.register(
    "settlements",
    SettlementViewSet
)
router.register(
    "imports",
    ImportSessionViewSet
)
router.register(
    "anomalies",
    ImportAnomalyViewSet
)

urlpatterns = router.urls