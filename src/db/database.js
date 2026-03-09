const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeTables();
    }
});

function initializeTables() {
    db.serialize(() => {
        // Buildings
        db.run(`CREATE TABLE IF NOT EXISTS buildings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            address TEXT NOT NULL,
            description TEXT,
            total_square_meters REAL
        )`);

        // Migration: Add total_square_meters if it doesn't exist
        db.run(`ALTER TABLE buildings ADD COLUMN total_square_meters REAL`, (err) => {
            // Ignore error if column already exists
        });

        // Flats
        db.run(`CREATE TABLE IF NOT EXISTS flats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            building_id INTEGER,
            name_number TEXT NOT NULL,
            location_in_building TEXT,
            square_meters REAL,
            description TEXT,
            FOREIGN KEY (building_id) REFERENCES buildings (id)
        )`);

        // Tenants
        db.run(`CREATE TABLE IF NOT EXISTS tenants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            iban TEXT,
            bic TEXT,
            bank_name TEXT,
            account_holder TEXT,
            deposit_amount REAL,
            deposit_date TEXT,
            deposit_notes TEXT
        )`);

        // Migration: Add bank and deposit columns if they don't exist
        const tenantColumns = [
            'iban TEXT',
            'bic TEXT',
            'bank_name TEXT',
            'account_holder TEXT',
            'deposit_amount REAL',
            'deposit_date TEXT',
            'deposit_notes TEXT'
        ];
        tenantColumns.forEach(col => {
            db.run(`ALTER TABLE tenants ADD COLUMN ${col}`, (err) => {
                // Ignore error if column already exists
            });
        });

        // Leases (Connects Tenants to Flats)
        db.run(`CREATE TABLE IF NOT EXISTS leases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            flat_id INTEGER,
            tenant_id INTEGER,
            move_in_date TEXT NOT NULL,
            move_out_date TEXT,
            FOREIGN KEY (flat_id) REFERENCES flats (id),
            FOREIGN KEY (tenant_id) REFERENCES tenants (id)
        )`);

        // Rent_History
        db.run(`CREATE TABLE IF NOT EXISTS rent_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tenant_id INTEGER,
            base_rent REAL NOT NULL,
            heating REAL NOT NULL,
            maintenance REAL NOT NULL,
            date_from TEXT NOT NULL,
            date_to TEXT,
            FOREIGN KEY (tenant_id) REFERENCES tenants (id)
        )`);

        // Migration: Add date_to to rent_history if it doesn't exist
        db.run(`ALTER TABLE rent_history ADD COLUMN date_to TEXT`, (err) => {
            // Ignore error if column already exists
        });

        // Protocols
        db.run(`CREATE TABLE IF NOT EXISTS protocols (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            information TEXT NOT NULL,
            flat_id INTEGER,
            tenant_id INTEGER,
            FOREIGN KEY (flat_id) REFERENCES flats (id),
            FOREIGN KEY (tenant_id) REFERENCES tenants (id)
        )`);

        // Contractors
        db.run(`CREATE TABLE IF NOT EXISTS contractors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            specialty TEXT,
            phone TEXT,
            email TEXT,
            description TEXT
        )`);

        // Migration: Add description to contractors if it doesn't exist
        db.run(`ALTER TABLE contractors ADD COLUMN description TEXT`, (err) => {
            // Ignore error if column already exists
        });

        // Expenses
        db.run(`CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            flat_id INTEGER,
            building_id INTEGER,
            contractor_id INTEGER,
            frequency TEXT,
            payment_method TEXT,
            recurring_config TEXT,
            category_id INTEGER,
            billable INTEGER DEFAULT 0,
            FOREIGN KEY (flat_id) REFERENCES flats (id),
            FOREIGN KEY (building_id) REFERENCES buildings (id),
            FOREIGN KEY (contractor_id) REFERENCES contractors (id)
        )`);

        // Migration: Add title to expenses if it doesn't exist
        db.run(`ALTER TABLE expenses ADD COLUMN title TEXT`, (err) => {
            // Ignore error if column already exists
        });

        // Migration: Add recurring_config if it doesn't exist
        db.run(`ALTER TABLE expenses ADD COLUMN recurring_config TEXT`, (err) => {
            // Ignore error if column already exists
        });

        // Migration: Add billable if it doesn't exist
        db.run(`ALTER TABLE expenses ADD COLUMN billable INTEGER DEFAULT 0`, (err) => {
            // Ignore error if column already exists
        });

        // Expense Categories
        db.run(`CREATE TABLE IF NOT EXISTS expense_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )`, (err) => {
            if (!err) {
                const defaults = ["Betriebskosten", "Betriebsmittel", "Instandhaltung", "Kapitalkosten", "Sonstige Aufwendungen"];
                defaults.forEach(cat => {
                    db.run("INSERT OR IGNORE INTO expense_categories (name) VALUES (?)", [cat]);
                });
            }
        });

        // Migration: Add category_id to expenses if it doesn't exist
        db.run(`ALTER TABLE expenses ADD COLUMN category_id INTEGER`, (err) => {
            // Ignore error if column already exists
        });

        // Expense Price History
        db.run(`CREATE TABLE IF NOT EXISTS expense_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            expense_id INTEGER,
            amount REAL NOT NULL,
            date_from TEXT NOT NULL,
            date_to TEXT,
            FOREIGN KEY (expense_id) REFERENCES expenses (id)
        )`);

        // Migration: Add date_to to expense_history if it doesn't exist
        db.run(`ALTER TABLE expense_history ADD COLUMN date_to TEXT`, (err) => {
            // Ignore error if column already exists
        });

        // Annual Settlements
        db.run(`CREATE TABLE IF NOT EXISTS annual_settlements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            building_id INTEGER NOT NULL,
            year INTEGER NOT NULL,
            date TEXT,
            status TEXT DEFAULT 'Draft',
            FOREIGN KEY (building_id) REFERENCES buildings (id)
        )`);

        // Annual Settlement Expenses
        db.run(`CREATE TABLE IF NOT EXISTS annual_settlement_expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            settlement_id INTEGER NOT NULL,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            FOREIGN KEY (settlement_id) REFERENCES annual_settlements (id)
        )`);

        // Annual Settlement Flats
        db.run(`CREATE TABLE IF NOT EXISTS annual_settlement_flats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            settlement_id INTEGER NOT NULL,
            flat_id INTEGER NOT NULL,
            heating_bill REAL DEFAULT 0,
            FOREIGN KEY (settlement_id) REFERENCES annual_settlements (id),
            FOREIGN KEY (flat_id) REFERENCES flats (id)
        )`);

        // Settings (key-value store)
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )`);

        // File Attachments
        db.run(`CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type TEXT NOT NULL,
            entity_id INTEGER NOT NULL,
            original_name TEXT NOT NULL,
            stored_name TEXT NOT NULL,
            mimetype TEXT,
            size INTEGER,
            uploaded_at TEXT DEFAULT (datetime('now'))
        )`);

        console.log('Database tables initialized.');
    });
}

module.exports = db;
