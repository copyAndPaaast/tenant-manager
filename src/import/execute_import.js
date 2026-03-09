const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const csvPath = path.join(__dirname, 'Ausgaben.csv');

const db = new sqlite3.Database(dbPath);

function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];
        if (char === '"') {
            if (inQuotes && nextChar === '"') { currentField += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (char === ';' && !inQuotes) { currentRow.push(currentField.trim()); currentField = ''; }
        else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (currentField || currentRow.length > 0) {
                currentRow.push(currentField.trim());
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
            }
            if (char === '\r' && nextChar === '\n') { i++; }
        } else { currentField += char; }
    }
    if (currentField || currentRow.length > 0) { currentRow.push(currentField.trim()); rows.push(currentRow); }
    return rows;
}

const content = fs.readFileSync(csvPath, 'utf-8');
const rows = parseCSV(content);
const data = rows.slice(1);

db.serialize(() => {
    // Clear existing expenses before re-importing to avoid duplicates with wrong format
    db.run("DELETE FROM expense_history");
    db.run("DELETE FROM expenses");

    const stmt = db.prepare(`
        INSERT INTO expenses (
            title, description, amount, date, frequency, payment_method, 
            billable, category_id, recurring_config
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // We'll prepare another statement for history, but we need the inserted expense id
    // which this sqlite3 driver provides as `this.lastID` when using `.run(..., callback)`.

    let count = 0;
    data.forEach(row => {
        const title = row[1];
        const Bezugsjahr = row[2];
        const isOneTime = row[3] === 'TRUE';
        const faelligkeit = row[4];
        const description = row[5];
        const intervallVal = parseInt(row[6]);
        const categoryId = parseInt(row[7]);

        // Amount detection (try to catch 113,89 or 11.999 €)
        let amount = 0;
        const textToSearch = (description + ' ' + title);
        const match = textToSearch.match(/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}|\b\d{1,3}(?:\.\d{3})+\b|\b\d+\b\s*€)/);
        if (match) {
            let raw = match[1].replace(/€/, '').trim();
            if (raw.includes(',')) {
                raw = raw.replace(/\./g, '').replace(',', '.');
            } else if (raw.includes('.')) {
                // e.g. 11.999 -> 11999
                raw = raw.replace(/\./g, '');
            }
            amount = parseFloat(raw);
        }

        // Parse Date
        let date = '2026-01-01';
        let day_of_month = 1;
        if (faelligkeit) {
            const parts = faelligkeit.split('.');
            if (parts.length === 3) {
                date = `${parts[2]}-${parts[1]}-${parts[0]}`;
                day_of_month = parseInt(parts[0], 10);
            } else {
                date = faelligkeit;
            }
        } else if (Bezugsjahr && Bezugsjahr !== 'Alle') {
            date = `${Bezugsjahr}-01-01`;
        }

        // Frequency mapping
        let frequency = isOneTime ? 'One-time' : 'Monthly';
        if (!isOneTime && !isNaN(intervallVal)) {
            if (intervallVal === 1) frequency = 'Monthly';
            else if (intervallVal === 2) frequency = 'Yearly';
            else if (intervallVal === 3) frequency = 'Quarterly';
            else if (intervallVal === 4) frequency = 'Half-yearly';
            else if (intervallVal > 4) frequency = 'Yearly';
        }

        const billable = (categoryId === 1 || categoryId === 2) ? 1 : 0;

        let recurring_config = null;
        if (!isOneTime) {
            recurring_config = JSON.stringify({ day_of_month });
        }

        stmt.run([
            title || 'Unnamed Expense',
            description || '',
            amount,
            date,
            frequency,
            'Manual',
            billable,
            isNaN(categoryId) ? null : categoryId,
            recurring_config
        ], function (err) {
            if (!err) {
                const expenseId = this.lastID;
                db.run(`INSERT INTO expense_history (expense_id, amount, date_from) VALUES (?, ?, ?)`, [expenseId, amount, date]);
            }
        });
        count++;
    });

    stmt.finalize();
    console.log(`Dispatched ${count} expenses for import.`);
});

// Close db later otherwise async ops fail
setTimeout(() => db.close(), 1000);
