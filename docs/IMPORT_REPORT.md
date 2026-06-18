# Expenses Import Notes & Issues

Hey everyone, I went through the `Expenses Export.csv` file we imported today. There were 42 expenses in total, but around 12 of them have issues that we need to sort out. Some stuff was automatically fixed by the importer, but others need us to manually verify or choose what to do.

Here is the list of things I found:

### 1. Capitalization mismatch on Priya's name (Row 9)
* **Expense:** Movie night snacks (₹640)
* **What's wrong:** The payer is typed as lowercase `priya` instead of `Priya`.
* **Fix:** The importer automatically normalized it to `Priya` so it links to the right person.

### 2. Formatting issues on electricity bill (Row 7)
* **Expense:** Electricity Feb
* **What's wrong:** The amount was written as `"1,200"` in quotes with a comma, which breaks the parsing.
* **Fix:** The script cleaned it up and converted it to a clean decimal `1200.00`.

### 3. Missing currency for DMart groceries (Row 28)
* **Expense:** Groceries DMart (2105)
* **What's wrong:** Forgot to specify the currency.
* **Fix:** Since almost everything else is in INR, it was imported as `INR`. Just need to double-check this is correct.

### 4. Negative amount on parasailing (Row 26)
* **Expense:** Parasailing refund (-$30 USD)
* **What's wrong:** The amount is negative (`-30`). The importer flagged it.
* **Action needed:** We should probably convert this to a refund/credit transaction so it reduces the amount owed by the participants.

### 5. Fractional cents on cylinder refill (Row 10)
* **Expense:** Cylinder refill (₹899.995)
* **What's wrong:** The amount has three decimal places (`899.995`).
* **Fix:** Auto-rounded it to ₹900.00.

### 6. Missing payer for house cleaning supplies (Row 13)
* **Expense:** House cleaning supplies (₹780)
* **What's wrong:** The payer field is completely blank.
* **Action needed:** Need to find out who paid for this and assign them.

### 7. Repayment logged as an expense (Row 14)
* **Expense:** Rohan paid Aisha back (₹5,000)
* **What's wrong:** This is logged as an expense, but it's clearly a peer-to-peer settlement.
* **Action needed:** Let's convert this to a proper settlement so it doesn't inflate our total group spending charts.

### 8. Dev's guest friend not in the group (Row 23)
* **Expense:** Parasailing ($150 USD)
* **What's wrong:** `Dev's friend Kabir` is listed as a participant, but he isn't in our group member list.
* **Action needed:** We need to add Kabir as a guest participant or assign his share to Dev.

### 9. Incorrect percentages on pizza and brunch (Rows 15 and 32)
* **Expense:** Pizza Friday (₹1,440) / Weekend brunch (₹2,200)
* **What's wrong:** The splits (Aisha 30%, Rohan 30%, Priya 30%, Meera 20%) add up to 110% instead of 100%.
* **Action needed:** We need to adjust these so they sum up to 100% exactly.

### 10. Multi-currency booking for Goa (Rows 20 and 21)
* **Expense:** Goa villa booking ($540 USD) and Beach shack lunch ($84 USD)
* **What's wrong:** These were paid in USD instead of INR.
* **Fix:** Converted them to INR using the exchange rates from the transaction dates (about 83 INR per USD). Villa is ₹44,820 and lunch is ₹6,972.

### 11. Double logging of Thalassa dinner (Rows 24 and 25)
* **Expense:** Dinner at Thalassa (Aisha logged ₹2,400) / Thalassa dinner (Rohan logged ₹2,450)
* **What's wrong:** Looks like both Aisha and Rohan logged the same dinner, but with slightly different amounts.
* **Action needed:** We need to check the receipt and delete one of these.

### 12. Messed up date format for airport cab (Row 27)
* **Expense:** Airport cab (₹1,100)
* **What's wrong:** The date is written as `Mar-14` instead of a standard format, and since the year is missing, the script couldn't auto-parse it.
* **Action needed:** Need to manually set the correct date (probably March 14, 2026).

---

## What the balances look like after fixing these:
Once we fix the remaining issues above, the total group expenses will be ₹1,24,672.00, and the settlements should look like this:
* Rohan owes Aisha: ₹12,450.00
* Priya owes Aisha: ₹8,120.00
* Dev owes Aisha: ₹5,330.00
* Meera owes Aisha: ₹2,100.00
