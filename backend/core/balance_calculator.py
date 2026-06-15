from decimal import Decimal
from datetime import date
from .models import (
    Member,
    Expense,
    ExpenseParticipant,
    Settlement
)
class BalanceCalculator:
    def __init__(self, group):
        self.group = group
    def get_expense_amount(self, expense):
            return (
                expense.converted_amount
                if expense.converted_amount is not None
                else expense.amount
    )
    def calculate_paid_amount(self):
        paid = {}
        expenses = Expense.objects.filter(group=self.group)
        for expense in expenses:
            member = expense.paid_by
            expense_amount = self.get_expense_amount(
    expense
)
            paid[member.id] = (paid.get(member.id, Decimal("0"))+ expense_amount)
        return paid
    def calculate_share_amount(self):
        shares = {}
        participants = (ExpenseParticipant.objects.filter(expense__group=self.group))
        for participant in participants:
            member = participant.member
            amount =(participant.share_amount or Decimal("0"))
            shares[member.id] = (shares.get(member.id, Decimal("0"))+ amount)
        return shares
    def calculate_net_balance(self):
        paid = self.calculate_paid_amount()
        shares = self.calculate_share_amount()
        balances = {}
        members = Member.objects.filter(group=self.group)
        for member in members:
            total_paid = paid.get(member.id,Decimal("0"))
            total_share = shares.get(member.id,Decimal("0"))
            balances[member.id] = (total_paid - total_share)
        return balances
    def generate_settlements(self):
        balances = self.calculate_net_balance()
        creditors = []
        debtors = []
        for member_id, balance in balances.items():
            if balance > 0:
                creditors.append(
                    [member_id, balance]
                )
            elif balance < 0:
                debtors.append(
                    [member_id, abs(balance)]
                )
        settlements = []
        creditor_index = 0
        debtor_index = 0
        while (
            creditor_index < len(creditors)
            and debtor_index < len(debtors)
        ):
            creditor_id, credit_amount = (
                creditors[creditor_index]
            )
            debtor_id, debt_amount = (
                debtors[debtor_index]
            )
            settlement_amount = min(
                credit_amount,
                debt_amount
            )
            settlements.append(
                    {
                        "payer_id": debtor_id,
                        "payer_name": Member.objects.get(id=debtor_id).name,
                        "payer_phone": Member.objects.get(id=debtor_id).phone,
                        "receiver_id": creditor_id,
                        "receiver_name": Member.objects.get(id=creditor_id).name,
                        "receiver_phone": Member.objects.get(id=creditor_id).phone,
                        "amount": settlement_amount
                    }
                )
            creditors[creditor_index][1] -= settlement_amount
            debtors[debtor_index][1] -= settlement_amount
            if creditors[creditor_index][1] == 0:
                creditor_index += 1
            if debtors[debtor_index][1] == 0:
                debtor_index += 1
        return settlements
    def save_settlements(self):
        settlements = self.generate_settlements()
        for settlement in settlements:
            payer = Member.objects.get(id=settlement["payer_id"])
            receiver = Member.objects.get(id=settlement["receiver_id"])
            Settlement.objects.create(
                group=self.group,
                payer=payer,
                receiver=receiver,
                amount=settlement["amount"],
                currency=self.group.default_currency,
                settlement_date=date.today()
            )
        return settlements
    def get_balance_summary(self):
        paid = self.calculate_paid_amount()
        shares = self.calculate_share_amount()
        balances = self.calculate_net_balance()
        summary = {}
        members = Member.objects.filter(group=self.group)
        for member in members:
            summary[str(member.id)] = {
                "name": member.name,
                "phone": member.phone,
                "paid": paid.get(member.id,Decimal("0")),
                "share": shares.get(member.id,Decimal("0")),
                "balance": balances.get(member.id,Decimal("0")) }
        return summary