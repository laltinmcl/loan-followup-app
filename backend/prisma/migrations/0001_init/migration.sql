-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'staff',
    "phone" VARCHAR(20),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" UUID NOT NULL,
    "account_no" VARCHAR(20) NOT NULL,
    "member_name" VARCHAR(200) NOT NULL,
    "member_code" VARCHAR(20),
    "loan_category" VARCHAR(50) NOT NULL,
    "loan_type_code" INTEGER,
    "disburse_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "principal_due" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "due_count" INTEGER NOT NULL DEFAULT 0,
    "interest_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "loan_limit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "outstanding_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_due" DECIMAL(15,2),
    "mobile_no" VARCHAR(100),
    "guarantor_info" TEXT,
    "loan_expiry_date" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followup_stages" (
    "id" UUID NOT NULL,
    "loan_id" UUID NOT NULL,
    "current_stage" VARCHAR(30) NOT NULL,
    "stage_entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_to" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "followup_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_history" (
    "id" UUID NOT NULL,
    "stage_id" UUID NOT NULL,
    "from_stage" VARCHAR(30),
    "to_stage" VARCHAR(30) NOT NULL,
    "transitioned_by" UUID,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_visits" (
    "id" UUID NOT NULL,
    "loan_id" UUID NOT NULL,
    "visit_date" DATE NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "location_name" VARCHAR(200),
    "photos" JSONB NOT NULL DEFAULT '[]',
    "status" VARCHAR(30) NOT NULL,
    "notes" TEXT,
    "payment_collected" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "next_followup_date" DATE,
    "synced" BOOLEAN NOT NULL DEFAULT true,
    "synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "field_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" UUID NOT NULL,
    "loan_id" UUID,
    "type" VARCHAR(30) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "due_date" DATE NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" UUID NOT NULL,
    "loan_id" UUID,
    "action" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "success_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "errors_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_by" UUID,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT,
    "type" VARCHAR(30) NOT NULL,
    "reference_type" VARCHAR(30),
    "reference_id" UUID,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "loans_account_no_key" ON "loans"("account_no");

-- CreateIndex
CREATE INDEX "loans_loan_category_idx" ON "loans"("loan_category");

-- CreateIndex
CREATE INDEX "loans_status_idx" ON "loans"("status");

-- CreateIndex
CREATE INDEX "loans_loan_expiry_date_idx" ON "loans"("loan_expiry_date");

-- CreateIndex
CREATE INDEX "loans_due_count_idx" ON "loans"("due_count");

-- CreateIndex
CREATE INDEX "loans_member_name_idx" ON "loans"("member_name");

-- CreateIndex
CREATE UNIQUE INDEX "followup_stages_loan_id_key" ON "followup_stages"("loan_id");

-- CreateIndex
CREATE INDEX "followup_stages_current_stage_idx" ON "followup_stages"("current_stage");

-- CreateIndex
CREATE INDEX "stage_history_created_at_idx" ON "stage_history"("created_at");

-- CreateIndex
CREATE INDEX "field_visits_visit_date_idx" ON "field_visits"("visit_date");

-- CreateIndex
CREATE INDEX "field_visits_status_idx" ON "field_visits"("status");

-- CreateIndex
CREATE INDEX "reminders_due_date_idx" ON "reminders"("due_date");

-- CreateIndex
CREATE INDEX "reminders_completed_idx" ON "reminders"("completed");

-- CreateIndex
CREATE INDEX "activity_log_action_idx" ON "activity_log"("action");

-- CreateIndex
CREATE INDEX "activity_log_created_at_idx" ON "activity_log"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_created_at_idx" ON "notifications"("user_id", "read", "created_at");

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followup_stages" ADD CONSTRAINT "followup_stages_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followup_stages" ADD CONSTRAINT "followup_stages_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "followup_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_history" ADD CONSTRAINT "stage_history_transitioned_by_fkey" FOREIGN KEY ("transitioned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_visits" ADD CONSTRAINT "field_visits_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_visits" ADD CONSTRAINT "field_visits_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

