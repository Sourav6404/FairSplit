from django.db import models

class User(models.Model):
    name=models.CharField(max_length=100)
class Group(models.Model):
    name=models.CharField(max_length=100)
class Expense(models.Model):
    description=models.CharField(max_length=255)
    amount=models.DecimalField(max_digits=10, decimal_places=2)
    