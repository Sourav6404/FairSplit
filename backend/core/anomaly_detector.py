
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
    possible_matches =[]
    normalized = list(set(normalize_name(name) for name in names))
    for i in range(len(normalized)):
        for j in range(i +1,len(normalized)):
            first =normalized[i]
            second =normalized[j]
            first_parts =first.split()
            second_parts = second.split()
            if not first_parts or not second_parts:
                continue
            if first_parts[0] == second_parts[0] and first != second:
                possible_matches.append({
                    "name_1": first,
                    "name_2":second,
                    "type":"potential_same_person"
                })
    return possible_matches