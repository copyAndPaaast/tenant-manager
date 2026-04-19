# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start with nodemon (auto-reload)
npm start          # Start without auto-reload
```

App runs at `http://localhost:3000`. No build step required — frontend is served as static files.

## Architecture

### Backend (`src/`)

- **`src/index.js`** — Express entry point. Mounts all API routers under `/api/*` and serves the SPA via a catch-all GET handler.
- **`src/db/database.js`** — Opens the SQLite database (`database.sqlite` at project root), runs `CREATE TABLE IF NOT EXISTS` for all tables on startup, and applies incremental migrations via `ALTER TABLE ... ADD COLUMN` (errors ignored if columns exist). The `db` instance is a shared singleton exported to all API modules.
- **`src/api/*.js`** — Each file is an Express Router for one resource (buildings, flats, tenants, contractors, expenses, leases, rent_history, protocols, expense_history, expense_categories, settlements, files, settings, database). All use the callback-based `sqlite3` API.
- **`src/import/`** — One-off data import scripts (Excel-based). Not part of the running app.

### Frontend (`public/`)

No framework. The UI is a custom SPA:

- **`public/js/Component.js`** — Base class for all UI components. Renders by setting `container.innerHTML = this.render()` (full re-render on state change). Components override `render()` (returns HTML string) and `postRender()` (attach event listeners). Also contains `calculateAnnualExpense()` logic shared across Dashboard and SettlementForm.
- **`public/js/Router.js`** — Intercepts clicks on `[data-link]` elements, uses `history.pushState`, matches paths against route patterns (`:param` segments converted to regex), instantiates the matched component class with `{ params }` props.
- **`public/js/app.js`** — Defines the route table, renders sidebar nav, handles language toggle, loads the logo from settings, and starts the router.
- **`public/js/i18n.js`** — German/English translations. Components access via `this.t('key')`, `this.fCurrency()`, `this.fDate()` inherited from `Component`.
- **`public/components/*.js`** — Page components (one per route). Fetch data from `/api/*` in `mount()` or `postRender()`, call `this.setState()` to trigger re-render.

### Data model relationships

```
buildings → flats → leases ↔ tenants
                           → rent_history
                           → protocols
buildings → annual_settlements → annual_settlement_expenses
                               → annual_settlement_flats → flats
expenses → expense_history (price changes over time)
expenses → expense_categories
files (entity_type + entity_id: polymorphic attachments for tenants/buildings/flats/contractors)
settings (key-value store, used for logo)
```

### Expense recurrence logic

Expenses have a `frequency` field (`One-time`, `Monthly`, `Quarterly`, `Yearly`). Quarterly/Yearly can store a `recurring_config` JSON column (e.g. specific months for quarterly billing). The `calculateAnnualExpense()` method in `Component.js` iterates months to compute yearly totals — it also reads `expense_history` records to apply the correct amount per period.

### Annual Settlement (Nebenkostenabrechnung)

`SettlementForm` computes per-flat cost shares based on square meters. Billable expenses are distributed proportionally. The result can be copied to clipboard for use in Word/Excel.

### File uploads

Multer stores files under `uploads/<entity_type>/<entity_name>/YYYY-MM-DD_<original_name>`. Served statically at `/uploads/*`. Tracked in the `files` table.
