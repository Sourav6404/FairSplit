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
        return None
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
    