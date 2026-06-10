# Follow-up Stages Workflow

## Overview

The follow-up workflow is a **finite state machine** that governs how loans progress through the collection process. Each stage has defined entry/exit conditions, auto-reminder triggers, and transition rules.

---

## Stage Definitions

```
STAGE_TYPES = [
  {
    id: 'newly_added',
    label: 'Newly Added',
    description: 'Loan was just imported into the system',
    color: '#6366f1',       // Indigo
    order: 0,
    autoScheduleDays: 1,     // Auto-schedule Follow-up 1 after 1 day
    isTerminal: false,
    isActive: true
  },
  {
    id: 'follow_up_1',
    label: 'Follow-up 1 (Soft Call)',
    description: 'First polite reminder — call the borrower',
    color: '#3b82f6',       // Blue
    order: 1,
    autoScheduleDays: 7,     // Escalate to F/U 2 if no response in 7 days
    isTerminal: false,
    isActive: true
  },
  {
    id: 'follow_up_2',
    label: 'Follow-up 2 (Reminder)',
    description: 'Second follow-up — stronger reminder',
    color: '#f59e0b',       // Amber
    order: 2,
    autoScheduleDays: 14,    // Escalate to F/U 3 if no response in 14 days
    isTerminal: false,
    isActive: true
  },
  {
    id: 'follow_up_3',
    label: 'Follow-up 3 (Final Notice)',
    description: 'Final notice before field visit',
    color: '#f97316',       // Orange
    order: 3,
    autoScheduleDays: 7,     // Schedule field visit if no response
    isTerminal: false,
    isActive: true
  },
  {
    id: 'field_visit_scheduled',
    label: 'Field Visit Scheduled',
    description: 'Field visit has been scheduled',
    color: '#8b5cf6',       // Purple
    order: 4,
    autoScheduleDays: null,  // Manual trigger (visit date specified)
    isTerminal: false,
    isActive: true
  },
  {
    id: 'field_visit_completed',
    label: 'Field Visit Completed',
    description: 'Field visit has been conducted and logged',
    color: '#06b6d4',       // Cyan
    order: 5,
    autoScheduleDays: null,
    isTerminal: false,
    isActive: true
  },
  {
    id: 'promise_to_pay',
    label: 'Promise to Pay',
    description: 'Borrower has committed to a payment date',
    color: '#10b981',       // Emerald
    order: 6,
    autoScheduleDays: null,  // Follow-up on promised date
    isTerminal: false,
    isActive: true
  },
  {
    id: 'escalated',
    label: 'Escalated',
    description: 'Case escalated to management',
    color: '#ef4444',       // Red
    order: 7,
    autoScheduleDays: 3,     // Review in 3 days
    isTerminal: false,
    isActive: true
  },
  {
    id: 'legal_notice',
    label: 'Legal Notice',
    description: 'Legal proceedings initiated',
    color: '#dc2626',       // Dark Red
    order: 8,
    autoScheduleDays: 30,    // Follow up on legal progress
    isTerminal: false,
    isActive: true
  },
  {
    id: 'resolved',
    label: 'Resolved (Paid)',
    description: 'Payment received, loan resolved',
    color: '#22c55e',       // Green
    order: 9,
    autoScheduleDays: null,
    isTerminal: true,
    isActive: true
  },
  {
    id: 'written_off',
    label: 'Written Off',
    description: 'Loan deemed uncollectible',
    color: '#6b7280',       // Gray
    order: 10,
    autoScheduleDays: null,
    isTerminal: true,
    isActive: false
  }
]
```

---

## Transition Rules

### Allowed Transitions

```
newly_added
  → follow_up_1 (auto, after 1 day)

follow_up_1
  → follow_up_2        (auto, after 7 days no response)
  → field_visit_scheduled (manual, if direct visit needed)
  → resolved            (manual, if paid)

follow_up_2
  → follow_up_3        (auto, after 14 days no response)
  → field_visit_scheduled (manual)
  → resolved            (manual)

follow_up_3
  → field_visit_scheduled (auto, after 7 days)
  → escalated           (manual)
  → resolved            (manual)

field_visit_scheduled
  → field_visit_completed (auto, when visit logged)
  → follow_up_1         (manual, reschedule)

field_visit_completed
  → promise_to_pay      (auto, if promise made)
  → resolved            (auto, if payment collected)
  → escalated           (auto, if refused/not found)
  → follow_up_1         (manual, retry)

promise_to_pay
  → resolved            (auto, if payment received by promised date)
  → escalated           (auto, if promise broken)
  → follow_up_1         (manual, new promise)

escalated
  → legal_notice        (manual)
  → field_visit_scheduled (manual)
  → follow_up_1         (manual)
  → written_off         (manual)

legal_notice
  → resolved            (manual, if paid after notice)
  → written_off         (manual)
  → escalated           (manual, review)

resolved   → [terminal, no outgoing transitions]
written_off → [terminal, no outgoing transitions]
```

### Transition Validation

```typescript
function isValidTransition(from: Stage, to: Stage): boolean {
  const allowed: Record<string, string[]> = {
    newly_added:           ['follow_up_1'],
    follow_up_1:           ['follow_up_2', 'field_visit_scheduled', 'resolved'],
    follow_up_2:           ['follow_up_3', 'field_visit_scheduled', 'resolved'],
    follow_up_3:           ['field_visit_scheduled', 'escalated', 'resolved'],
    field_visit_scheduled: ['field_visit_completed', 'follow_up_1'],
    field_visit_completed: ['promise_to_pay', 'resolved', 'escalated', 'follow_up_1'],
    promise_to_pay:        ['resolved', 'escalated', 'follow_up_1'],
    escalated:             ['legal_notice', 'field_visit_scheduled', 'follow_up_1', 'written_off'],
    legal_notice:          ['resolved', 'written_off', 'escalated'],
    resolved:              [],
    written_off:           []
  };
  return allowed[from]?.includes(to) ?? false;
}
```

---

## Auto-Reminder Triggers

Each stage transition auto-generates reminders:

| Transition | Auto-Reminder Created |
|------------|----------------------|
| newly_added → follow_up_1 | "Follow-up call due for [borrower]" — due in 1 day |
| follow_up_1 → follow_up_2 | "Second follow-up needed for [borrower]" — due in 7 days |
| follow_up_2 → follow_up_3 | "Final notice to [borrower]" — due in 14 days |
| follow_up_3 → field_visit_scheduled | "Field visit to [borrower] at [address]" — due on scheduled date |
| field_visit_scheduled → field_visit_completed | "Log visit outcome for [borrower]" — due same day |
| field_visit_completed → promise_to_pay | "Promise check: [borrower] promised to pay by [date]" — due on promised date |
| promise_to_pay → escalated | "Escalation review needed for [borrower]" — due in 3 days |
| escalated → legal_notice | "Legal notice deadline approaching for [borrower]" — due in 14 days |

---

## Stage Progression UI

The current stage is displayed as a **progress bar** on the loan detail page:

```
Loan: Binod Pariyar (00142000231)
Stage: Follow-up 2

[New] → [F/U 1] → [● F/U 2] → [F/U 3] → [Visit] → [Done] → [PTP] → [Esc] → [Legal] → [✓ Resolved]
                                                                                   [✕ Written Off]
```

- **Completed stages**: Green checkmark
- **Current stage**: Blue circle (pulsing animation)
- **Available next stages**: Faded with dotted border (clickable)
- **Unavailable stages**: Grayed out

---

## Bulk Stage Operations

Loans can be moved in bulk from the loan list:

```
[□ Select All] → [Advance Stage] → [Confirm]
  → All selected loans with same current stage advance together
  → Invalid transitions are skipped with error report
```

---

## Stage Configuration

Stages are defined in `shared/constants.ts` for easy modification. Adding a new stage requires:

1. Add entry to `STAGE_TYPES` array
2. Define transitions in `isValidTransition()`
3. Add auto-reminder in reminder service
4. Add color/label in frontend constants
5. Run Prisma migration if stage enum updated
