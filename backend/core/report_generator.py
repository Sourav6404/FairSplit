class ReportGenerator:
    def generate_report(self,anomalies):
        return {
            "duplicates":[],
            "conflicts":[],
            "warnings":[]
        }