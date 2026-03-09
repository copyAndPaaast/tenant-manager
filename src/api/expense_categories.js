const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all categories
router.get('/', (req, res) => {
    db.all("SELECT * FROM expense_categories ORDER BY name", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST new category
router.post('/', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    db.run("INSERT INTO expense_categories (name) VALUES (?)", [name], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, name });
    });
});

// DELETE category
router.delete('/:id', (req, res) => {
    db.run("DELETE FROM expense_categories WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

module.exports = router;
