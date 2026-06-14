from decimal import Decimal
import requests
from datetime import datetime
def normalize_date(
    self,
    date
):

    return datetime.strptime(
        date,
        "%d-%m-%Y"
    ).strftime(
        "%Y-%m-%d"
    )

class CurrencyConverter:

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