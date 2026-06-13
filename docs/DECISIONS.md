1) Duplicate
    Decision:-the importer automatically detects exact duplicates and marks them as"Likely Duplicate"
    Action :-*show them in the import report.
             *Recommend removal.
             *Allow the user to approve the removal
    Reason:-Exact duplicates are highly likely to be accidental but financial records should not be silently deleted.

2) Conflicting Expense
    Decision:-The importer detects records that have the same data and description and participants but diffrent amount,payers.
    Action :-*Mark the record as Potential Conflict.
             *Display the conflicting records side-by-side in the import report.
             *Require user review before import is finalized.
             *Do not merge,modify,or delete either record automatically.
    Reason :- Matching descriptions and dates suggest the records may refer to the same expense, but conflicting financial details make automatic correction unreliable. User review is required to preserve data accuracy.

3) Inconsistent Member names
    Decision:-The importer identifies names that differ only in capitalization, spacing, or formatting.
    Action:-*Normalize names by trimming spaces and converting to a standard format.
            *Log all name transformations in the import report.
            *Flag ambiguous cases (e.g., "Priya" vs "Priya S") for review.
    Reason:-Consistent naming improves data quality and prevents duplicate member records.

4) Amount Stored as String
    Decision:-The importer detects amounts stored as formatted strings.
    Action :-*Remove formatting characters such as commas and currency symbols.
             *Convert values into numeric format.
             *Log conversions in the import report.
    Reason:-Financial calculations require standardized numeric values.

5) High Precision Amounts
    Decision:-The importer detects monetary values with more than two decimal places.
    Action :-*Round to two decimal places using standard financial rounding rules.
             *Record the original and adjusted values in the import report.
    Reason:-Currency values should be stored using standard monetary precision.

6) Missing Payer
    Decision:-The importer detects expenses where the payer is not specified.
    Action:-*Import the record with a warning.
            *Mark the payer as Unknown.
            *Allow the user to assign a payer later or remove the transaction.
            *Exclude the expense from settlement calculations until resolved.
    Reason:-Incorrect payer information can result in inaccurate balances.

7) Settlement Recorded as Expense
    Decision:-The importer detects transactions that appear to be repayments rather than expenses.
    Action :-*Classify the record as a settlement transaction.
             *Store it separately from expenses.
             *Log the conversion in the import report.
    Reason:-Settlements affect balances but are not expenses.

8) Missing Currency
    Decision:-The importer detects records with missing currency information.
    Action:-*Attempt to infer the currency from surrounding records.
            *Display the inferred currency to the user for confirmation.
            *Flag the record if confidence is low.
            *Record assumptions in the import report.
    Reason:-Currency is required for accurate financial calculations.

9) Negative Amounts
    Decision:-The importer detects expenses with negative values.
    Action:-*Treat clearly identified refunds as refund transactions.
            *Adjust balances accordingly.
            *Flag ambiguous cases for review.
    Reason:-Negative values may represent refunds rather than spending.

10) Ambiguous Dates
     Decision:-The importer detects dates that can be interpreted in multiple formats.
     Action:-*Attempt format inference using surrounding records.
             *Flag uncertain cases for user review.
             *Record the selected interpretation in the import report.
    Reason:-Incorrect dates can affect balance calculations and membership validation.

11) Invalid Date Formats
     Decision:-The importer detects dates that do not match the standard format.
     Action:-*Convert supported formats into the application's standard date format.
             *Record all conversions in the import report.
     Reason:-Consistent date formatting simplifies processing and reporting.

12) Member Left Group
     Decision:-The importer validates expenses against member join and leave dates.
     Action:-*Compare expense dates with member join and leave dates.
             *Flag expenses that include inactive members.
             *Require user review before final import.
     Reason:-Members should only participate in expenses during their active membership period.

13) New Member Added
     Decision:- The importer tracks membership changes over time.
     Action:-*Store join dates for new members.
             *Exclude members from expenses occurring before they joined.
     Reason:-Balances should reflect actual participation history.

14) Unknown Guest Participants
     Decision:-The importer detects participants who are not registered group members.
     Action:-*Create a temporary guest participant record.
             *Include guests in expense calculations.
             *Mark guests separately from permanent members.
             *Record guest participation in the import report.
             *Allow the user to convert a guest into a permanent member later if needed.
     Reason:-Group expenses may legitimately include non-members, such as friends, visitors, or temporary participants, who should still be included in expense calculations.

15) Percentage Split Validation
     Decision:-The importer validates percentage-based expense splits.
     Action:-*Verify that percentages total 100%.
             *Flag invalid records.
             *Allow the user to correct percentage values before import.
             *Prevent automatic import of incorrect splits.
     Reason:-Incorrect percentages produce inaccurate balances.

16) Split Type Conflict
     Decision:-The importer detects conflicts between split_type and split_details.
     Action:-*Validate split calculations.
             *Flag inconsistencies.
             *Require user review before processing.
     Reason:-Conflicting split information can result in incorrect debt calculations.