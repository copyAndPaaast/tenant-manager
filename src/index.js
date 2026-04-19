const express = require('express');
const path = require('path');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, '../public')));

// Basic API check
app.get('/api/status', (req, res) => {
    res.json({ status: 'ok', message: 'API is running' });
});

// API Routes
app.use('/api/buildings', require('./api/buildings'));
app.use('/api/flats', require('./api/flats'));
app.use('/api/tenants', require('./api/tenants'));
app.use('/api/contractors', require('./api/contractors'));
app.use('/api/expenses', require('./api/expenses'));
app.use('/api/leases', require('./api/leases'));
app.use('/api/rent_history', require('./api/rent_history'));
app.use('/api/protocols', require('./api/protocols'));
app.use('/api/expense_history', require('./api/expense_history'));
app.use('/api/expense_categories', require('./api/expense_categories'));
app.use('/api/settlements', require('./api/settlements'));
app.use('/api/files', require('./api/files'));
app.use('/api/database', require('./api/database'));
app.use('/api/settings', require('./api/settings'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// SPA Fallback: serve index.html for any other GET requests not handled by API
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    } else {
        next();
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
