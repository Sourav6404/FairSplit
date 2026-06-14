from django.contrib import admin
from .models import (
Group,Member,Expense,ExpenseParticipant,Settlement,ImportSession, ImportAnomaly, AnomalyDecision)
admin.site.register(Group)
admin.site.register(Member)
admin.site.register(Expense)
admin.site.register(ExpenseParticipant)
admin.site.register(Settlement)
admin.site.register(ImportSession)
admin.site.register(ImportAnomaly)
admin.site.register(AnomalyDecision)