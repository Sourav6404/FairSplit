# FairSplit Anomaly Detection Scope

This document defines the scope of anomalies handled by the FairSplit CSV importer and core engine.

---

## 1. Duplicate Expense
- **Example**: Duplicate entries for `Dinner at Marina Bites` on the same date with the same amount, payer, and participants.
- **Problem**: Accidental double-reporting of the same transaction.
- **Solution**: Flag the second transaction as a "Likely Duplicate", request user review, and cross-check attributes (date, payer, amount, description, participants).

---

## 2. Inconsistent Member Names
- **Example**: `Priya`, `priya`, and `Priya S` representing the same person.
- **Problem**: Redundant group members created due to capitalization or formatting variations.
- **Solution**: Auto-normalize names by trimming whitespace and standardizing casing. Flag ambiguous naming variations for manual verification.

---

## 3. Amount Stored as String
- **Example**: Amount listed as `"₹1,200"` or `"1,200.00"`.
- **Problem**: Non-numeric formatting preventing financial arithmetic.
- **Solution**: Parse strings, remove currency symbols and comma separators, and convert to standard decimal values.

---

## 4. High Precision Amounts
- **Example**: Expense amount listed as `₹899.995`.
- **Problem**: Fractional cents that cannot be represented in actual transactions.
- **Solution**: Round values to two decimal places using standard financial rounding rules.

---

## 5. Missing Payer
- **Example**: Paid-by field left empty for `House cleaning supplies`.
- **Problem**: Impossible to attribute debt or credit without a payer.
- **Solution**: Flag the record, assign a temporary "Unknown" status, and require user allocation or transaction removal before finalizing.

---

## 6. Settlement Recorded as Expense
- **Example**: Description reads `Rohan paid Aisha back`.
- **Problem**: Repayment logged as a group expense, leading to distorted group spending metrics.
- **Solution**: Identify key phrases (e.g., "paid back", "settled") and offer to convert the transaction into a settlement instead of an expense.

---

## 7. Missing Currency
- **Example**: Record does not specify the currency.
- **Problem**: Ambiguous amount valuation in multi-currency groups.
- **Solution**: Infer currency based on surrounding records or default group currency, then flag for user confirmation.

---

## 8. Negative Amount
- **Example**: Parasailing refund logged as `-500`.
- **Problem**: Negative expense values can disrupt accounting logic.
- **Solution**: Classify the record as a refund or credit transaction, adjust group balances, and log the resolution.

---

## 9. Ambiguous Date
- **Example**: An invoice date is written as `04-05-2026`. Without context, it is impossible to know whether the group spent money on April 5th or May 4th.
- **Problem**: Ambiguity between April 5th and May 4th.
- **Solution**: Flagged as an anomaly only if the date is a candidate for ambiguity (day <= 12, month <= 12, and day != month) AND the month chronological sequence flow is out of order relative to neighboring records. The user can select the correct interpretation (swapping DD-MM-YYYY / MM-DD-YYYY) to resolve the anomaly.

---

## 10. Invalid Date Format
- **Example**: Date listed as `Mar-14` or `15/06/26`.
- **Problem**: Non-ISO date formats causing database insertion errors.
- **Solution**: Normalize date formats dynamically to the standard `DD-MM-YYYY` representation.

---

## 11. Member Left Group
- **Example**: Aisha leaves the group, but an expense occurring after her departure includes her.
- **Problem**: Inactive members being billed for new group expenses.
- **Solution**: Validate transaction dates against member active periods and flag violations for manual review.

---

## 12. New Member Added
- **Example**: Sam joins the group mid-trip but is included in early expenses.
- **Problem**: Members charged for expenses incurred before they joined the group.
- **Solution**: Validate expense dates against member join dates and exclude members from prior expenses.

---

## 13. Unknown Guest Participants
- **Example**: Guest `Dev's friend Kabir` added to an expense.
- **Problem**: Transaction references someone who is not a registered member of the group.
- **Solution**: Support temporary guest participant records that calculate splits correctly, and allow converting guests to permanent members later.

---

## 14. Percentage Split Validation
- **Example**: Splits designated as `40%`, `30%`, and `40%` for three participants.
- **Problem**: Split percentages do not sum to 100%, causing unbalanced splits.
- **Solution**: Perform pre-import validation and reject or flag records with invalid split totals,user can input the split ratio.

---

## 15. Inconsistent Split Type
- **Example**: Expense split declared as "equal" but individual custom shares are populated.
- **Problem**: Contradictory split specifications.
- **Solution**: Check that split details align with the declared method (equal, share, percentage) and flag mismatches.

---

## 16. Conflicting Duplicate Expense
- **Example**: Two records share the same description, date, and participants, but have different payers or amounts.
- **Problem**: High probability of conflicting data entries representing the same expense.
- **Solution**: Display records side-by-side and require user intervention to select the correct record.

---

## 17. Zero Amount Expense
- **Example**: Expense amount is zero.
- **Problem**: The transaction does not affect balances and may represent placeholder data.
- **Solution**: Flag the zero-amount record for review and allow the user to approve or delete it.

---

## 18. Split Method Errors
- **Example**: Split details list individual shares that do not match the split type calculation.
- **Problem**: Internal math discrepancy in split distribution.
- **Solution**: Require user review and prevent automatic adjustments that could lead to financial errors.

---

## 19. Split Amount Mismatch
- **Example**: The sum of participant shares does not equal the total expense amount.
- **Problem**: Unbalanced transaction total.
- **Solution**: Run validation on import, flag discrepancies, and require user resolution to balance the split details.

---

## 20. Group Management (Deletion)
- **Example**: After a weekend trip ends and everyone has settled their debts, the coordinator wants to delete the "Goa Villa Group" to clean up their active list.
- **Problem**: Stale or completed groups cluttering the user interface and database.
- **Solution**: Provide a secure delete option on the group details screen. When approved, it cascade deletes all member records, expense logs, split items, and settlements permanently from the database.
