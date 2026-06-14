
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
def detect_missing_payer(expense):
    payer = expense.get("paid_by")
    if payer is None or str(payer).strip() == "":
        return {
        "type":"missing_payer",
        "severity":"warning",
        "message": "Payer information is missing",
        "action" : "Ask user to select a payer or mark as Unknown."
        }
    return None
def detect_settlement(expense):
    description = str(expense.get("description","")).lower()
    settlement_keywords = [
        "paid back",
        "repaid",
        "settled",
        "gave back"
    ]
    for keyword in settlement_keywords:
        if keyword in description:
            return {
                "type":"settlement_detected",
                "severity":"warning",
                "message": "This transaction appears to be a settlement rather than an expense.",
                "action": "Convert to settlement transaction."
            }
    return None
def detect_missing_currency(expense):
    currency = expense.get("currency")
    if currency is None or str(currency).strip() == "":
        return {
            "type":"missing_currency",
            "severity":"warning",
            "message": "Currency information is missing",
            "action": "Infer currency from surrounding records or ask user for confirmation."
        }
    return None
def infer_currency(expenses):
    currencies =[]
    for expense in expenses:
        currency = expense.get("currency")
        if currency is not None and str(currency).strip() != "":
            currencies.append(str(currency).strip().upper())
    if not currencies:
        return None
    currency_count ={}
    for currency in currencies:
        currency_count[currency]=currency_count.get(currency,0)+1
    return max(currency_count,key=currency_count.get)
def detect_negative_amount(expense):
    amount = expense.get("amount")
    if amount is None:
        return None
    try:
        amount = float(amount)
    except Exception:
        return None
    if amount >= 0:
        return None
    description = str(expense.get("description","")).lower()
    refund_keywords = [
        "refund",
        "cashback",
        "returned",
        "return",
        "reimbursement"
    ]
    for keyword in refund_keywords:
        if keyword in description:
            return {
                "type":"refund_detected",
                "severity":"info",
                "message": "Negative amount appears to be a refund.",
                "action": "Convert to refund transaction."
            }
    return {
        "type":"negative_amount",
        "severity":"warning",
        "message": "Negative amount detected.",
        "action": "Review transaction before import."
    }
def detect_ambiguous_date(
    current_date,
    suggested_date,
    previous_date,
    next_date
):
    return {
        "type": "ambiguous_date",
        "severity": "warning",
        "message": (f"The date '{current_date}' does not match the "
    f"surrounding transactions. Based on nearby records, "
    f"it may have been '{suggested_date}'."),
        "current_date": current_date,
        "suggested_date": suggested_date,
        "previous_date": previous_date,
        "next_date": next_date,
        "requires_user_confirmation": True,
        "user_options": (f"We found a possible date issue.\n"
    f"Current date: {current_date}\n"
    f"Suggested date: {suggested_date}\n\n"
    f"Would you like to use the suggested date, "
    f"keep the original date, or edit it manually?")
    }
from datetime import datetime
def detect_invalid_data_format(expense):
    data_value = str(expense.get("data","")).strip()
    accepted_formats = [
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%Y-%m-%d",
        "%Y/%m/%d",
        "%d %b %Y",
        "%d %B %Y",
        "%b %d %Y",
        "%B %d %Y",
        "%B %d, %Y"
    ]
    for fmt in accepted_formats:
        try:
            parsed_data = datetime.strptime(data_value, fmt)
            standardized_data =parsed_data.strftime("%d-%m-%Y")
            if standardized_data != data_value:
                return {
                    "type":"invalid_data_format",
                    "severity":"info",
                    "original_data": data_value,
                    "converted_data": standardized_data,
                    "message":(f"Data format converted from" f"'{data_value}' to '{standardized_data}'."),
                    "action": "Use standardized date format."
                }
            return None
        except ValueError:
            continue
    return {
        "type":"invalid_data_format",
        "severity":"warning",
        "original_data": data_value,
        "message": "date format is invalid or unrecognized.",
        "action": "Ask user to enter a valid date."
    }
def detect_member_left_group(expense,member_history):
    expense_data = datetime.strptime(
        expense["date"], "%d-%m-%Y"
    )
    inactive_members =[]
    for participant in expense.get("participants",[]):
        member = member_history.get(participant)
        if not member:
            continue
        leave_date = member.get("leave_date")
        if leave_date:
            leave_date = datetime.strptime(leave_date, "%d-%m-%Y")
            if expense_data > leave_date:
                inactive_members.append(participant)
    if inactive_members:
        return{
            "type": "member_left_group",
            "severity": "warning",
            "inactive_members": inactive_members,
            "message":(
                f"Inactive member found: "
                f"{', '.join(inactive_members)}. "
            ),
            "requires_user_confirmation": True,
            "user_options":[
                "remove member from expence",
                "keep member in expence",
                "Edit Participants"
            ]
        }
    return None