# Memo App — Setup Guide

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 9+ (comes with Node.js)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm start
```

The app will be available at `http://localhost:8080/index.html`.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start UI5 dev server with livereload on port 8080 |
| `npm run build` | Production build to `dist/` |
| `npm run build:opt` | Self-contained production build (all dependencies bundled) |
| `npm run ts-typecheck` | TypeScript type-checking only |
| `npm run lint` | ESLint on `webapp/` |
| `npm run ui5lint` | UI5-specific linting |
| `npm run test:e2e` | Run Playwright E2E smoke tests (18 tests) |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI framework | SAPUI5 | 1.144.x |
| Views | XML Views + Fragments | — |
| Controllers | TypeScript | 5.9.x |
| Routing | sap.m.routing.Router (hash-based) | — |
| Theme | SAP Fiori Horizon (`sap_horizon`) | Built-in |
| Styling | Plain CSS with `var(--sap*)` tokens | — |
| Data | Mock data + service abstraction | — |
| Build | @ui5/cli | 4.x |
| E2E tests | Playwright (headless Chromium) | 1.58.x |

---

## Project Structure

```
memo/
├── doc/                              # Documentation
├── test/
│   └── e2e/
│       ├── run.mjs                   # Server + test orchestrator
│       └── smoke.mjs                 # 18 Playwright E2E tests
├── webapp/
│   ├── controller/
│   │   ├── App.controller.ts         # Shell bar navigation
│   │   ├── BaseController.ts         # Shared controller logic
│   │   ├── ErrorMonitor.controller.ts
│   │   ├── MemoConversation.controller.ts
│   │   └── MemoList.controller.ts
│   ├── css/
│   │   └── style.css                 # Global styles using SAP tokens
│   ├── fragment/
│   │   ├── AttachmentViewer.fragment.xml
│   │   ├── AttachmentsTab.fragment.xml
│   │   ├── MemoDetailsTab.fragment.xml
│   │   ├── MemoFilterBar.fragment.xml
│   │   ├── MemoSideList.fragment.xml
│   │   ├── MessagesTab.fragment.xml
│   │   ├── NewMemoDialog.fragment.xml
│   │   └── StatusChangeDialog.fragment.xml
│   ├── i18n/
│   │   ├── i18n.properties           # Default locale
│   │   └── i18n_en.properties        # English locale
│   ├── model/
│   │   ├── AppModel.ts               # App-level model setup
│   │   ├── AttachmentService.ts
│   │   ├── ErrorService.ts
│   │   ├── MemoService.ts
│   │   ├── MessageService.ts
│   │   ├── formatter.ts              # Status/date formatters
│   │   ├── mockData.ts               # 30 memos, messages, attachments, errors
│   │   └── types.ts                  # Domain types + status rules
│   ├── view/
│   │   ├── App.view.xml              # Shell bar + app container
│   │   ├── ErrorMonitor.view.xml
│   │   ├── MemoConversation.view.xml
│   │   └── MemoList.view.xml
│   ├── Component.ts                  # UI5 Component (entry point)
│   ├── index.html                    # Bootstrap page
│   └── manifest.json                 # App descriptor (routing, models, config)
├── package.json
├── tsconfig.json
└── ui5.yaml                          # UI5 tooling config
```

---

## Routing

Hash-based routing via `sap.m.routing.Router`:

| Hash | View | Description |
|------|------|-------------|
| `#/` (empty) | MemoList | Filterable memo table |
| `#/memo/{memoId}` | MemoConversation | Memo detail with sidebar + tabs |
| `#/errors` | ErrorMonitor | Error monitoring dashboard |

---

## Data Layer

The app uses a mock data layer with service abstractions. All data lives in memory and resets on page refresh.

- **Mock data**: `webapp/model/mockData.ts` — 30 memos, 5 messages, 3 attachments, 2 error logs, 8 activity log entries
- **Services**: `webapp/model/MemoService.ts`, `MessageService.ts`, `AttachmentService.ts`, `ErrorService.ts`

To connect to a real backend (e.g. OData V4), replace the service implementations with actual API calls. The interfaces stay the same.

---

## E2E Tests

The app includes 18 Playwright smoke tests covering all interactive features:

```bash
npm run test:e2e
```

This starts the UI5 dev server, runs all tests headless, then shuts down the server. Tests cover:
- Navigation (routing, back, direct hash)
- New Memo (dialog, validation, submit)
- Sidebar cross-memo navigation
- Compose and send message
- Status change workflow
- Attachment tab and viewer
- Filter bar (Go + Clear)
- Error Monitor (expand, filter)
- ShellBar navigation

---

## Building for Production

```bash
npm run build
```

Output goes to `dist/`. For a self-contained build with all UI5 dependencies bundled:

```bash
npm run build:opt
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 8080 in use | Change port: `ui5 serve --port 9090` |
| TypeScript errors | Run `npm run ts-typecheck` to check |
| UI5 deprecation warnings | Run `npm run ui5lint` to find deprecated API usage |
| Blank page after navigation | Check browser console for XML view parsing errors — common cause is invalid aggregation names |
| E2E tests fail | Ensure no other process uses port 8080; run `npm run test:e2e` |
