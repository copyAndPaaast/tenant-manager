const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get all tables
router.get('/tables', (req, res) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => r.name));
    });
});

// Get table schema
router.get('/tables/:name/schema', (req, res) => {
    db.all(`PRAGMA table_info(${req.params.name})`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get table data
router.get('/tables/:name/data', (req, res) => {
    if (/[^a-zA-Z0-9_]/.test(req.params.name)) return res.status(400).json({error: 'Invalid table name'});
    db.all(`SELECT * FROM ${req.params.name} ORDER BY id DESC LIMIT 500`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Delete multiple rows
router.post('/tables/:name/delete', (req, res) => {
    if (/[^a-zA-Z0-9_]/.test(req.params.name)) return res.status(400).json({error: 'Invalid table name'});
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({error: 'No ids provided'});
    
    // SQLite restricts DELETE ... IN (?) size, but for a simple UI, this is fine
    const placeholders = ids.map(() => '?').join(',');
    db.run(`DELETE FROM ${req.params.name} WHERE id IN (${placeholders})`, ids, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, deleted: this.changes });
    });
});

// Execute raw query
router.post('/query', (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'No query provided' });
    
    const isSelect = query.trim().toUpperCase().startsWith('SELECT') || query.trim().toUpperCase().startsWith('PRAGMA');
    
    if (isSelect) {
        db.all(query, [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ rows });
        });
    } else {
        db.run(query, [], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Query executed successfully', changes: this.changes, lastID: this.lastID });
        });
    }
});

module.exports = router;
