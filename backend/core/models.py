from django.db import models
from django.contrib.auth.models import User
class Group(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True,null=True)
    default_currency = models.CharField(max_length=10,default="INR")
    created_by = models.ForeignKey(User,on_delete=models.CASCADE,null=True,blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.name
class Member(models.Model):
    group = models.ForeignKey(Group,on_delete=models.CASCADE,related_name="members")
    user = models.ForeignKey(User,on_delete=models.SET_NULL,null=True,blank=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True,null=True)
    join_date = models.DateField(null=True,blank=True)
    leave_date = models.DateField(null=True,blank=True)
    is_guest = models.BooleanField(default=False)
    def __str__(self):
        return self.name 
class Expense(models.Model):
    group = models.ForeignKey(Group,on_delete=models.CASCADE,related_name="expenses")
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12,decimal_places=2)
    currency = models.CharField(max_length=10,default="INR")
    paid_by = models.ForeignKey(Member,on_delete=models.CASCADE,related_name="paid_expenses")
    date = models.DateField()
    notes = models.TextField(blank=True,null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.description
class ExpenseParticipant(models.Model):
    expense = models.ForeignKey(Expense,on_delete=models.CASCADE,related_name="participants")
    member = models.ForeignKey(Member,on_delete=models.CASCADE)
    share_amount = models.DecimalField(max_digits=12,decimal_places=2,null=True,blank=True)
    share_percentage = models.DecimalField(max_digits=5,decimal_places=2,null=True,blank=True)
    def __str__(self):
        return (f"{self.member.name} - "f"{self.expense.description}")
class Settlement(models.Model):
    group = models.ForeignKey(Group,on_delete=models.CASCADE,related_name="settlements")
    payer = models.ForeignKey(Member,on_delete=models.CASCADE,related_name="settlements_paid")
    receiver = models.ForeignKey(Member,on_delete=models.CASCADE,related_name="settlements_received")
    amount = models.DecimalField(max_digits=12,decimal_places=2)
    currency = models.CharField(max_length=10,default="INR")
    settlement_date = models.DateField()
    notes = models.TextField(blank=True,null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return (f"{self.payer.name} → "f"{self.receiver.name} "f"({self.amount})")
class ImportSession(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("PROCESSING", "Processing"),
        ("WAITING_FOR_REVIEW", "Waiting For Review"),
        ("COMPLETED", "Completed"),
        ("FAILED", "Failed"),
    ]
    imported_by = models.ForeignKey(User,on_delete=models.CASCADE)
    file_name = models.CharField(max_length=255)
    total_rows = models.IntegerField(default=0)
    anomaly_count = models.IntegerField(default=0)
    imported_rows = models.IntegerField(default=0)
    status = models.CharField(max_length=30,choices=STATUS_CHOICES,default="PENDING")
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.file_name
class ImportAnomaly(models.Model):
    import_session = models.ForeignKey(ImportSession,on_delete=models.CASCADE,related_name="anomalies")
    anomaly_type = models.CharField(max_length=100)
    severity = models.CharField(max_length=20)
    anomaly_data = models.JSONField()
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
class AnomalyDecision(models.Model):
    import_anomaly = models.ForeignKey(ImportAnomaly,on_delete=models.CASCADE)
    selected_option = models.CharField(max_length=255)
    original_value = models.JSONField(null=True,blank=True)
    final_value = models.JSONField(null=True,blank=True)
    created_at = models.DateTimeField(auto_now_add=True)