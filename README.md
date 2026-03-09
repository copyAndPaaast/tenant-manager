# Tenant Manager

A web-based property management application for tracking tenants, flats, buildings, expenses, and contractors. Built with a lightweight vanilla JS frontend and a Node.js/Express backend.

## Features

- **Buildings & Flats** — manage your property portfolio with square meter tracking
- **Tenants** — full tenant profiles including rent history (Kaltmiete, Heizkosten, Nebenkosten), lease management, and notes
- **Contractors** — track suppliers and their work history
- **Expenses** — one-time and recurring expenses (monthly, quarterly, yearly) with billable flagging and price history
- **Annual Settlements (Nebenkostenabrechnung)** — automated cost distribution by square meters, upfront payment deduction, and clipboard export for Word/Excel
- **Financial Dashboard** — yearly overview of rent income, expenses, and profit with Chart.js visualisation
- **File Attachments** — upload and manage documents per tenant, building, flat, or contractor
- **Admin Panel** — manage expense categories and upload a custom app logo

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla JavaScript (custom component system), Vanilla CSS |
| Backend | Node.js, Express |
| Database | SQLite (`database.sqlite`) |
| File uploads | multer |
| Charts | Chart.js |

No frontend framework. The UI is built on a lightweight custom `Component` base class with state management and HTML string rendering.

## Getting Started

**Requirements:** Node.js 18+

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Or start without auto-reload
npm start
```

The app will be available at `http://localhost:3000`.

On first start, the SQLite database and `uploads/` folder are created automatically.

## Project Structure

```
tenant-manager/
├── src/
│   ├── index.js          # Express server entry point
│   ├── db/
│   │   └── database.js   # SQLite setup and table initialisation
│   └── api/              # REST API routes
│       ├── buildings.js
│       ├── flats.js
│       ├── tenants.js
│       ├── contractors.js
│       ├── expenses.js
│       ├── leases.js
│       ├── rent_history.js
│       ├── protocols.js
│       ├── settlements.js
│       ├── files.js
│       └── settings.js
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── app.js        # Router setup and navigation
│   │   ├── Component.js  # Base component class
│   │   ├── Router.js     # Client-side SPA router
│   │   └── i18n.js       # Localisation (de/en)
│   └── components/       # Page components
│       ├── Dashboard.js
│       ├── BuildingsList.js / BuildingForm.js
│       ├── FlatsList.js / FlatForm.js
│       ├── TenantsList.js / TenantForm.js
│       ├── ContractorsList.js / ContractorForm.js
│       ├── ExpensesList.js / ExpenseForm.js
│       ├── SettlementForm.js
│       ├── FileAttachments.js
│       └── Admin.js
└── uploads/              # User-uploaded files (gitignored)
```

## File Uploads

Uploaded files are stored under `uploads/` in a structured folder hierarchy:

```
uploads/
  tenants/    Max_Mustermann/    2026-03-09_Mietvertrag.pdf
  buildings/  Hauptstrasse_1/    2026-03-09_Grundriss.pdf
  flats/      Wohnung_OG_links/  2026-03-09_Foto.jpg
  contractors/Mustermann_GmbH/   2026-03-09_Angebot.pdf
  settings/                      logo.png
```

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/api/buildings` | List / create buildings |
| GET/PUT | `/api/buildings/:id` | Get / update building |
| GET/POST | `/api/flats` | List / create flats |
| GET/POST | `/api/tenants` | List / create tenants |
| GET/POST | `/api/contractors` | List / create contractors |
| GET/POST | `/api/expenses` | List / create expenses |
| GET/POST | `/api/leases` | List / create leases |
| GET/POST | `/api/rent_history` | List / create rent history entries |
| GET/POST | `/api/settlements` | List / create annual settlements |
| GET/POST | `/api/files` | List / upload file attachments |
| GET | `/api/files/:id/download` | Download a file |
| DELETE | `/api/files/:id` | Delete a file |
| GET | `/api/settings/:key` | Get a setting value |
| POST | `/api/settings/logo` | Upload app logo |

## Localisation

The UI supports German and English. Language can be toggled in the top bar. Translation strings are defined in `public/js/i18n.js`.

## License

MIT
