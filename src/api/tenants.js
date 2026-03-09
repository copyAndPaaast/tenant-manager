const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all tenants
router.get('/', (req, res) => {
    db.all("SELECT * FROM tenants", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET tenant by ID
router.get('/:id', (req, res) => {
    db.get("SELECT * FROM tenants WHERE id = ?", [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: "Tenant not found" });
        }
        res.json(row);
    });
});

// POST new tenant
router.post('/', (req, res) => {
    const { first_name, last_name, email, phone, iban, bic, bank_name, account_holder, deposit_amount, deposit_date, deposit_notes } = req.body;

    if (!first_name || !last_name) {
        return res.status(400).json({ error: 'First Name and Last Name are required.' });
    }

    db.run(
        "INSERT INTO tenants (first_name, last_name, email, phone, iban, bic, bank_name, account_holder, deposit_amount, deposit_date, deposit_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [first_name, last_name, email, phone, iban, bic, bank_name, account_holder, deposit_amount, deposit_date, deposit_notes],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, first_name, last_name, email, phone, iban, bic, bank_name, account_holder, deposit_amount, deposit_date, deposit_notes });
        }
    );
});

// PUT update tenant
router.put('/:id', (req, res) => {
    const { first_name, last_name, email, phone, iban, bic, bank_name, account_holder, deposit_amount, deposit_date, deposit_notes } = req.body;

    if (!first_name || !last_name) {
        return res.status(400).json({ error: 'First Name and Last Name are required.' });
    }

    db.run(
        "UPDATE tenants SET first_name = ?, last_name = ?, email = ?, phone = ?, iban = ?, bic = ?, bank_name = ?, account_holder = ?, deposit_amount = ?, deposit_date = ?, deposit_notes = ? WHERE id = ?",
        [first_name, last_name, email, phone, iban, bic, bank_name, account_holder, deposit_amount, deposit_date, deposit_notes, req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: req.params.id, first_name, last_name, email, phone, iban, bic, bank_name, account_holder, deposit_amount, deposit_date, deposit_notes });
        }
    );
});

module.exports = router;
