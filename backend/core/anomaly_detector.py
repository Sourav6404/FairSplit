
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
        return ""
    name = str(name)
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
                    "id": "ANOMALY_SIMILAR_NAME",
                    "type": "potential_same_person",
                    "severity": "info",
                     "name_1": first,
                    "name_2": second
                })
    return possible_matches
def detect_missing_payer(expense):
    payer = expense.get("paid_by")
    if payer is None or str(payer).strip() == "":
        return {
        "id": "ANOMALY_MISSING_PAYER",
        "type":"missing_payer",
        "severity":"warning",
        "expense":expense
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
                "id": "ANOMALY_SETTLEMENT",
                "type":"settlement_detected",
                "severity":"warning",
                "expense":expense
            }
    return None
def detect_missing_currency(expense):
    currency = expense.get("currency")
    if currency is None or str(currency).strip() == "":
        return {
            "id": "ANOMALY_MISSING_CURRENCY",
            "type":"missing_currency",
            "severity":"warning",
            "expense":expense
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
                "id": "ANOMALY_REFUND",
                "type":"refund_detected",
                "severity":"info",
                "expense":expense
            }
    return {
        "id": "ANOMALY_NEGATIVE_AMOUNT",
        "type":"negative_amount",
        "severity":"warning",
        "expense":expense
    }
def detect_ambiguous_date(
    current_date,
    suggested_date,
    previous_date,
    next_date
):
    return {
        "id": "ANOMALY_AMBIGUOUS_DATE",
        "type": "ambiguous_date",
        "severity": "warning",
        "current_date": current_date,
        "suggested_date": suggested_date,
        "previous_date": previous_date,
        "next_date": next_date
    }
from datetime import datetime
def detect_invalid_date_format(expense):
    date_value = str(expense.get("date","")).strip()
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
            parsed_date = datetime.strptime(date_value, fmt)
            standardized_date =parsed_date.strftime("%d-%m-%Y")
            if standardized_date != date_value:
                return {
                    "id": "ANOMALY_INVALID_DATE_FORMAT",
                    "type":"invalid_date_format",
                    "severity":"info",
                    "converted_date": standardized_date,
                    "original_date": date_value
                }
            return None
        except ValueError:
            continue
    return {
        "id": "ANOMALY_INVALID_DATE_FORMAT",
        "type":"invalid_date_format",
        "severity":"warning",
        "original_date": date_value
    }
def detect_member_left_group(expense,member_history):
    try:
        expense_date = datetime.strptime(
        expense["date"],
        "%d-%m-%Y"
    )
    except ValueError:
        return None
    inactive_members =[]
    for participant in expense.get("participants",[]):
        member = member_history.get(participant)
        if not member:
            continue
        leave_date = member.get("leave_date")
        if leave_date:
            leave_date = datetime.strptime(leave_date, "%d-%m-%Y")
            if expense_date > leave_date:
                inactive_members.append(participant)
    if inactive_members:
        return{
            "id": "ANOMALY_MEMBER_LEFT_GROUP",
            "type": "member_left_group",
            "severity": "warning",
            "inactive_members": inactive_members,
            "expense": expense
        }
    return None
def detect_member_join_violation(expense, member_history):
    try:
        expense_date = datetime.strptime(
            expense["date"],
            "%d-%m-%Y"
        )
    except ValueError:
        return None
    invalid_members = []
    for participant in expense.get("participants", []):
        member = member_history.get(participant)
        if not member:
            continue
        join_date = member.get("join_date")
        if join_date:
            join_date = datetime.strptime(
                join_date,
                "%d-%m-%Y"
            )
            if expense_date < join_date:
                invalid_members.append(participant)
    if invalid_members:
        return {
            "id": "ANOMALY_MEMBER_JOIN_VIOLATION",
            "type": "member_join_violation",
            "severity": "warning",
            "members": invalid_members,
            "expense": expense
        }
    return None
def detect_unknown_guest(expense, group_members):
    guests = []
    member_set = {
        member.strip().lower()
        for member in group_members
    }
    for participant in expense.get("participants", []):
        if participant.strip().lower() not in member_set:
            guests.append(participant)
    if guests:
        return {
            "id": "ANOMALY_UNKNOWN_GUEST",
            "type": "unknown_guest",
            "severity": "info",
            "guests": guests,
            "expense": expense
        }
    return None
def detect_invalid_percentage_split(expense):
    split_details = expense.get("split_details", {})
    total_percentage = 0
    for percentage in split_details.values():
        try:
            total_percentage += float(percentage)
        except (ValueError, TypeError):
            return {
                "id": "ANOMALY_INVALID_PERCENTAGE_SPLIT",
                "type": "invalid_percentage_split",
                "severity": "critical",
                "total_percentage": total_percentage,
                "difference":round(100 - total_percentage, 2),
                "expense": expense,
            }
    if abs(total_percentage - 100) > 0.01:
        return {
            "id": "ANOMALY_INVALID_PERCENTAGE_SPLIT",
            "type": "invalid_percentage_split",
            "severity": "critical",
            "total_percentage": total_percentage,
            "difference": round(100 - total_percentage, 2),
            "expense": expense,
        }
    return None
def detect_split_type_conflict(expense):
    split_type = str(
        expense.get("split_type", "")
    ).strip().lower()
    split_details = expense.get(
        "split_details",
        {}
    )
    amount = float(
        expense.get("amount", 0)
    )
    if split_type == "custom":
        split_total = 0
        for value in split_details.values():
            try:
                split_total += float(value)
            except (ValueError, TypeError):
                continue
        if abs(split_total - amount) > 0.01:
            return {
                "id": "ANOMALY_SPLIT_TYPE_CONFLICT",
                "type": "split_type_conflict",
                "severity": "critical",
                "expense_amount": amount,
                "split_total": split_total,
                "difference": round( amount - split_total,2),
                "expense": expense
            }
    elif split_type == "percentage":
        percentage_total = 0
        for value in split_details.values():
            try:
                percentage_total += float(value)
            except (ValueError, TypeError):
                continue
        if abs(percentage_total - 100) > 0.01:
            return {
                "id": "ANOMALY_SPLIT_TYPE_CONFLICT",
                "type": "split_type_conflict",
                "severity": "critical",
                "percentage_total": percentage_total,
                "difference": round( 100 - percentage_total, 2 ),
                "expense": expense
            }
    return None
def detect_duplicate_expense(expense, previous_expenses):
    current_key = (
        expense.get("date"),
        normalize_amount(expense.get("amount")),
        normalize_name(expense.get("paid_by")),
        str(expense.get("description", "")).strip().lower(),
        tuple(
            sorted(
                normalize_name(p)
                for p in expense.get("participants", [])
            )
        )
    )
    for previous in previous_expenses:
        previous_key = (
            previous.get("date"),
            normalize_amount(previous.get("amount")),
            normalize_name(previous.get("paid_by")),
            str(previous.get("description", "")).strip().lower(),
            tuple(
                sorted(
                    normalize_name(p)
                    for p in previous.get("participants", [])
                )
            )
        )
        if current_key == previous_key:
            return {
                "id": "ANOMALY_DUPLICATE_EXPENSE",
                "type": "duplicate_expense",
                "severity": "critical",
                "expense": expense,
                "duplicate_of": previous
            }
    return None
def detect_conflicting_expense(
    expense,
    previous_expenses
):
    current_date = expense.get("date")
    current_description = (
        str(
            expense.get(
                "description",
                ""
            )
        )
        .strip()
        .lower()
    )
    current_participants = tuple(
        sorted(
            normalize_name(p)
            for p in expense.get(
                "participants",
                []
            )
        )
    )
    current_amount = normalize_amount(
        expense.get("amount")
    )
    current_payer = normalize_name(
        expense.get("paid_by")
    )
    for previous in previous_expenses:
        previous_date = previous.get("date")
        previous_description = (
            str(
                previous.get(
                    "description",
                    ""
                )
            )
            .strip()
            .lower()
        )
        previous_participants = tuple(
            sorted(
                normalize_name(p)
                for p in previous.get(
                    "participants",
                    []
                )
            )
        )
        previous_amount = normalize_amount(
            previous.get("amount")
        )
        previous_payer = normalize_name(
            previous.get("paid_by")
        )
        same_expense = (
            current_date == previous_date
            and
            current_description
            ==
            previous_description
            and
            current_participants
            ==
            previous_participants
        )
        conflicting_details = (
            current_amount != previous_amount
            or
            current_payer != previous_payer
        )
        if same_expense and conflicting_details:
            return {
                "id": "ANOMALY_CONFLICTING_EXPENSE",
                "type": "conflicting_expense",
                "severity": "critical",
                "expense": expense,
                "conflicting_with": previous
            }
    return None
def detect_multiple_currencies(expenses):
    currencies = {}
    max_count = max(
    currencies.values()
)

    major_currencies = [
        currency
        for currency, count
        in currencies.items()
        if count == max_count
    ]
    for expense in expenses:
        currency = (
            str(
                expense.get(
                    "currency",
                    ""
                )
            )
            .strip()
            .upper()
        )
        if not currency:
            continue
        currencies[currency] = (
            currencies.get(
                currency,
                0
            )
            + 1
        )
    if len(currencies) <= 1:
        return None
    majority_currency = max(
        currencies,
        key=currencies.get
    )
    minority_currencies = [
        c
        for c in currencies
        if c != majority_currency
    ]
    return {
    "id":
        "ANOMALY_MULTIPLE_CURRENCIES",

    "type":
        "multiple_currencies",

    "severity":
        "warning",

    "major_currency":
        majority_currency,

    "minor_currencies":
        minority_currencies
}