# API Reference

## Overview

RESTful API with WebSocket support for real-time updates. Base URL: `/api/v1`

## Authentication

All endpoints except login require a JWT in the Authorization header.

```
Authorization: Bearer <token>
```

### POST /api/v1/auth/login

Authenticate and receive a JWT token.

**Request:**
```json
{
  "username": "staff01",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "username": "staff01",
    "name": "Field Officer",
    "role": "staff"
  }
}
```

---

## Loans

### GET /api/v1/loans

List loans with filtering, pagination, and sorting.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page number (default: 1) |
| limit | int | Items per page (default: 20, max: 100) |
| category | string | Filter by loan category |
| status | string | Filter by status (active/closed/written_off) |
| stage | string | Filter by current follow-up stage |
| due_count_min | int | Minimum due count |
| due_count_max | int | Maximum due count |
| search | string | Search by name, account_no, or mobile |
| expiry_from | date | Loan expiry start range |
| expiry_to | date | Loan expiry end range |
| sort_by | string | Field to sort by |
| sort_order | string | asc or desc |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "accountNo": "00142000231",
      "memberName": "Binod Pariyar",
      "memberCode": "001000047",
      "loanCategory": "Collector Loan (42)",
      "disburseAmount": 700000.00,
      "principalDue": 25000.00,
      "dueCount": 1,
      "interestTotal": 14978.16,
      "outstandingAmount": 700000.00,
      "totalDue": 39978.16,
      "status": "active",
      "loanExpiryDate": "2089-12-15",
      "mobileNo": "9857070161",
      "currentStage": "Follow-up 1",
      "lastActivity": "2026-06-10T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 461,
    "totalPages": 24
  }
}
```

### GET /api/v1/loans/:id

Get single loan with full details.

**Response:** Includes all loan fields, current stage, stage history, recent visits, upcoming reminders, and activity log.

### PUT /api/v1/loans/:id

Update loan details.

**Request:** Partial loan fields.

### DELETE /api/v1/loans/:id

Soft-delete a loan (sets status to 'deleted').

---

## Follow-up Stages

### GET /api/v1/stages

Get all current stage assignments with counts.

**Response:**
```json
{
  "stages": [
    {
      "stage": "Newly Added",
      "count": 45,
      "totalDue": 1250000.00
    },
    {
      "stage": "Follow-up 1",
      "count": 120,
      "totalDue": 3400000.00
    }
  ],
  "totals": {
    "totalLoans": 461,
    "totalDue": 23456789.00
  }
}
```

### PUT /api/v1/stages/:loanId

Transition a loan to a new stage.

**Request:**
```json
{
  "toStage": "Field Visit Scheduled",
  "note": "Multiple calls unanswered. Visit scheduled."
}
```

**Response:** Updated stage record with new history entry.

**Auto-actions on transition:**
| New Stage | Auto-action |
|-----------|-------------|
| Follow-up 1 | Create reminder due in 7 days |
| Field Visit Scheduled | Create reminder on scheduled date |
| Promise to Pay | Create reminder on promised date |
| Escalated | Create reminder for manager review in 3 days |
| Resolved | Mark all pending reminders as completed |

### GET /api/v1/stages/history/:loanId

Get full stage transition history for a loan.

---

## Field Visits

### POST /api/v1/visits

Log a field visit (supports offline sync).

**Request:**
```json
{
  "loanId": "uuid",
  "visitDate": "2026-06-10",
  "latitude": 27.7172,
  "longitude": 85.3240,
  "locationName": "Kathmandu-15, Bagmati",
  "photos": ["url1", "url2"],
  "status": "promise_to_pay",
  "notes": "Borrower promised to pay by next week",
  "paymentCollected": 5000.00,
  "nextFollowupDate": "2026-06-17"
}
```

**Response:** Created visit record.

### GET /api/v1/visits/:loanId

Get all visits for a loan.

### PUT /api/v1/visits/:id

Update a visit record.

### POST /api/v1/visits/sync

Bulk sync offline visit records (used by PWA when coming online).

**Request:**
```json
{
  "visits": [
    {
      "localId": "temp-uuid",
      "loanId": "uuid",
      "visitDate": "2026-06-10",
      "latitude": 27.7172,
      "longitude": 85.3240,
      "photos": ["base64..."],
      "status": "visited",
      "notes": "..."
    }
  ]
}
```

**Response:**
```json
{
  "synced": 5,
  "failed": 0,
  "results": [
    { "localId": "temp-uuid", "serverId": "uuid", "status": "created" }
  ]
}
```

---

## Reminders

### GET /api/v1/reminders

List reminders with filtering.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| completed | boolean | Filter by completion status |
| type | string | Filter by reminder type |
| due_from | date | Due date range start |
| due_to | date | Due date range end |
| overdue | boolean | Show only overdue (due_date < today) |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "loanId": "uuid",
      "loanAccount": "00142000231",
      "memberName": "Binod Pariyar",
      "type": "followup",
      "title": "Follow-up call due",
      "dueDate": "2026-06-17",
      "completed": false
    }
  ],
  "summary": {
    "overdue": 12,
    "today": 8,
    "upcoming": 45
  }
}
```

### POST /api/v1/reminders

Create a manual reminder.

**Request:**
```json
{
  "loanId": "uuid",
  "type": "custom",
  "title": "Call borrower about pending payment",
  "description": "Borrower said they would pay after harvesting",
  "dueDate": "2026-07-01"
}
```

### PUT /api/v1/reminders/:id/complete

Mark a reminder as completed.

---

## Dashboard / Reports

### GET /api/v1/dashboard/summary

Portfolio summary statistics.

**Response:**
```json
{
  "totalLoans": 461,
  "activeLoans": 420,
  "totalDisbursed": 137000000.00,
  "totalOutstanding": 85000000.00,
  "totalDue": 15600000.00,
  "totalInterestDue": 5200000.00,
  "averageDueCount": 2.3,
  "recoveryRate": 62.5,
  "categoryBreakdown": [
    { "category": "Agriculture", "count": 2, "totalDue": 50000 },
    { "category": "Business", "count": 22, "totalDue": 2400000 }
  ],
  "stageBreakdown": [
    { "stage": "Newly Added", "count": 45 },
    { "stage": "Follow-up 1", "count": 120 }
  ],
  "dueCountBuckets": [
    { "bucket": "0", "count": 100 },
    { "bucket": "1-3", "count": 200 },
    { "bucket": "4-6", "count": 120 },
    { "bucket": "6+", "count": 41 }
  ]
}
```

### GET /api/v1/dashboard/aging

Aging report (due count buckets).

### GET /api/v1/reports/collection

Collection report for a date range.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| from | date | Start date |
| to | date | End date |
| group_by | string | day/week/month |

### GET /api/v1/reports/export

Export data as CSV or PDF.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| type | string | csv or pdf |
| report | string | loans/aging/collection/stages |

---

## Import

### POST /api/v1/import/upload

Upload Excel/CSV file for import.

**Request:** multipart/form-data with file field.

**Response:**
```json
{
  "jobId": "uuid",
  "filename": "all_loan_001.xlsx",
  "totalRows": 461,
  "status": "pending"
}
```

### GET /api/v1/import/status/:jobId

Check import job status.

### GET /api/v1/import/preview

Preview parsed data from uploaded file before committing.

---

## Activity Log

### GET /api/v1/activity

Recent activity across the system.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| limit | int | Items (default: 50) |
| loan_id | uuid | Filter by loan |
| action | string | Filter by action type |

---

## WebSocket Events

Connect to `ws://<host>/ws?token=<jwt>`

**Server → Client Events:**

| Event | Payload | Description |
|-------|---------|-------------|
| `reminder:overdue` | `{ reminder }` | A reminder just became overdue |
| `stage:changed` | `{ loanId, from, to }` | Loan stage was changed |
| `visit:synced` | `{ visit }` | Offline visit synced to server |
| `notify` | `{ notification }` | General notification |

---

## Error Responses

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "disburseAmount", "message": "Must be a positive number" }
    ]
  }
}
```

| HTTP Code | Meaning |
|-----------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |
