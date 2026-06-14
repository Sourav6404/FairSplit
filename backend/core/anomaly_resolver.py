class AnomalyResolver:
    def resolve(self, anomaly):
        anomaly_id = anomaly.get("id")
        if anomaly_id == "ANOMALY_DUPLICATE_EXPENSE":
            return self.resolve_duplicate_expense(anomaly)
        elif anomaly_id == "ANOMALY_CONFLICTING_EXPENSE":
            return self.resolve_conflicting_expense(anomaly)
        elif anomaly_id == "ANOMALY_SIMILAR_NAME":
            return self.resolve_similar_name(anomaly)
        elif anomaly_id == "ANOMALY_MISSING_PAYER":
            return self.resolve_missing_payer(anomaly)
        elif anomaly_id == "ANOMALY_MISSING_CURRENCY":
            return self.resolve_missing_currency(anomaly)
        elif anomaly_id == "ANOMALY_REFUND":
            return self.resolve_refund(anomaly)
        elif anomaly_id == "ANOMALY_NEGATIVE_AMOUNT":
            return self.resolve_negative_amount(anomaly)
        elif anomaly_id == "ANOMALY_AMBIGUOUS_DATE":
            return self.resolve_ambiguous_date(anomaly)
        elif anomaly_id == "ANOMALY_INVALID_DATE_FORMAT":
            return self.resolve_invalid_date_format(anomaly)
        elif anomaly_id == "ANOMALY_MEMBER_LEFT_GROUP":
            return self.resolve_member_left_group(anomaly)
        elif anomaly_id == "ANOMALY_MEMBER_JOIN_VIOLATION":
            return self.resolve_member_join_violation(anomaly)
        elif anomaly_id == "ANOMALY_UNKNOWN_GUEST":
            return self.resolve_unknown_guest(anomaly)
        elif anomaly_id == "ANOMALY_INVALID_PERCENTAGE_SPLIT":
            return self.resolve_invalid_percentage_split(anomaly)
        elif anomaly_id == "ANOMALY_SPLIT_TYPE_CONFLICT":
            return self.resolve_split_type_conflict(anomaly)
        elif anomaly_id == "ANOMALY_SETTLEMENT":
            return self.resolve_settlement(anomaly)
        return {
            "title": "Unknown Anomaly",
             "message": "An unknown anomaly was detected.",
             "suggestion": "Review the record manually.",
             "options": [
             "Review Record"
             ]
}
    def resolve_duplicate_expense(self, anomaly):
        return {
            "title": "Duplicate Expense",
            "message": "An exact duplicate expense was detected.",
             "suggestion":"This record is likely an accidental duplicate.",
            "options": [
                "Remove Duplicate",
                "Keep Both"
             ]
    }
    def resolve_conflicting_expense(self, anomaly):
        return {
        "title": "Conflicting Expense",
        "message":
            "Two expenses appear to describe the same event but contain different financial details.",
        "suggestion":
            "Review both records before importing.",
        "options": [
            "Keep First Record",
            "Keep Second Record",
            "Keep Both",
            "Edit Manually"
        ]
    }
    def resolve_similar_name(self, anomaly):
        return {
        "title": "Potential Member Match",
        "message":
            f"{anomaly['name_1']} and "
            f"{anomaly['name_2']} may refer to the same person.",
        "suggestion":
            "Merge if they represent the same member.",
        "options": [
            "Merge Members",
            "Keep Separate"
        ]
    }
    def resolve_missing_payer(self, anomaly):
        return {
        "title": "Missing Payer",
        "message":
            "Payer information is missing.",
        "suggestion":
            "Select a payer or mark as Unknown.",
        "options": [
            "Select Existing Member",
            "Mark As Unknown"
        ]
    }
    def resolve_missing_currency(self, anomaly):
        return {
        "title": "Missing Currency",
        "message":
            "Currency information is missing.",
        "suggestion":
            "Use inferred currency or choose another currency.",
        "options": [
            "Use Suggested Currency",
            "Choose Different Currency"
        ]
    }
    def resolve_refund(self, anomaly):
        return {
        "title": "Refund Detected",
        "message":
            "This transaction appears to be a refund.",
        "suggestion":
            "Convert this record into a refund transaction.",
        "options": [
            "Convert To Refund",
            "Keep As Expense",
            "Edit Manually"
        ]
    }
    def resolve_negative_amount(self, anomaly):
        return {
        "title": "Negative Amount",
        "message":
            "A negative amount was detected.",
        "suggestion":
            "Review this transaction before importing.",
        "options": [
            "Treat As Refund",
            "Keep Original",
            "Edit Amount"
        ]
    }
    def resolve_ambiguous_date(self, anomaly):
        return {
        "title": "Ambiguous Date",
        "message":
            f"The date '{anomaly['current_date']}' "
            f"may have been "
            f"'{anomaly['suggested_date']}'.",
        "suggestion":
            "Confirm the correct date.",
        "options": [
            "Use Suggested Date",
            "Keep Original Date",
            "Edit Date"
        ]
    }
    def resolve_invalid_date_format(self, anomaly):
        if "converted_date" in anomaly:
            return {
            "title": "Date Format Normalized",
            "message":f"The date was converted to "f"{anomaly['converted_date']}.",
            "suggestion":"Use the standardized date format.",
            "options": [
                "Accept Conversion",
                "Edit Date"
            ]
        }
        return {
        "title": "Invalid Date Format",
        "message":"The date format could not be recognized.",
        "suggestion":"Provide a valid date.",
        "options": [
            "Edit Date",
            "Skip Record"
        ]
    }
    def resolve_member_left_group(self, anomaly):
        members = ", ".join(anomaly["inactive_members"])
        return {
        "title": "Inactive Member",
        "message":f"{members} participated after leaving the group.",
        "suggestion":"Review participant membership.",
        "options": [
            "Remove Member",
            "Keep Member",
            "Edit Participants"
        ]
    }
    def resolve_member_join_violation(self,anomaly):
        members = ", ".join(anomaly["members"])
        return {
        "title": "Member Join Violation",
        "message":f"{members} participated before joining the group.",
        "suggestion":"Review join dates.",
        "options": [
            "Remove Member",
            "Keep Member",
            "Edit Join Date"
        ]
    }
    def resolve_unknown_guest(self, anomaly):
        guests = ", ".join(anomaly["guests"])
        return {
        "title": "Unknown Participant",
        "message":f"{guests} are not registered group members.",
        "suggestion":"Create guest records or add members.",
        "options": [
            "Create Guest",
            "Convert To Member",
            "Remove Participant"
        ]
    }
    def resolve_invalid_percentage_split(self,anomaly):
        return {
        "title": "Invalid Percentage Split",
        "message":
            f"Split totals "
            f"{anomaly['total_percentage']}% "
            f"instead of 100%.",
        "suggestion":
            "Adjust percentages.",
        "options": [
            "Edit Percentages",
            "Auto Distribute Difference",
            "Cancel Import"
        ]
    }
    def resolve_split_type_conflict(self,anomaly):
        return {
        "title": "Split Type Conflict",
        "message":
            "Split details do not match the expense amount.",
        "suggestion":
            "Review split calculations.",
        "options": [
            "Edit Split",
            "Auto Adjust",
            "Cancel Import"
        ]
    }
    def resolve_settlement(self, anomaly):
        return {
        "title": "Settlement Detected",
        "message":
            "This transaction appears to be a settlement rather than an expense.",
        "suggestion":
            "Convert this record into a settlement transaction.",
        "options": [
            "Convert To Settlement",
            "Keep As Expense",
            "Edit Manually"
        ]
    }