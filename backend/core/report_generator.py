class ReportGenerator:

    def generate_summary(self, import_result):
        return import_result.get("summary", {})

    def generate_severity_breakdown(self, anomalies):
        breakdown = {
            "critical": 0,
            "warning": 0,
            "info": 0
        }

        for item in anomalies:
            anomaly = item.get("anomaly", {})
            severity = anomaly.get("severity")

            if severity in breakdown:
                breakdown[severity] += 1

        return breakdown

    def generate_anomaly_breakdown(self, anomalies):
        breakdown = {}

        for item in anomalies:
            anomaly = item.get("anomaly", {})
            anomaly_type = anomaly.get("type")

            if anomaly_type:
                breakdown[anomaly_type] = (
                    breakdown.get(anomaly_type, 0) + 1
                )

        return breakdown

    def generate_report(self, import_result):
        anomalies = import_result.get("anomalies", [])

        return {
            "summary": self.generate_summary(import_result),

            "severity_breakdown":
                self.generate_severity_breakdown(anomalies),

            "anomaly_breakdown":
                self.generate_anomaly_breakdown(anomalies),

            "anomalies": anomalies
        }