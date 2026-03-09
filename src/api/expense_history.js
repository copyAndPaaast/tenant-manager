const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET history by expense_id
router.get('/', (req, res) => {
    let query = "SELECT * FROM expense_history";
    let params = [];

    if (req.query.expense_id) {
        query += " WHERE expense_id = ?";
        params.push(req.query.expense_id);
    }
    query += " ORDER BY date_from DESC";

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET single entry
router.get('/:id', (req, res) => {
    db.get("SELECT * FROM expense_history WHERE id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Entry not found" });
        res.json(row);
    });
});

// POST new entry
router.post('/', (req, res) => {
    const { expense_id, amount, date_from, date_to } = req.body;

    if (!expense_id || amount == null || !date_from) {
        return res.status(400).json({ error: 'Expense ID, Amount, and Date from are required.' });
    }

    db.run(
        "INSERT INTO expense_history (expense_id, amount, date_from, date_to) VALUES (?, ?, ?, ?)",
        [expense_id, amount, date_from, date_to || null],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, expense_id, amount, date_from, date_to: date_to || null });
        }
    );
});

// PUT update entry
router.put('/:id', (req, res) => {
    const { amount, date_from, date_to } = req.body;

    if (amount == null || !date_from) {
        return res.status(400).json({ error: 'Amount and Date from are required.' });
    }

    db.run(
        "UPDATE expense_history SET amount = ?, date_from = ?, date_to = ? WHERE id = ?",
        [amount, date_from, date_to || null, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Entry updated successfully" });
        }
    );
});

// DELETE entry
router.delete('/:id', (req, res) => {
    db.run("DELETE FROM expense_history WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Entry deleted successfully" });
    });
});

module.exports = router;
