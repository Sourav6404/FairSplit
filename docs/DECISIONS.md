# FairSplit Architectural & Design Decisions

This document outlines the architectural decisions and resolution strategies implemented in the FairSplit import engine.

---

## 1. Duplicate Expenses
* **Decision**: The importer automatically detects exact duplicates and marks them as `"Likely Duplicate"`.
* **Action**: 
  - Display them clearly in the import report.
  - Recommend removal of the redundant record.
  - Allow the user to manually approve the exclusion or import.
* **Rationale**: Exact duplicate entries are highly likely to be accidental double-clicks or import overlaps, but financial records should never be silently deleted without user confirmation.

---

## 2. Conflicting Expenses
* **Decision**: Detect records sharing the same date, description, and participants, but with differing amounts or payers.
* **Action**:
  - Mark the record as a `"Potential Conflict"`.
  - Display the conflicting records side-by-side in the UI.
  - Require explicit user selection before finalizing the import.
* **Rationale**: Matching descriptions and dates strongly suggest they represent the same real-world expense, but conflicting financial values mean automatic resolution is prone to error.

---

## 3. Inconsistent Member Names
* **Decision**: Normalize member names that differ only in capitalization, spacing, or trailing characters.
* **Action**:
  - Automatically trim leading/trailing whitespace and normalize string casing.
  - Log name corrections in the import report.
  - Flag ambiguous cases (e.g., `"Priya"` vs. `"Priya S"`) for user verification.
* **Rationale**: Standardizing naming prevents duplicate member profiles in the group database and ensures correct historical balance calculation.

---

## 4. Amount Stored as String
* **Decision**: Automatically extract numeric amounts from formatted strings.
* **Action**:
  - Strip formatting characters (commas, currency symbols).
  - Convert strings into standard float/decimal types.
  - Log the parsing conversion in the import report.
* **Rationale**: Core split mathematics and database stores require standardized float/decimal datatypes.

---

## 5. High Precision Amounts
* **Decision**: Standardize currency calculations to avoid floating-point inaccuracies.
* **Action**:
  - Round all monetary shares to exactly two decimal places using standard financial rounding rules (half-up).
  - Record the original and rounded values.
* **Rationale**: Storing fractional cents is incompatible with currency systems and causes rounding mismatches during settlements.

---

## 6. Missing Payer
* **Decision**: Prevent unallocated transactions while keeping the CSV import flow non-blocking.
* **Action**:
  - Import the transaction with a warning state.
  - Mark the payer as `"Unknown"`.
  - Exclude the transaction from group settlements until the user assigns a valid payer.
* **Rationale**: Settlement calculations require a valid payer to determine who is owed money; keeping the record allows the user to repair it without starting the import over.

---

## 7. Settlement Recorded as Expense
* **Decision**: Differentiate between group spending (expenses) and debt repayment (settlements).
* **Action**:
  - Detect keyword patterns (e.g., "paid back", "repaid").
  - Reclassify the record as a settlement transaction and process it separately.
* **Rationale**: Classifying repayments as expenses distorts group spending metrics and creates circular debts.

---

## 8. Missing Currency
* **Decision**: Deduce missing currencies intelligently.
* **Action**:
  - Infer the currency by matching surrounding rows in the CSV session or the group's default currency.
  - Flag the record for verification if confidence is low.
* **Rationale**: Financial integrity requires explicit currencies for accurate conversions.

---

## 9. Negative Amounts
* **Decision**: Support negative values as credit/refund adjustments.
* **Action**:
  - Classify negative values as refund transactions.
  - Deduct the amount from participant balances and adjust group totals.
* **Rationale**: Negative entries usually represent partial or full refunds, which need to reduce overall group debt rather than increase it.

---

## 10. Ambiguous Dates
* **Decision**: Detect and resolve ambiguous dates (e.g., `04-05-2026`) by checking if the chronological month sequence is out of order.
* **Action**:
  - Check if the date is a candidate for ambiguity (day <= 12, month <= 12, and day != month).
  - Analyze the chronological flow of months across neighboring records (e.g., if the sequence of months should be 3, 4, 5, but it shows up as 3, 5, 4, the record with month 5 is flagged).
  - Raise a flag on the out-of-order record and ask the user to review and confirm the format (swapping DD-MM-YYYY and MM-DD-YYYY).
* **Rationale**: If the chronological flow of months is disrupted, it strongly indicates that a date was written in an alternative format, whereas keeping the expected sequence suggests it was interpreted correctly.


---

## 11. Invalid Date Formats
* **Decision**: Convert all non-standard date formats to ISO format.
* **Action**:
  - Parse multiple common formats (e.g., `Mar-14`, `15/06/2026`) and convert them to `YYYY-MM-DD`.
* **Rationale**: Restricting database storage to standard ISO dates simplifies querying, ordering, and visualization.

---

## 12. Member Left Group
* **Decision**: Prevent charging inactive members.
* **Action**:
  - Compare expense dates against group membership periods.
  - Flag transactions billing members who had already left the group.
* **Rationale**: Ensures members are only charged for expenses incurred during their active involvement.

---

## 13. New Member Added
* **Decision**: Prevent retroactive charging of new members.
* **Action**:
  - Exclude members from expenses occurring prior to their group join date.
* **Rationale**: Charging members for historic expenses they did not participate in is financially incorrect.

---

## 14. Unknown Guest Participants
* **Decision**: Allow external participants without forcing permanent membership.
* **Action**:
  - Register external names as guest profiles.
  - Include guests in the split math.
  - Offer the user a quick option to promote guests to full members.
* **Rationale**: Expenses often involve visitors or temporary participants who should be factored into splits but not added to the permanent group roster.

---

## 15. Percentage Split Validation
* **Decision**: Enforce strict boundary checks on percentage splits.
* **Action**:
  - Validate that split percentages total exactly 100%.
  - Flag and block imports of unbalanced percentage records until resolved by the user.
* **Rationale**: Unbalanced percentages lead to missing or duplicate currency fractions.

---

## 16. Split Type Conflicts
* **Decision**: Identify mismatch anomalies between designated split type and details.
* **Action**:
  - Validate math consistency across all split modes.
  - Require manual resolution if split details contradict the split type.
* **Rationale**: Resolving split details using conflicting rules creates mathematical errors.

---

## 17. Group Deletion
* **Decision**: Provide user control to permanently delete groups.
* **Action**:
  - Implement a delete dialog confirmation on the Group Details screen.
  - On approval, cascade delete all group memberships, expenses, participants, and settlements.
* **Rationale**: Enables users to clean up their dashboard by removing completed or draft groups, maintaining clean database storage.