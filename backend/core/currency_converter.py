from decimal import Decimal
import requests
from datetime import datetime

class CurrencyConverter:

    def normalize_date(self, date):
        # Try multiple date formats to be flexible
        for fmt in ("%d-%m-%Y", "%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"):
            try:
                return datetime.strptime(date, fmt).strftime("%Y-%m-%d")
            except ValueError:
                continue
        # If nothing works, return the date as-is
        return date


    def get_exchange_rate(
        self,
        from_currency,
        to_currency,
        date
    ):

        if from_currency == to_currency:
            return Decimal("1")

        normalized_date = (
    self.normalize_date(
        date
    )
)

        url = (
            f"https://api.frankfurter.app/"
            f"{normalized_date}"
            f"?from={from_currency}"
            f"&to={to_currency}"
        )

        response = requests.get(url)

        if response.status_code != 200:
            raise Exception(
                "Unable to fetch exchange rate"
            )

        data = response.json()

        rate = data["rates"][to_currency]

        return Decimal(str(rate))

    def convert(
        self,
        amount,
        from_currency,
        to_currency,
        date
    ):

        rate = self.get_exchange_rate(
            from_currency,
            to_currency,
            date
        )

        converted_amount = (
            Decimal(str(amount))
            * rate
        )

        return {
            "original_amount":
                Decimal(str(amount)),

            "original_currency":
                from_currency,

            "base_currency":
                to_currency,

            "exchange_rate":
                rate,

            "converted_amount":
                converted_amount
        }