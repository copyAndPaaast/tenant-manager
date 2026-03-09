const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all expenses (with optional query filters)
router.get('/', (req, res) => {
    let query = "SELECT * FROM expenses";
    let params = [];
    let conditions = [];

    if (req.query.flat_id) {
        conditions.push("flat_id = ?");
        params.push(req.query.flat_id);
    }
    if (req.query.building_id) {
        conditions.push("building_id = ?");
        params.push(req.query.building_id);
    }
    if (req.query.contractor_id) {
        conditions.push("contractor_id = ?");
        params.push(req.query.contractor_id);
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY date DESC";

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET expense by ID
router.get('/:id', (req, res) => {
    db.get("SELECT * FROM expenses WHERE id = ?", [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: "Expense not found" });
        }
        res.json(row);
    });
});

// POST new expense
router.post('/', (req, res) => {
    const { title, description, amount, date, flat_id, building_id, contractor_id, frequency, payment_method, recurring_config, billable, category_id } = req.body;

    if (!description || !amount || !date) {
        return res.status(400).json({ error: 'Description, amount, and date are required.' });
    }

    db.run(
        "INSERT INTO expenses (title, description, amount, date, flat_id, building_id, contractor_id, frequency, payment_method, recurring_config, billable, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [title, description, amount, date, flat_id, building_id, contractor_id, frequency, payment_method, recurring_config, billable ? 1 : 0, category_id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, title, description, amount, date, flat_id, building_id, contractor_id, frequency, payment_method, recurring_config, billable: billable ? 1 : 0, category_id });
        }
    );
});

// PUT update expense
router.put('/:id', (req, res) => {
    const { title, description, amount, date, flat_id, building_id, contractor_id, frequency, payment_method, recurring_config, billable, category_id } = req.body;

    if (!description || !amount || !date) {
        return res.status(400).json({ error: 'Description, amount, and date are required.' });
    }

    db.run(
        "UPDATE expenses SET title = ?, description = ?, amount = ?, date = ?, flat_id = ?, building_id = ?, contractor_id = ?, frequency = ?, payment_method = ?, recurring_config = ?, billable = ?, category_id = ? WHERE id = ?",
        [title, description, amount, date, flat_id, building_id, contractor_id, frequency, payment_method, recurring_config, billable ? 1 : 0, category_id, req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: req.params.id, title, description, amount, date, flat_id, building_id, contractor_id, frequency, payment_method, recurring_config, billable: billable ? 1 : 0, category_id });
        }
    );
});

module.exports = router;
