export const LOAN_CATEGORIES = [
  { code: 40, name: 'Agriculture Loan (40)', short: 'Agriculture' },
  { code: 42, name: 'Collector Loan (42)', short: 'Collector' },
  { code: 43, name: 'Deposit Loan (43)', short: 'Deposit' },
  { code: 44, name: 'Dhanjamanat Loan (44)', short: 'Dhanjamanat' },
  { code: 45, name: 'Hire Purchase Loan (45)', short: 'Hire Purchase' },
  { code: 51, name: 'Recurring Deposit Loan (51)', short: 'RD' },
  { code: 52, name: 'Secured Loan (Saving) (52)', short: 'Secured' },
  { code: 61, name: 'General Loan (61)', short: 'General' },
] as const;

export const FOLLOWUP_STAGES = [
  'import',
  'soft_call',
  'notice',
  'field_visit',
  'promise_paid',
  'escalate',
  'legal',
  'manager_review',
  'written_off',
  'resolved',
] as const;

export type FollowupStage = (typeof FOLLOWUP_STAGES)[number];
export type LoanCategory = (typeof LOAN_CATEGORIES)[number]['name'];

export const STAGE_LABELS: Record<FollowupStage, string> = {
  import: 'Import',
  soft_call: 'Soft Call',
  notice: 'Notice',
  field_visit: 'Field Visit',
  promise_paid: 'Promise/Paid',
  escalate: 'Escalate',
  legal: 'Legal',
  manager_review: 'Manager Review',
  written_off: 'Written Off',
  resolved: 'Resolved',
};

export const STAGE_TRANSITIONS: Record<FollowupStage, readonly FollowupStage[]> = {
  import: ['soft_call', 'notice'],
  soft_call: ['field_visit', 'promise_paid', 'escalate'],
  notice: ['field_visit', 'promise_paid', 'legal'],
  field_visit: ['promise_paid', 'escalate', 'resolved'],
  promise_paid: ['field_visit', 'resolved', 'soft_call'],
  escalate: ['field_visit', 'legal', 'manager_review'],
  legal: ['escalate', 'written_off', 'resolved'],
  manager_review: ['escalate', 'field_visit', 'resolved'],
  written_off: ['resolved'],
  resolved: [],
};

export const VISIT_STATUSES = ['scheduled', 'completed', 'no-contact', 'refused', 'promise'] as const;

export const REMINDER_TYPES = ['stage_change', 'overdue', 'manual', 'visit_followup'] as const;

export const LOAN_STATUSES = ['active', 'closed', 'written_off'] as const;

export const IMPORT_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
