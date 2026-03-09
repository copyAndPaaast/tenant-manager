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
            if (inQuotes && nextChar === '"') {
                currentField += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ';' && !inQuotes) {
            currentRow.push(currentField.trim());
            currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (currentField || currentRow.length > 0) {
                currentRow.push(currentField.trim());
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
            }
            if (char === '\r' && nextChar === '\n') {
                i++;
            }
        } else {
            currentField += char;
        }
    }
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }
    return rows;
}

const rows = parseCSV(content);
const header = rows[0];
const data = rows.slice(1);

const results = {
    totalRecords: data.length,
    withAmount: 0,
    billable: 0,
    recurring: 0,
    byCategory: {},
    potentialImports: []
};

data.forEach(row => {
    const id = row[0];
    const title = row[1];
    const Bezugsjahr = row[2];
    const isOneTime = row[3] === 'TRUE';
    const faelligkeit = row[4];
    const description = row[5];
    const intervall = row[6];
    const categoryId = row[7];
    const lieferant = row[9];

    // Look for amount in description or title
    let amount = null;
    const amountRegex = /(\d+[\.,]\d{2})\s*€/;
    const match = (description + ' ' + title).match(amountRegex);
    if (match) {
        amount = parseFloat(match[1].replace(',', '.'));
    }

    if (amount !== null) {
        results.withAmount++;
    }

    if (categoryId === '1' || categoryId === '2') {
        results.billable++;
    }

    if (!isOneTime) {
        results.recurring++;
    }

    if (categoryId) {
        results.byCategory[categoryId] = (results.byCategory[categoryId] || 0) + 1;
    }

    // Determine if it's "importable"
    // Criteria: has title and category. Amount is ideal but maybe we can import as $0 or manual.
    if (title || description) {
        results.potentialImports.push({
            id,
            title,
            amount,
            categoryId,
            isOneTime,
            billable: (categoryId === '1' || categoryId === '2') ? 1 : 0
        });
    }
});

console.log('Import Assessment:');
console.log('Total entries found:', results.totalRecords);
console.log('Entries with detectable amount (€):', results.withAmount);
console.log('Entries that will be Billable (Cat 1/2):', results.billable);
console.log('Recurring expenses:', results.recurring);
console.log('Breakdown by Category:', results.byCategory);

console.log('\nSample of detectable imports:');
console.log(results.potentialImports.filter(pi => pi.amount !== null).slice(0, 5));
