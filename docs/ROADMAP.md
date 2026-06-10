# Roadmap

## Current Status: v1.0 (In Development)

---

## Phase 1 — Foundation (Current)

- [x] Project structure and documentation
- [x] Database schema design
- [x] API endpoint design
- [x] Follow-up stage workflow design
- [x] Architecture documentation
- [ ] Frontend project setup (React + Vite + TypeScript)
- [ ] Backend project setup (Express + Prisma)
- [ ] Authentication (login/logout)
- [ ] Excel/CSV import with validation
- [ ] Loan list view with filters
- [ ] Loan detail page
- [ ] Basic dashboard (summary cards)

**Target:** v1.0 — Core MVP

---

## Phase 2 — Follow-up Engine

- [ ] Follow-up stage pipeline (Kanban board)
- [ ] Stage transition (manual + auto)
- [ ] Stage history / activity timeline
- [ ] Auto-reminder generation on stage changes
- [ ] Bulk stage operations
- [ ] Stage configuration panel

**Target:** v1.1

---

## Phase 3 — Field Visit Module

- [ ] Schedule field visits
- [ ] Log visit with GPS capture
- [ ] Photo capture with timestamp watermark
- [ ] Visit outcome tracking
- [ ] Payment recording during visits
- [ ] Visit history with map view
- [ ] PWA setup (manifest, service worker)
- [ ] Offline visit logging (IndexedDB)
- [ ] Background sync for offline data
- [ ] Bulk visit mode

**Target:** v1.2

---

## Phase 4 — Reminders & Notifications

- [ ] In-app reminder center
- [ ] Auto-reminders from stage changes
- [ ] Manual reminders
- [ ] Browser push notifications
- [ ] Reminder badge/indicator
- [ ] Overdue reminder highlighting

**Target:** v1.3

---

## Phase 5 — Reports & Analytics

- [ ] Portfolio summary report
- [ ] Aging report (due count buckets)
- [ ] Collection report (daily/weekly/monthly)
- [ ] Field officer activity report
- [ ] Report export (CSV, PDF)
- [ ] Dashboard charts (Recharts)
- [ ] Dashboard — category breakdown
- [ ] Dashboard — stage pipeline
- [ ] Dashboard — delinquency heatmap

**Target:** v1.4

---

## Phase 6 — Polish & Scale

- [ ] Dark mode
- [ ] Performance optimization (code splitting, lazy loading)
- [ ] PWA Lighthouse optimization (>90 score)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Internationalization (Nepali + English)
- [ ] BS (Bikram Sambat) date support
- [ ] Advanced search (full-text search)
- [ ] Virtual scrolling for large lists

**Target:** v2.0

---

## Future (Post-v2.0)

### High Priority
- [ ] **SMS Integration**: Twilio/API for automated SMS reminders
- [ ] **Email Notifications**: Transactional emails for follow-ups
- [ ] **Multi-role system**: Branch Head, Manager, Collector roles
- [ ] **Dashboard custom widgets**: User-configurable dashboard

### Medium Priority
- [ ] **WhatsApp integration**: Message templates via WhatsApp Business API
- [ ] **Route optimization**: Optimize field visit routes by GPS proximity
- [ ] **AI-powered prioritization**: Predict high-risk loans using ML
- [ ] **Voice call logging**: Record and transcribe call conversations
- [ ] **Dashboard — trend charts**: Delinquency rate over time

### Lower Priority
- [ ] **Advanced data visualization**: Interactive maps, heatmaps
- [ ] **Native mobile apps**: React Native / Flutter (beyond PWA)
- [ ] **Core banking integration**: API sync with LOS/core banking system
- [ ] **Biometric authentication**: Fingerprint/face login on mobile
- [ ] **Offline maps**: Download map areas for field visits
- [ ] **Payment gateway**: Accept digital payments within the app
- [ ] **Audit trail viewer**: Searchable, filterable audit log UI

### Long-term Vision
- [ ] **Multi-branch support**: Separate portfolios by branch
- [ ] **Agent performance dashboard**: Gamification, leaderboards
- [ ] **Regulatory compliance**: Nepal Rastra Bank reporting formats
- [ ] **Document management**: Store loan documents, applications
- [ ] **Customer portal**: Borrowers can view their own status
- [ ] **Mobile money integration**: eSewa, Khalti, ConnectIPS

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| v1.0 | TBD | MVP: Import, Loan List, Dashboard, Auth |
| v1.1 | TBD | Follow-up Pipeline, Stage Workflow |
| v1.2 | TBD | Field Visits, PWA Offline |
| v1.3 | TBD | Reminders, Notifications |
| v1.4 | TBD | Reports, Analytics |
| v2.0 | TBD | Dark Mode, Performance, Accessibility |

---

## How to Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

Priority areas for community contributions:
- PWA offline improvements
- BS date utilities
- Report templates
- Nepali language translations
- Test coverage
