# Project Rules

## UI5 Development Guidelines

Before working on any UI5/SAPUI5/OpenUI5 related task, you MUST call the `mcp__ui5-mcp__get_guidelines` tool to retrieve the latest coding standards and best practices. This ensures you always follow up-to-date UI5 conventions.

### Key Rules (summary — always defer to the full guidelines from the tool)

- **No global access** — never use `sap.m.Button` etc. globally; use `sap.ui.define`, ES6 `import`, or XML `core:require`
- **Use data binding** — connect UI controls to data/i18n models; never use custom formatters for standard types (dates, numbers, currencies)
- **No inline scripts** — all logic in dedicated JS/TS files (CSP compliance)
- **Use `sap/ui/core/ComponentSupport`** to bootstrap apps in HTML
- **TypeScript event handlers** — use `<Control>$<EventName>Event` types (UI5 >= 1.115)
- **API lookup** — use the `mcp__ui5-mcp__get_api_reference` tool, not guesswork
- **Linting** — use the `mcp__ui5-mcp__run_ui5_linter` tool to validate code
- **Forms** — use `sap.ui.layout.form.Form` with `ColumnLayout` (not `SimpleForm` unless explicitly requested)
- **i18n** — apply changes to ALL locale files, not just the base
- **CAP integration** — create UI5 apps in `app/`, use `cds watch` from root, never run `ui5 serve` separately

## CAP (CDS) MCP Guidelines

Before working on any SAP CAP/CDS related task (data models, services, handlers, OData endpoints), you MUST use the CDS MCP tools:

### Tool Usage

- **`mcp__cds-mcp__search_model`** — Use to inspect CDS model definitions (entities, services, actions, elements, annotations). Always search the model before writing queries, building OData URLs, or modifying CDS files.
- **`mcp__cds-mcp__search_docs`** — Use when unsure about CAP APIs, Node.js runtime, CDS syntax, or Java runtime. Search CAP documentation before guessing.

### Key Rules

- **Always inspect the model first** — before modifying CDS files or writing service handlers, use `search_model` to understand existing entities, associations, and annotations
- **Search docs for API usage** — never guess CAP Node.js or Java APIs; use `search_docs` to find correct patterns for `cds.Service`, `req.data`, `req.notify`, event handlers, etc.
- **Use `cds compile`** — when CDS tools are available, use `cds compile '*'` for definitions and `cds compile '*' --to serviceinfo` for service endpoints
- **OData V4 service URLs** — always verify service paths via model inspection rather than hardcoding
- **Authentication** — configure via `cds.requires.auth` in package.json, not custom middleware
- **SQLite for local dev** — use `@cap-js/sqlite` plugin (`npm add @cap-js/sqlite`)
- **Node.js version** — CAP v9 requires Node.js >= 20, recommended 22 LTS

## SAP Fiori Elements MCP Guidelines

Before working on any SAP Fiori elements task (List Report, Object Page, annotations, manifest configuration, extensions), you MUST use the Fiori MCP tools:

### Tool Usage — 3-Step Workflow

1. **`mcp__fiori-mcp__list_functionality`** (Step 1) — Get the complete list of supported functionalities for a Fiori app. Requires the absolute app path. MUST use a `functionalityId` from this output for Step 2.
2. **`mcp__fiori-mcp__get_functionality_details`** (Step 2) — Get required parameters for a specific functionality using the `functionalityId` from Step 1.
3. **`mcp__fiori-mcp__execute_functionality`** (Step 3) — Execute the functionality with parameters from Step 2.

### Discovery & Documentation Tools

- **`mcp__fiori-mcp__list_fiori_apps`** — Use FIRST if the target app name/path is unknown. Scans a directory for existing Fiori apps.
- **`mcp__fiori-mcp__search_docs`** — Use when unsure about Fiori Elements APIs, annotations, SAPUI5, or Fiori tools. Search documentation before guessing.

### Key Rules

- **Never guess functionality IDs** — always get them from `list_functionality` first; guessed IDs will fail
- **Always use the 3-step workflow** — list → details → execute; do not skip steps
- **Discover apps first** — if the app path is unknown, use `list_fiori_apps` before starting the workflow
- **Search docs as fallback** — if `list_functionality` doesn't cover the goal, use `search_docs`
- **CDS annotations** — for Fiori Elements apps backed by CAP, use CDS annotations (`@UI.LineItem`, `@UI.HeaderInfo`, `@UI.FieldGroup`, etc.) instead of XML annotation files
- **manifest.json** — configure pages, routing, targets, controlConfiguration, and extensions in the app's `manifest.json`
- **Draft support** — enable via `@odata.draft.enabled` on the entity in CDS
- **i18n overrides** — use `enhanceI18n` in manifest settings to provide custom text
- **Controller extensions** — register under `sap.ui5.extends.extensions` in manifest and implement in dedicated TS/JS files
- **Value helps** — use `@Common.ValueList` / `@Common.ValueListWithFixedValues` annotations
- **Actions** — use `@UI.DataFieldForAction` in `@UI.LineItem`; use `@Core.OperationAvailable` for dynamic enable/disable
- **Side effects** — declare `@Common.SideEffects` with `TargetProperties` on actions that modify data
