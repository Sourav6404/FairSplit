from anomaly_detector import (
    detect_missing_payer,
    detect_missing_currency,
    detect_negative_amount,
    detect_invalid_date_format,
    detect_split_type_conflict,
    detect_invalid_percentage_split,
    detect_settlement,
    detect_unknown_guest,
    detect_duplicate_expense,
    detect_conflicting_expense
)
from anomaly_resolver import AnomalyResolver
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