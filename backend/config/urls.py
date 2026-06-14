from django.contrib import admin
from core.views import DashboardViewSet
from django.urls import (
    path,
    include
)

urlpatterns = [

    path(
        "admin/",
        admin.site.urls
    ),

    path(
        "api/",
        include("core.urls")
    ),
    path(
    "api/auth/",
    include(
        "core.auth_urls"
    )
),
path(
    "api/dashboard/",
    DashboardViewSet.as_view()
),
]