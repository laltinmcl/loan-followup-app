# Features

## Complete Feature Reference

### 1. Data Import & Management

**Excel/CSV Import**
- Drag-and-drop file upload interface
- Auto-detection of columns with preview
- Column mapping (auto-match or manual override)
- Validation before import (duplicate A/c No, invalid amounts, missing required fields)
- Progress indicator with real-time row count
- Detailed error report after import (which rows failed and why)
- Support for .xlsx, .xls, .csv formats
- Handles Nepali-style number formatting (commas as separators)
- 460+ records imported in under 10 seconds

**Loan Management**
- View all loans in sortable, filterable table
- Filter by category, stage, status, date range, due count
- Full-text search across name, account number, mobile
- Edit loan details inline
- Soft-delete with undo option
- Bulk operations (advance stage, schedule visits, delete)

### 2. Interactive Dashboard

**Portfolio Overview Cards**
- Total loan count
- Total disbursed amount
- Total outstanding
- Total overdue (principal + interest)
- Recovery rate percentage
- Average days past due

**Category Breakdown**
- Donut chart showing loan distribution by category
- Drill-down: click a category to see filtered loan list
- Color-coded by risk level

**Stage Pipeline**
- Horizontal bar chart showing loans at each stage
- Hover to see count and total due per stage
- Click a stage bar to jump to pipeline view

**Delinquency Heatmap**
- Due count buckets: 0, 1-3, 4-6, 6+
- Each bucket shows count and total amount
- Visual severity indicator (green → yellow → orange → red)

**Today's Tasks**
- Reminders due today
- Field visits scheduled today
- Overdue reminders (badge with count)
- Quick-action buttons for each task

**Recent Activity Feed**
- Real-time updates via WebSocket
- Shows last 20 actions across the system
- Each action links back to the relevant loan

### 3. Follow-up Pipeline (Kanban Board)

**Visual Layout**
- Horizontal scrollable Kanban with one column per stage
- Loan cards grouped by stage
- Card shows: borrower name, account no, total due, due count, days in stage
- Color-coded by overdue severity

**Drag & Drop**
- Drag loan cards between stages
- Backend validates transition rules
- Toast notification on success/error
- Undo option for accidental moves

**Quick Actions**
- Each card has contextual action buttons
- "Log Visit" button on field visit stages
- "Mark Paid" on resolved-eligible stages
- "Call" button (opens phone dialer on mobile)

**Filters on Pipeline**
- Filter cards within pipeline by amount range, due count, category
- Search within pipeline
- "Show all" vs "Show my assigned" toggle

### 4. Field Visit Module

**Schedule a Visit**
- Select date from date picker
- Auto-suggest based on priority (due count, amount)
- Add notes for the visit
- Confirm scheduling creates auto-reminder

**Log a Visit (Online & Offline)**

*Online Mode:*
- Real-time GPS capture (one-tap "Get Current Location")
- Map preview showing pinned location
- Camera capture with timestamp watermark overlay
- Gallery of captured photos (swipeable)
- Visit outcome selector (dropdown with icons):
  - Collected (Full)
  - Collected (Partial)
  - Promise to Pay
  - Not at Home
  - Refused to Pay
  - Vacated / Moved
  - Business Closed
  - Deceased
- Payment amount field (shown only for collection outcomes)
- Notes field (free text)
- Next follow-up date suggestion

*Offline Mode:*
- Full visit logging without internet
- Loan data cached locally (IndexedDB)
- Photos captured and stored locally
- GPS coordinates cached
- Auto-sync when connection restores
- Sync progress indicator
- Conflict detection (if loan updated on server while offline)

**Visit History**
- Timeline of all visits for a loan
- Map view with visit location pins
- Photo gallery per visit (expandable fullscreen)
- Details: date, outcome, amount collected, notes

**Bulk Visit Mode**
- Plan a route with multiple loans
- Optimize order by location proximity (future)
- Mark visits in sequence
- Summary at end: X visited, Y collected, Z pending

### 5. Reminder System

**Auto-generated Reminders**
- On stage transition (see WORKFLOW.md)
- Loan expiry approaching (30/15/7 days before)
- Promise to Pay date reached
- Field visit overdue (not completed on scheduled date)
- Import completion notification

**Manual Reminders**
- Create custom reminders on any loan
- Set type, title, description, due date
- Link to specific loan

**Reminder Center**
- Three tabs: Overdue (red), Today, Upcoming
- Overdue reminders sorted by days overdue
- Each reminder shows: title, loan info, due date, days remaining/overdue
- Complete reminder with one tap (with confirmation)

**Notification Badge**
- App header shows count of overdue + today reminders
- Badge updates in real-time via WebSocket
- Clicking badge opens Reminder Center

**Browser Notifications**
- Push API notifications for:
  - New reminder assigned
  - Reminder becoming overdue
  - Sync completed (offline → online)
- Permission request on first login

### 6. Reports & Analytics

**Portfolio Summary**
- Loans by category
- Loans by stage
- Loans by status
- Export to CSV/PDF

**Aging Report**
- Buckets: 0 days, 1-30, 31-60, 61-90, 90+
- Count and total amount per bucket
- Trend over time (future)

**Collection Report**
- Total collected per day/week/month
- Comparison with previous period
- Collection efficiency rate

**Field Officer Activity**
- Visits per day
- Collection amount per visit
- Success rate (collected vs attempted)
- Most common visit outcomes

**Downloadable Reports**
- All reports exportable as CSV or PDF
- Date range selector for all reports
- Scheduled email reports (future)

### 7. PWA Offline Support

**Service Worker**
- App shell caching (instant load on repeat visits)
- Offline fallback page
- Background sync for field visits

**IndexedDB Storage**
- Loan data cached locally
- Visit records stored offline
- Photos stored as blobs
- Sync queue management

**Sync Engine**
- Auto-sync when online
- Manual sync button ("Sync Now")
- Sync status indicator
- Last synced timestamp
- Conflict resolution: server wins with local backup

**Offline Capabilities**
| Feature | Offline? | Details |
|---------|----------|---------|
| View loan list | ✓ | Cached data |
| View loan details | ✓ | Cached data |
| Search/filter loans | ✓ | Client-side on cached data |
| Log field visit | ✓ | Queued for sync |
| Capture photos | ✓ | Stored locally |
| Capture GPS | ✓ | Cached coordinates |
| View dashboard | Partial | Last cached snapshot |
| Create reminders | ✓ | Queued for sync |
| Mark reminder done | ✓ | Queued for sync |

### 8. Mobile Optimization

**Responsive Breakpoints**
- Phone (< 640px): Single column, bottom nav bar, swipeable cards
- Tablet (640-1024px): Two-column, side panel nav
- Desktop (> 1024px): Full layout, multi-column, advanced filters

**Touch Optimizations**
- 44px minimum touch targets
- Swipe gestures for common actions
- Pull-to-refresh on all lists
- Native-like transitions and animations
- Bottom-sheet modals on mobile

**Performance**
- Code splitting by route
- Lazy loading for heavy components (charts, maps)
- Image optimization and lazy loading
- Virtual scrolling for long lists (future)
- Bundle size monitoring

### 9. User Interface

**Theme**
- Light and dark mode support
- System preference detection
- Persistent choice (localStorage)

**Navigation**
- Bottom tab bar (mobile)
- Sidebar (desktop)
- Breadcrumb navigation on detail pages
- Back button with state preservation

**Empty States**
- Custom illustrations for empty lists
- Helpful CTAs ("Import your first loan")
- No-results for search with suggestion

**Loading States**
- Skeleton loaders for lists and cards
- Spinner for inline actions
- Progress bar for file uploads
- Shimmer animation for charts

**Error States**
- Friendly error messages with retry button
- Offline banner with auto-hide
- Validation errors inline on forms
- Toast notifications for success/error actions

### 10. Data Security

- JWT authentication
- All API calls over HTTPS
- Input validation (Zod schemas on both client and server)
- Rate limiting (100 requests/minute per user)
- SQL injection prevention (Prisma parameterized queries)
- XSS protection (React DOM escaping)
- File upload validation (type, size, malware scanning)
- Audit log for all critical actions
- Session timeout after 24h inactivity
- Password hashing (bcrypt, 12 rounds)
