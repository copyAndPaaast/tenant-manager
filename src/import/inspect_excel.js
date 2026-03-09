const xlsx = require('xlsx');

const workbook = xlsx.readFile(__dirname + '/Ausgaben.xlsx');
console.log('Sheet Names:', workbook.SheetNames);

for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    console.log(`\n--- Sheet: ${sheetName} ---`);
    console.log('Headers:', json[0]);
    if (json.length > 1) {
        console.log('Row 1:', json[1]);
    }
}
