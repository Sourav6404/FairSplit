from rest_framework.routers import DefaultRouter

from .views import (
    GroupViewSet,
    MemberViewSet,
    ExpenseViewSet,
    SettlementViewSet
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
    "settlements",
    SettlementViewSet
)

urlpatterns = router.urls