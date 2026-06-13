
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

def normalize_name(name):
    if name is None:
        return None
    return " ".join(name.strip().title().split())
def detect_similar_names(names):
    pass