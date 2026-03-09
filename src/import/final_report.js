const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'Ausgaben.csv');
const content = fs.readFileSync(csvPath, 'utf-8');

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

const rows = parseCSV(content);
const data = rows.slice(1);

const categoryMap = {
    '1': 'Betriebskosten',
    '2': 'Betriebsmittel',
    '3': 'Instandhaltung',
    '4': 'Kapitalkosten',
    '5': 'Sonstige Aufwendungen'
};

const importable = data.map(row => {
    const title = row[1];
    const Bezugsjahr = row[2];
    const isOneTime = row[3] === 'TRUE';
    const faelligkeit = row[4];
    const description = row[5];
    const categoryId = row[7];

    // Better amount detection
    // Handles XX,XX €, XX.XX €, X.XXX,XX €
    const amountRegex = /([\d\.]+[\s,]\d{2})\s*€|(\d+[\.]\d{3})\s*€/;
    const textToSearch = (description + ' ' + title);
    const match = textToSearch.match(amountRegex);
    let amount = 0;
    if (match) {
        let raw = match[1] || match[2];
        // Clean up German formatting
        raw = raw.replace(/\./g, ''); // Remove thousand separators
        raw = raw.replace(',', '.');   // Convert comma to decimal
        amount = parseFloat(raw);
    }

    return {
        title: title || 'Unnamed Expense',
        amount: amount || 0,
        category: categoryMap[categoryId] || 'Unknown',
        billable: (categoryId === '1' || categoryId === '2') ? 'Yes' : 'No',
        frequency: isOneTime ? 'One-time' : 'Recurring',
        dateInferred: faelligkeit || (Bezugsjahr !== 'Alle' ? `${Bezugsjahr}-01-01` : '2026-01-01')
    };
});

console.log('| Title | Category | Billable | Freq | Amount | Date |');
console.log('|-------|----------|----------|------|--------|------|');
importable.slice(0, 20).forEach(item => {
    console.log(`| ${item.title.substring(0, 30)} | ${item.category} | ${item.billable} | ${item.frequency.substring(0, 1)} | ${item.amount.toFixed(2)} | ${item.dateInferred} |`);
});

console.log('\n... and ' + (importable.length - 20) + ' more records.');
