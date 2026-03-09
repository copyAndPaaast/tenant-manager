const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const xlsx = require('xlsx');

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const excelPath = path.join(__dirname, 'Ausgaben.xlsx');

const db = new sqlite3.Database(dbPath);

const workbook = xlsx.readFile(excelPath, { cellDates: true });
const ausgaben = xlsx.utils.sheet_to_json(workbook.Sheets['Ausgaben']);
const preise = xlsx.utils.sheet_to_json(workbook.Sheets['Preise']);

db.serialize(() => {
    // Clear existing to avoid duplicates
    db.run("DELETE FROM expense_history");
    db.run("DELETE FROM expenses");

    const stmt = db.prepare(`
        INSERT INTO expenses (
            title, description, amount, date, frequency, payment_method, 
            billable, category_id, recurring_config
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let count = 0;

    for (const row of ausgaben) {
        const ausgabenId = row['ID'];
        const title = row['Titel'];
        const Bezugsjahr = row['Bezugsjahr'];
        const isOneTime = row['Einmalige Ausgabe'];
        const faelligkeitRaw = row['Faelligkeit'];
        const description = row['Beschreibung'];
        const intervallVal = parseInt(row['Intervall']);
        const categoryId = parseInt(row['Kostenart']);

        // Find associated past prices
        const historyRows = preise.filter(p => p['Ausgaben_ID'] === ausgabenId);
        // Sort history by 'Von' date if available loosely
        historyRows.sort((a, b) => {
            const dA = a.Von ? new Date(a.Von) : new Date(0);
            const dB = b.Von ? new Date(b.Von) : new Date(0);
            return dA - dB;
        });

        // Determine Amount
        let amount = 0;
        if (historyRows.length > 0) {
            // Get the last known price
            amount = historyRows[historyRows.length - 1].Betrag || 0;
        } else {
            // Fallback Amount detection from text description or title if none provided in 'Preise'
            const textToSearch = ((description || '') + ' ' + (title || ''));
            const match = textToSearch.match(/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}|\b\d{1,3}(?:\.\d{3})+\b|\b\d+\b\s*€)/);
            if (match) {
                let raw = match[1].replace(/€/, '').trim();
                if (raw.includes(',')) {
                    raw = raw.replace(/\./g, '').replace(',', '.');
                } else if (raw.includes('.')) {
                    raw = raw.replace(/\./g, '');
                }
                amount = parseFloat(raw);
            }
        }

        // Parse Date
        let date = '2026-01-01';
        let day_of_month = 1;
        if (faelligkeitRaw) {
            if (faelligkeitRaw instanceof Date) {
                date = faelligkeitRaw.toISOString().split('T')[0];
                day_of_month = faelligkeitRaw.getDate();
            } else {
                const parts = String(faelligkeitRaw).split('.');
                if (parts.length === 3) {
                    date = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    day_of_month = parseInt(parts[0], 10);
                } else {
                    date = String(faelligkeitRaw);
                }
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
                if (historyRows.length > 0) {
                    historyRows.forEach(h => {
                        let hDateFrom = date;
                        let hDateTo = null;

                        if (h.Von instanceof Date) hDateFrom = h.Von.toISOString().split('T')[0];
                        if (h.Bis instanceof Date) hDateTo = h.Bis.toISOString().split('T')[0];

                        db.run(`INSERT INTO expense_history (expense_id, amount, date_from, date_to) VALUES (?, ?, ?, ?)`,
                            [expenseId, h.Betrag || 0, hDateFrom, hDateTo]);
                    });
                } else {
                    db.run(`INSERT INTO expense_history (expense_id, amount, date_from, date_to) VALUES (?, ?, ?, ?)`, [expenseId, amount, date, null]);
                }
            } else {
                console.error(err);
            }
        });
        count++;
    }

    stmt.finalize();
    console.log(`Dispatched ${count} expenses from Excel for import.`);
});

// Close db later otherwise async ops fail
setTimeout(() => db.close(), 1500);
