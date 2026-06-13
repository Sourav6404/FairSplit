
import re
from decimal import Decimal,ROUND_HALF_UP

def normalize_amount(amount):
    if amount is None:
        return None
    amount = str(amount)
    amount = re.sub(r"[^0-9.,-]","", amount)
    amount=amount.replace(",","")
    try:
        value =Decimal(amount)
        value = value.quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP
        )
        return value
    except Exception:
        return None