# Database Schema

## Overview

PostgreSQL database with 10 core tables managed via Prisma ORM. The schema supports loan management, follow-up tracking, field visit logging, reminders, and audit trails.

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌──────────────┐
│    users    │       │      loans       │       │ field_visits │
├─────────────┤       ├──────────────────┤       ├──────────────┤
│ id          │──┐    │ id               │──┐    │ id           │
│ username    │  │    │ account_no       │  │    │ loan_id      │──┐
│ password    │  │    │ member_name      │  │    │ visit_date   │  │
│ name        │  │    │ member_code      │  │    │ latitude     │  │
│ role        │  │    │ loan_category    │  │    │ longitude    │  │
│ phone       │  │    │ loan_type_code   │  │    │ location_name│  │
│ active      │  │    │ disburse_amount  │  │    │ photos       │  │
│ created_at  │  │    │ principal_due    │  │    │ status       │  │
│ updated_at  │  │    │ due_count        │  │    │ notes        │  │
└─────────────┘  │    │ interest_total   │  │    │ payment_colld│  │
                 │    │ loan_limit       │  │    │ next_fup_date│  │
                 │    │ outstanding_amt  │  │    │ synced_at    │  │
                 │    │ total_due        │  │    │ created_at   │  │
                 │    │ mobile_no        │  │    │ updated_at   │  │
                 │    │ guarantor_info   │  │    └──────────────┘
                 │    │ loan_expiry_date │  │
                 │    │ status           │  │
                 │    │ created_by       │──┘
                 │    │ created_at       │
                 │    │ updated_at       │
                 │    └──────────────────┘
                 │
                 │    ┌──────────────────┐       ┌──────────────┐
                 │    │ followup_stages  │       │  reminders   │
                 │    ├──────────────────┤       ├──────────────┤
                 │    │ id               │       │ id           │
                 │    │ loan_id          │──┐    │ loan_id      │──┐
                 │    │ current_stage    │  │    │ type         │  │
                 │    │ stage_entered_at │  │    │ title        │  │
                 │    │ assigned_to      │──┘    │ description  │  │
                 │    │ notes            │       │ due_date     │  │
                 │    │ created_at       │       │ completed    │  │
                 │    │ updated_at       │       │ completed_at │  │
                 │    └──────────────────┘       │ created_by   │──┘
                 │                               │ created_at   │
                 │                               └──────────────┘
                 │    ┌──────────────────┐
                 │    │  stage_history   │
                 │    ├──────────────────┤
                 │    │ id               │
                 │    │ stage_id         │──┐
                 │    │ from_stage       │  │
                 │    │ to_stage         │  │
                 │    │ transitioned_by  │──┘
                 │    │ note             │
                 │    │ created_at       │
                 │    └──────────────────┘
                 │
                 │    ┌──────────────────┐       ┌──────────────────┐
                 │    │  activity_log    │       │  import_jobs     │
                 │    ├──────────────────┤       ├──────────────────┤
                 │    │ id               │       │ id               │
                 │    │ loan_id          │──┐    │ filename         │
                 │    │ action           │  │    │ status           │
                 │    │ description      │  │    │ total_rows       │
                 │    │ metadata         │  │    │ success_rows     │
                 │    │ created_by       │──┘    │ error_rows       │
                 │    │ created_at       │       │ errors_json      │
                 │    └──────────────────┘       │ created_by       │
                 │                               │ created_at       │
                 │                               │ completed_at     │
                 │                               └──────────────────┘
                 │
                 │    ┌──────────────────┐
                 │    │ notifications    │
                 │    ├──────────────────┤
                 │    │ id               │
                 │    │ user_id          │──┐
                 │    │ title            │  │
                 │    │ body             │  │
                 │    │ type             │  │
                 │    │ reference_type   │  │
                 │    │ reference_id     │  │
                 │    │ read             │  │
                 │    │ created_at       │  │
                 │    └──────────────────┘  │
                 └──────────────────────────┘
```

---

## Table Definitions

### `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default uuid_generate_v4() | Unique user ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | Login username |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash |
| name | VARCHAR(200) | NOT NULL | Display name |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'staff' | User role (single role: staff) |
| phone | VARCHAR(20) | | Contact number |
| active | BOOLEAN | DEFAULT true | Account active flag |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | DEFAULT now() | |

Indexes: `idx_users_username`

---

### `loans`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| account_no | VARCHAR(20) | UNIQUE, NOT NULL | Account number from source |
| member_name | VARCHAR(200) | NOT NULL | Borrower full name |
| member_code | VARCHAR(20) | | Internal member ID |
| loan_category | VARCHAR(50) | NOT NULL | Agriculture/Business/Collector/Deposit/Dhanjamanat/HP/Staff/RD |
| loan_type_code | INT | | Numeric code (40/41/42/43/44/45/46/51) |
| disburse_amount | DECIMAL(15,2) | DEFAULT 0 | Original loan amount |
| principal_due | DECIMAL(15,2) | DEFAULT 0 | Overdue principal amount |
| due_count | INT | DEFAULT 0 | Number of missed installments |
| interest_total | DECIMAL(15,2) | DEFAULT 0 | Accumulated overdue interest |
| loan_limit | DECIMAL(15,2) | DEFAULT 0 | Sanctioned limit |
| outstanding_amount | DECIMAL(15,2) | DEFAULT 0 | Remaining principal |
| total_due | DECIMAL(15,2) | GENERATED | principal_due + interest_total |
| mobile_no | VARCHAR(100) | | Contact numbers |
| guarantor_info | TEXT | | Guarantor names, IDs, phones |
| loan_expiry_date | DATE | | Maturity date (BS) |
| status | VARCHAR(20) | DEFAULT 'active' | active/closed/written_off/transferred |
| created_by | UUID | FK → users.id | Who imported/created this record |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | DEFAULT now() | |

Indexes:
- `idx_loans_account_no` UNIQUE
- `idx_loans_category` ON loan_category
- `idx_loans_status` ON status
- `idx_loans_expiry` ON loan_expiry_date
- `idx_loans_due_count` ON due_count
- `idx_loans_member_name` GIN (trigram) for fuzzy search
- `idx_loans_mobile` ON mobile_no

---

### `followup_stages`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| loan_id | UUID | FK → loans.id, UNIQUE | One stage record per loan |
| current_stage | VARCHAR(30) | NOT NULL | Current follow-up stage |
| stage_entered_at | TIMESTAMP | DEFAULT now() | When current stage started |
| assigned_to | UUID | FK → users.id | Officer assigned |
| notes | TEXT | | Stage notes |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | DEFAULT now() | |

Indexes: `idx_followup_loan_id` UNIQUE, `idx_followup_stage`

---

### `stage_history`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| stage_id | UUID | FK → followup_stages.id | |
| from_stage | VARCHAR(30) | | Previous stage |
| to_stage | VARCHAR(30) | NOT NULL | New stage |
| transitioned_by | UUID | FK → users.id | Who made the change |
| note | TEXT | | Reason/note for transition |
| created_at | TIMESTAMP | DEFAULT now() | |

Indexes: `idx_stage_history_stage_id`, `idx_stage_history_created`

---

### `field_visits`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| loan_id | UUID | FK → loans.id, NOT NULL | |
| visit_date | DATE | NOT NULL | Date of visit |
| latitude | DECIMAL(10,7) | | GPS latitude |
| longitude | DECIMAL(10,7) | | GPS longitude |
| location_name | VARCHAR(200) | | Reverse-geocoded address |
| photos | JSONB | DEFAULT '[]' | Array of photo URLs + timestamps |
| status | VARCHAR(30) | NOT NULL | visited/not_found/promise_to_pay/refused/part_paid/collected |
| notes | TEXT | | Officer visit notes |
| payment_collected | DECIMAL(15,2) | DEFAULT 0 | Amount collected |
| next_followup_date | DATE | | Recommended next action date |
| synced | BOOLEAN | DEFAULT true | Offline sync flag |
| synced_at | TIMESTAMP | | Last sync timestamp |
| created_by | UUID | FK → users.id | |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | DEFAULT now() | |

Indexes:
- `idx_visits_loan_id`
- `idx_visits_date` ON visit_date
- `idx_visits_status`
- `idx_visits_created_by`

---

### `reminders`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| loan_id | UUID | FK → loans.id | |
| type | VARCHAR(30) | NOT NULL | followup/field_visit/promise_to_pay/escalation/expiry/custom |
| title | VARCHAR(200) | NOT NULL | Short description |
| description | TEXT | | Detailed description |
| due_date | DATE | NOT NULL | When reminder fires |
| completed | BOOLEAN | DEFAULT false | |
| completed_at | TIMESTAMP | | |
| created_by | UUID | FK → users.id | |
| created_at | TIMESTAMP | DEFAULT now() | |

Indexes:
- `idx_reminders_due` ON due_date WHERE NOT completed
- `idx_reminders_loan_id`

---

### `activity_log`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| loan_id | UUID | FK → loans.id | |
| action | VARCHAR(50) | NOT NULL | stage_change/visit_logged/reminder_created/payment_collected/imported/note_added |
| description | TEXT | | Human-readable description |
| metadata | JSONB | DEFAULT '{}' | Extra data (amounts, stage names, etc.) |
| created_by | UUID | FK → users.id | |
| created_at | TIMESTAMP | DEFAULT now() | |

Indexes:
- `idx_activity_loan_id`
- `idx_activity_created_at` ON created_at
- `idx_activity_action`

---

### `import_jobs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| filename | VARCHAR(255) | NOT NULL | Original filename |
| file_path | VARCHAR(500) | | Stored file location |
| status | VARCHAR(20) | DEFAULT 'pending' | pending/processing/completed/failed |
| total_rows | INT | DEFAULT 0 | |
| success_rows | INT | DEFAULT 0 | |
| error_rows | INT | DEFAULT 0 | |
| errors_json | JSONB | | Array of row-level errors |
| created_by | UUID | FK → users.id | |
| created_at | TIMESTAMP | DEFAULT now() | |
| completed_at | TIMESTAMP | | |

---

### `notifications`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, NOT NULL | |
| title | VARCHAR(200) | NOT NULL | |
| body | TEXT | | |
| type | VARCHAR(30) | NOT NULL | reminder/stage_change/visit_due/sync_complete |
| reference_type | VARCHAR(30) | | Entity type (loan/visit/reminder) |
| reference_id | UUID | | Entity ID |
| read | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMP | DEFAULT now() | |

Indexes:
- `idx_notifications_user` ON user_id, read, created_at DESC

---

## Prisma Schema Example

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid()) @db.Uuid
  username      String   @unique @db.VarChar(50)
  passwordHash  String   @map("password_hash") @db.VarChar(255)
  name          String   @db.VarChar(200)
  role          String   @default("staff") @db.VarChar(20)
  phone         String?  @db.VarChar(20)
  active        Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  loans          Loan[]
  followupAssign FollowupStage[]
  visits         FieldVisit[]
  reminders      Reminder[]
  activityLogs   ActivityLog[]
  importJobs     ImportJob[]
  notifications  Notification[]

  @@map("users")
}

// ... (full schema in prisma/schema.prisma)
```

---

## Migration Strategy

- All schema changes via Prisma migrations (`prisma migrate dev`)
- Each migration is a single file with up/down capability
- Seed script for demo data
- No raw SQL migrations (Prisma-managed only)
- Backup strategy: Daily pg_dump to cloud storage
