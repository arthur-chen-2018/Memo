# Memo App — Setup Guide

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (comes with Node.js)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview the production build locally |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI framework | React | 18.3.x |
| UI components | @ui5/webcomponents-react | ~2.19.0 |
| Routing | React Router | 7.13.x |
| Language | TypeScript | 5.5.x |
| Build tool | Vite | 6.x |
| Theme | SAP Fiori Horizon (`sap_horizon`) | Built-in |
| Styling | Plain CSS with `var(--sap*)` tokens | — |
| Data | Mock data + service abstraction | — |

---

## Project Structure

```
memo/
├── doc/                          # Documentation
├── src/
│   ├── components/               # Shared UI components
│   │   ├── conversation/         # Conversation page sub-components
│   │   │   ├── AttachmentsTab.tsx
│   │   │   ├── MemoDetailsTab.tsx
│   │   │   ├── MessagesTab.tsx
│   │   │   └── MessagesTab.css
│   │   ├── AppShellBar.tsx       # Top navigation bar
│   │   ├── AttachmentViewer.tsx   # Fullscreen lightbox
│   │   ├── AttachmentViewer.css
│   │   ├── MemoFilterBar.tsx     # 8-field filter bar
│   │   ├── MemoSideNav.tsx       # Conversation sidebar
│   │   ├── MemoSideNav.css
│   │   ├── MemoTable.tsx         # 11-column memo table
│   │   ├── MemoTable.css
│   │   ├── NewMemoPanel.tsx      # Side panel form
│   │   └── NewMemoPanel.css
│   ├── context/
│   │   └── AppContext.tsx        # Global state (memos, unread, errors)
│   ├── data/
│   │   └── mockData.ts          # 10 memos, messages, attachments, errors
│   ├── pages/
│   │   ├── MemoListPage.tsx      # Screen 1: Memo list
│   │   ├── MemoListPage.css
│   │   ├── MemoConversationPage.tsx  # Screen 2: Memo detail
│   │   ├── MemoConversationPage.css
│   │   ├── ErrorMonitorPage.tsx  # Screen 5: Error monitor
│   │   └── ErrorMonitorPage.css
│   ├── services/
│   │   └── index.ts             # Service layer (mock API)
│   ├── styles/
│   │   └── global.css           # Global resets using SAP tokens
│   ├── types/
│   │   └── index.ts             # Domain types + status rules
│   ├── App.tsx                   # Root component
│   ├── main.tsx                  # Entry point + ThemeProvider
│   ├── routes.tsx                # Route definitions
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Key Configuration

### Path Aliases

The `@` alias points to `src/`, configured in both `vite.config.ts` and `tsconfig.json`:

```typescript
// Import example
import { useAppContext } from '@/context/AppContext';
import type { Memo } from '@/types';
```

### UI5 Theme

The SAP Horizon theme is loaded automatically via:

```tsx
// src/main.tsx
import { ThemeProvider } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-react/dist/Assets.js';

<ThemeProvider>
  <App />
</ThemeProvider>
```

All custom CSS uses SAP design tokens (`var(--sapFontFamily)`, `var(--sapTextColor)`, etc.) for automatic theme compatibility.

### UI5 Icon Imports

Every UI5 icon requires a side-effect import. If an icon doesn't render, check that its import exists:

```typescript
import '@ui5/webcomponents-icons/dist/alert.js';
import '@ui5/webcomponents-icons/dist/bell.js';
import '@ui5/webcomponents-icons/dist/paper-plane.js';
```

---

## Data Layer

The app uses a mock data layer with a service abstraction. All data lives in memory and resets on page refresh.

- **Mock data**: `src/data/mockData.ts` — 10 memos, 5 messages, 3 attachments, 2 error logs, 8 activity log entries
- **Services**: `src/services/index.ts` — async functions with simulated delays (100–500ms)

To connect to a real backend, replace the service implementations in `src/services/index.ts` with actual API calls. The interfaces stay the same.

---

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | MemoListPage | Filterable memo table |
| `/memo/:id` | MemoConversationPage | Memo detail with tabs |
| `/errors` | ErrorMonitorPage | Error monitoring dashboard |

---

## Building for Production

```bash
npm run build
```

Output goes to `dist/`. The build:
1. Runs TypeScript type-checking (`tsc -b`)
2. Bundles with Vite (tree-shaking, code splitting, minification)

To preview the production build:

```bash
npm run preview
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Icons not rendering | Add the icon's side-effect import: `import '@ui5/webcomponents-icons/dist/<name>.js'` |
| Port 5173 in use | Vite auto-picks the next available port, check terminal output |
| Type errors after dependency update | Run `npx tsc --noEmit` to check; UI5 v2 renamed `Badge` → `Tag`, `actions` → `actionsBar`, etc. |
| Blank page | Check browser console; ensure `@ui5/webcomponents-react/dist/Assets.js` is imported in `main.tsx` |
| Filters not working | Filter inputs need `data-filter-name` attributes matching the service filter keys |
