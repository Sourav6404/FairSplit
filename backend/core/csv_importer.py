from .anomaly_detector import (
    detect_missing_payer,
    detect_missing_currency,
    detect_negative_amount,
    detect_invalid_date_format,
    detect_split_type_conflict,
    detect_invalid_percentage_split,
    detect_settlement,
    detect_unknown_guest,
    detect_duplicate_expense,
    detect_conflicting_expense,
    detect_multiple_currencies
)
from .anomaly_resolver import AnomalyResolver
from .report_generator import ReportGenerator
from .currency_converter import CurrencyConverter
class CSVImporter:
    def __init__(self):
        self.resolver = AnomalyResolver()
        self.detectors = [
            detect_missing_payer,
            detect_missing_currency,
            detect_negative_amount,
            detect_invalid_date_format,
            detect_split_type_conflict,
            detect_invalid_percentage_split,
            detect_settlement,
        ]
    def import_expenses(self,expenses,group_members=None):
        all_anomalies = []
        previous_expenses = []
        currency_anomaly = (
    detect_multiple_currencies(
        expenses
    )
)
        converter = CurrencyConverter()

        if currency_anomaly:

            major_currency = (
                currency_anomaly[
                    "major_currency"
                ]
            )

            for expense in expenses:

                current_currency = (
                    str(
                        expense.get(
                            "currency",
                            ""
                        )
                    )
                    .strip()
                    .upper()
                )

                if (
                    current_currency
                    and
                    current_currency
                    !=
                    major_currency
                ):

                    clean_amount = str(expense["amount"]).replace(",", "")
                    conversion = (
                        converter.convert(
                            amount=clean_amount,
                            from_currency=current_currency,
                            to_currency=major_currency,
                            date=expense["date"]
                        )
                    )

                    expense["original_amount"] = (
                        expense["amount"]
                    )

                    expense["original_currency"] = (
                        current_currency
                    )

                    expense["converted_amount"] = str(
                        conversion["converted_amount"]
                    )

                    expense["exchange_rate"] = str(
                        conversion["exchange_rate"]
                    )

                    expense["base_currency"] = (
                        major_currency
                    )
        for expense in expenses:
            duplicate = detect_duplicate_expense(expense,previous_expenses)
            if duplicate:
                resolution = self.resolver.resolve(duplicate)
                all_anomalies.append({
                         "expense": expense,
                        "anomaly": duplicate,
                         "resolution": resolution
        })
            conflict = detect_conflicting_expense(expense,previous_expenses)

            if conflict:
                resolution = self.resolver.resolve(conflict)
                all_anomalies.append({
                    "expense": expense,
                    "anomaly": conflict,
                    "resolution": resolution
        })
            for detector in self.detectors:
                anomaly = detector(expense)
                if anomaly:
                    resolution = self.resolver.resolve(anomaly)
                    all_anomalies.append(
                        {
                            "expense": expense,
                            "anomaly": anomaly,
                            "resolution": resolution
                        }
                    )
            if group_members:
                anomaly = detect_unknown_guest(
                    expense,
                    group_members)
                if anomaly:
                    resolution = self.resolver.resolve(anomaly)
                    all_anomalies.append(
                        {
                            "expense": expense,
                            "anomaly": anomaly,
                            "resolution": resolution
                        }
                    )
            previous_expenses.append(expense)
        total_expenses = len(expenses)
        total_anomalies = len(all_anomalies)
        anomaly_percentage = 0
        if total_expenses > 0:
            anomaly_percentage = round((total_anomalies/ total_expenses)* 100,2)
        summary = {
            "total_expenses": total_expenses,
            "total_anomalies": total_anomalies,
            "anomaly_percentage": anomaly_percentage
        }
        return {
            "summary": summary,
            "anomalies": all_anomalies
        }
    def import_and_generate_report(self,expenses,group_members=None):
        import_result =self.import_expenses(expenses,group_members)
        report_generator =ReportGenerator()
        report = report_generator.generate_report(import_result)
        return report