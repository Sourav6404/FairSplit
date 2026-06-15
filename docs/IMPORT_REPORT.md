# FairSplit Import Report

## Import Session Summary

File Imported:
Expenses Export.csv

Import Date:
15 June 2026

Total Records Processed:
XX

Successfully Imported:
XX

Records Requiring Review:
XX

Total Anomalies Detected:
XX

---

## Anomaly Report

### 1. Missing Payer

Record ID:
12

Issue:
Payer field is empty.

Action Taken:
Record flagged for manual review.
Expense not imported until corrected.

Status:
Pending User Resolution

---

### 2. Missing Currency

Record ID:
18

Issue:
Currency field is missing.

Action Taken:
Default currency (INR) assigned.

Status:
Auto Resolved

---

### 3. Negative Amount

Record ID:
25

Issue:
Expense amount is negative.

Action Taken:
Record rejected.

Status:
Rejected

---

### 4. Invalid Date Format

Record ID:
31

Issue:
Date format does not match DD-MM-YYYY.

Action Taken:
Record flagged for review.

Status:
Pending User Resolution

---

### 5. Split Type Conflict

Record ID:
40

Issue:
Split type and participant allocation mismatch.

Action Taken:
Expense flagged for review.

Status:
Pending User Resolution

---

### 6. Invalid Percentage Split

Record ID:
52

Issue:
Percentage allocation does not total 100%.

Action Taken:
Record rejected.

Status:
Rejected

---

### 7. Unknown Guest

Record ID:
67

Issue:
Participant not found in group.

Action Taken:
Expense flagged for review.

Status:
Pending User Resolution

---

### 8. Duplicate Expense

Record ID:
71

Issue:
Potential duplicate expense detected.

Action Taken:
Duplicate marked and excluded.

Status:
Resolved

---

## Settlement Summary

Total Settlements Generated:
XX

Example:

Rahul → Amit : ₹500

Neha → Rahul : ₹300

---

## Final Import Result

Imported Successfully:
XX Records

Rejected:
XX Records

Manual Review Required:
XX Records

Import Status:
Completed with warnings
