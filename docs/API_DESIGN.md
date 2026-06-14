# FairSplit API Design
## API Overview
Base URL
```text
/api/v1/
```
Authentication
```text
JWT Authentication
Authorization: Bearer <token>
```
---
# Authentication APIs
## Register User
POST
```text
/api/v1/auth/register/
```
Request
```json
{
  "full_name": "Sourav Kuriakose",
  "email": "user@example.com",
  "mobile_number": "9876543210",
  "password": "password123"
}
```
Response
```json
{
  "user_id": "uuid",
  "message": "Registration successful"
}
```
---
## Login
POST
```text
/api/v1/auth/login/
```
Request
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
Response
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "user": {}
}
```
---
# Group APIs
## Create Group
POST
```text
/api/v1/groups/
```
Request
```json
{
  "name": "Goa Trip",
  "description": "Vacation Expenses",
  "default_currency": "INR"
}
```
---
## Get All Groups
GET
```text
/api/v1/groups/
```
---
## Get Single Group
GET
```text
/api/v1/groups/{group_id}/
```
---
## Update Group
PUT
```text
/api/v1/groups/{group_id}/
```
---
## Delete Group
DELETE
```text
/api/v1/groups/{group_id}/
```
---
# Member APIs
## Add Member
POST
```text
/api/v1/groups/{group_id}/members/
```
Request
```json
{
  "name": "Rohan",
  "email": "rohan@example.com"
}
```
---
## Get Members
GET
```text
/api/v1/groups/{group_id}/members/
```
---
## Remove Member
DELETE
```text
/api/v1/groups/{group_id}/members/{member_id}/
```
---
# Expense APIs
## Create Expense
POST
```text
/api/v1/groups/{group_id}/expenses/
```
Request
```json
{
  "description": "Dinner",
  "amount": 1200,
  "currency": "INR",
  "paid_by": "member_uuid",
  "participants": [
    "member1",
    "member2"
  ]
}
```
---
## Get Expenses
GET
```text
/api/v1/groups/{group_id}/expenses/
```
---
## Get Expense
GET
```text
/api/v1/groups/{group_id}/expenses/{expense_id}/
```
---
## Update Expense
PUT
```text
/api/v1/groups/{group_id}/expenses/{expense_id}/
```
---
## Delete Expense
DELETE
```text
/api/v1/groups/{group_id}/expenses/{expense_id}/
```
---
# Settlement APIs
## Generate Settlements
GET
```text
/api/v1/groups/{group_id}/settlements/generate/
```
Response
```json
{
  "settlements": [
    {
      "payer": "Rohan",
      "receiver": "Priya",
      "amount": 500
    }
  ]
}
```
---
## Create Settlement
POST
```text
/api/v1/groups/{group_id}/settlements/
```
---
## Get Settlements
GET
```text
/api/v1/groups/{group_id}/settlements/
```
---
# Balance APIs
## Get Group Balance
GET
```text
/api/v1/groups/{group_id}/balances/
```
Response
```json
{
  "members": [
    {
      "name": "Priya",
      "gets_back": 1500
    },
    {
      "name": "Rohan",
      "owes": 1500
    }
  ]
}
```
---
# CSV Import APIs
## Upload CSV
POST
```text
/api/v1/groups/{group_id}/imports/
```
Form Data
```text
file: expenses.csv
```
Response
```json
{
  "import_job_id": "uuid",
  "status": "processing"
}
```
---
## Get Import Report
GET
```text
/api/v1/imports/{import_job_id}/report/
```
Response
```json
{
  "summary": {},
  "severity_breakdown": {},
  "anomaly_breakdown": {},
  "anomalies": []
}
```
---
## Resolve Anomaly
POST
```text
/api/v1/imports/{import_job_id}/resolve/
```
Request
```json
{
  "anomaly_id": "ANOMALY_MISSING_PAYER",
  "selected_option": "Mark As Unknown"
}
```
---
## Finalize Import
POST
```text
/api/v1/imports/{import_job_id}/finalize/
```
Response
```json
{
  "message": "Expenses imported successfully"
}
```
---
# Report APIs
## Expense Report
GET
```text
/api/v1/groups/{group_id}/reports/expenses/
```
---
## Settlement Report
GET
```text
/api/v1/groups/{group_id}/reports/settlements/
```
---
## CSV Analysis Report
GET
```text
/api/v1/imports/{import_job_id}/analysis/
```
---
# Future AI APIs
## AI Expense Insights
GET
```text
/api/v1/groups/{group_id}/ai/insights/
```
---
## AI Spending Predictions
GET
```text
/api/v1/groups/{group_id}/ai/predictions/
```
---
# API Development Order
Phase 1
* Auth APIs
* Group APIs
* Member APIs
Phase 2
* Expense APIs
* Balance APIs
* Settlement APIs
Phase 3
* CSV Import APIs
* Report APIs
Phase 4
* AI APIs