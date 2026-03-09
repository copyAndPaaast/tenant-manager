const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all rent histories (with optional query filter)
router.get('/', (req, res) => {
    let query = "SELECT * FROM rent_history";
    let params = [];

    if (req.query.tenant_id) {
        query += " WHERE tenant_id = ?";
        params.push(req.query.tenant_id);
    }

    query += " ORDER BY date_from DESC";

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET rent history by ID
router.get('/:id', (req, res) => {
    db.get("SELECT * FROM rent_history WHERE id = ?", [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: "Rent history not found" });
        }
        res.json(row);
    });
});

// POST new rent history
router.post('/', (req, res) => {
    const { tenant_id, base_rent, heating, maintenance, date_from, date_to } = req.body;
    db.run(
        "INSERT INTO rent_history (tenant_id, base_rent, heating, maintenance, date_from, date_to) VALUES (?, ?, ?, ?, ?, ?)",
        [tenant_id, base_rent, heating, maintenance, date_from, date_to || null],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, tenant_id, base_rent, heating, maintenance, date_from, date_to });
        }
    );
});

// PUT update rent history
router.put('/:id', (req, res) => {
    const { tenant_id, base_rent, heating, maintenance, date_from, date_to } = req.body;
    db.run(
        "UPDATE rent_history SET tenant_id = ?, base_rent = ?, heating = ?, maintenance = ?, date_from = ?, date_to = ? WHERE id = ?",
        [tenant_id, base_rent, heating, maintenance, date_from, date_to || null, req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: req.params.id, tenant_id, base_rent, heating, maintenance, date_from, date_to });
        }
    );
});

// DELETE rent history
router.delete('/:id', (req, res) => {
    db.run("DELETE FROM rent_history WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Rent history deleted successfully" });
    });
});

module.exports = router;
