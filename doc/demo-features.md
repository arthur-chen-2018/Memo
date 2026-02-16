# Memo App — Demo Feature Guide

## Overview

The Memo App manages notification tasks exchanged between **VOC/Ventia** (field services) and **Homes Victoria** (government client) for property maintenance work orders. It provides conversation threading, attachment handling, status workflows, and error monitoring.

---

## Screen 1: Memo List (`/`)

The landing page shows all memos in a sortable, filterable table.

### Filter Bar

Collapse/expand the filter bar to search by:

| Filter | Control | Example |
|--------|---------|---------|
| Job Number | Text input | `JOB-78901` |
| Work Order | Text input | `40001234` |
| Notification | Text input | `20004567` |
| Task | Text input | `0010` |
| Stream Number | Text input | `STR-0042` |
| Date Range | Date picker | Select a date |
| Status | Multi-select | `New`, `In Progress` |
| Memo Type | Dropdown | `Access Issue` |

Press **Go** to apply filters, **Clear** to reset.

### Table Columns

| Column | What It Shows |
|--------|--------------|
| Job Number | HV's reference (e.g. `JOB-78901`) |
| Work Order | SAP reference + orange warning icon if the WO has multiple open memos |
| Notification | Notification number |
| Task | Task number |
| Stream | HV's unique memo ID |
| Memo Type | Access Issue / Additional Works / Unavailability / Other |
| Status | Color-coded badge (blue=New, green=Released, orange=In Progress, grey=Complete/Closed) |
| Last Message From | Color-coded org name — blue for HV, orange for VOC |
| Last Updated | DD/MM/YYYY HH:MM format |
| Messages | Chat icon + count + blue unread badge + red error icon if delivery failed |
| Attachments | Paperclip icon + count |

### Visual Indicators

- **Bold row** — memo has unread messages
- **Orange warning triangle** on Work Order — this WO has multiple open memos
- **Red error icon** in Messages column — the last outbound response to HV failed
- **Blue unread badge** — number of unread messages

### Actions

- **Click any row** → navigates to the Memo Conversation page
- **"New Memo" button** (top right) → opens the New Memo side panel

---

## Screen 2: Memo Conversation (`/memo/:id`)

The detail page for a single memo, with a sidebar for navigating between memos on the same work order.

### Left Sidebar (260px)

Lists all memos on the current work order. Each item shows:
- Task number + Stream number
- Memo type + last updated
- Status badge

The active memo has a blue left border. Unread memos appear bold. Click to switch.

### Object Page Header

- **Title**: `WO {workOrderNumber} / Task {taskNumber}`
- **Subtitle**: Notification + Job number
- **Attributes**: Status, Memo Type, Job Number, Stream Number, Serial Number, Created By, Created Date, Last Updated

### Action Toolbar

| Button | What It Does |
|--------|-------------|
| Reply | Focus the compose area in Messages tab |
| Add Attachment | Open file picker |
| Change Status | Opens status transition dialog |
| New Memo | Opens New Memo panel (pre-filled with current WO) |

### Status Change Dialog

- Shows only **valid transitions** based on the current status:
  - New → Released, In Progress
  - Released → In Progress
  - In Progress → Technically Complete
  - Technically Complete → Closed, In Progress
  - Closed → no options ("Contact admin to reopen")
- Select a status and click **Confirm** to update.

### Messages Tab

A threaded conversation view (oldest at top, newest at bottom):

- **Left border color**: blue for Homes Victoria, orange for VOC
- **Avatar circle** with sender initial, color-coded
- **Sender line**: Organization + name + message type chip (Request/Reply/Rejection/Info Update) + timestamp
- **Message body**: subject line (bold) + full message text
- **Attachment chips**: clickable — opens the Attachment Viewer

Special indicators:
- **Info strip** (top): "Only your new message text will be sent to HV..."
- **Red failure strip**: appears on messages that failed delivery, with a Retry button

**Compose area** (pinned at bottom):
- Text area for typing a reply
- Paperclip button to attach files
- Send button (paper plane icon)
- Helper text: "Your response will be sent to Homes Victoria via API."
- Toast notification on successful send

### Attachments Tab

- **Upload button** (top right) to add files
- Table columns: File name (clickable), Type, Size, Uploaded By (color-coded), Upload Date, Actions
- **Download** button on every attachment
- **Delete** button only on VOC-uploaded attachments
- Click a file name to open the Attachment Viewer

### Details Tab

Three collapsible panels:

1. **HV API Fields**: Job Number, Stream Number, Serial Number, Originator
2. **SAP Mapping**: Notification Number, Task Number, Code Group ("Memos"), Code (memo type)
3. **Activity Log**: Timestamped table of all memo events — creation, status changes, messages sent/received, delivery failures

---

## Screen 3: New Memo Panel

A 480px slide-in panel from the right with a dimmed backdrop.

### Form Fields

| Field | Type | Notes |
|-------|------|-------|
| Job Number | Read-only input | Auto-populated |
| Work Order Number | Editable input | Pre-filled if opened from conversation page |
| Notification Number | Read-only input | Auto-populated |
| Memo Type | Required dropdown | Access Issue / Additional Works / Unavailability / Other |
| Priority | Dropdown | Normal / Urgent |
| Subject | Required text input | 40 character limit with live counter |
| Message | Required text area | 5 rows, auto-growing |
| Attachments | File uploader | Shows file chips with remove X |

### Validation

Required fields show red borders and error messages when submitting empty.

### Submit Flow

1. Click **Submit**
2. Validation runs
3. On success: toast "Memo created successfully", panel closes after 1.5s, list refreshes
4. On error: error dialog with retry message

---

## Screen 4: Attachment Viewer

A fullscreen dark overlay for previewing attachments.

### Top Bar
- File name + "N of M" counter
- Previous/Next arrows
- Download button
- Delete button (VOC uploads only)
- Close X button

### Preview Area
- Images: preview display (placeholder in mock mode)
- PDFs: viewer with download button
- Videos: player placeholder
- Other files: "Preview not available" with download button

### Bottom Metadata Bar
- Uploaded By (color-coded blue/orange)
- File Size
- Upload Date

### Thumbnail Strip
When 3+ attachments exist, a horizontal strip at the bottom shows all files. Active file has a blue border. Click to switch.

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Escape` | Close viewer |
| `Arrow Left` | Previous attachment |
| `Arrow Right` | Next attachment |

---

## Screen 5: Error Monitor (`/errors`)

Accessible via the **alert icon** (with count badge) in the Shell Bar.

### Filter Bar

| Filter | Options |
|--------|---------|
| Error Type | All / API Timeout / Validation Error |
| Status | All / Unresolved / Retrying / Resolved |
| Work Order | Text input |

### Error Table

| Column | Description |
|--------|------------|
| Error ID | e.g. `ERR-001` |
| Timestamp | DD/MM/YYYY HH:MM |
| Direction | Tag — Inbound (purple) / Outbound (blue) |
| Error Type | API Timeout, Validation Error, etc. |
| Work Order | Clickable link → navigates to memo |
| Job Number | HV reference |
| Stream | Stream number |
| Error Detail | Truncated error description |
| Status | Red (Unresolved), Yellow (Retrying), Green (Resolved) |
| Actions | Retry (refresh icon) + Resolve (checkmark icon) |

### Expanded Row Detail

Click a row to expand and see:
1. **Full Error Message** — complete error text in a red message strip
2. **Original Payload** — formatted JSON of the failed request
3. **Retry History** — timestamped list of all retry attempts and their results
4. **Action buttons** — Retry + Mark as Resolved

---

## End-to-End Demo Flow

### Scenario: Handling an access issue memo

1. **Open the app** → land on Memo List with 10 memos
2. **Notice visual cues** — bold rows (unread), warning icons (multi-memo WOs), error icons (failed delivery)
3. **Filter** by Status = "In Progress" → table filters to show relevant memos
4. **Click memo STR-0042** (row 1) → navigate to Conversation page
5. **Read the thread** — 5 messages between HV and VOC about a property access issue
6. **Notice the red failure strip** on the last message — delivery to HV failed
7. **Switch to Attachments tab** — see 3 files (2 damage photos, 1 scope PDF)
8. **Click a photo** → Attachment Viewer opens fullscreen, navigate with arrows
9. **Press Escape** to close viewer
10. **Switch to Details tab** → see HV API fields, SAP mapping, full activity log
11. **Type a reply** in compose area → click Send → toast confirms delivery
12. **Click "Change Status"** → dialog shows valid transitions → select "Technically Complete" → Confirm
13. **Check sidebar** — other WO memos visible, click to switch
14. **Click "New Memo"** → side panel opens pre-filled with WO number → fill form → Submit
15. **Navigate to Error Monitor** via Shell Bar alert icon
16. **Expand ERR-001** → see full error, payload, retry history
17. **Click Retry** → status changes to "Retrying"
18. **Click "Mark as Resolved"** on ERR-002 → status changes to "Resolved"
19. **Return home** by clicking the app title → memo list refreshed with new data
