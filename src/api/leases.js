const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all leases (with optional query filters)
router.get('/', (req, res) => {
    let query = "SELECT * FROM leases";
    let params = [];
    let conditions = [];

    if (req.query.flat_id) {
        conditions.push("flat_id = ?");
        params.push(req.query.flat_id);
    }
    if (req.query.tenant_id) {
        conditions.push("tenant_id = ?");
        params.push(req.query.tenant_id);
    }

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY move_in_date DESC";

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET lease by ID
router.get('/:id', (req, res) => {
    db.get("SELECT * FROM leases WHERE id = ?", [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: "Lease not found" });
        }
        res.json(row);
    });
});

// POST new lease
router.post('/', (req, res) => {
    const { flat_id, tenant_id, move_in_date, move_out_date } = req.body;
    db.run(
        "INSERT INTO leases (flat_id, tenant_id, move_in_date, move_out_date) VALUES (?, ?, ?, ?)",
        [flat_id, tenant_id, move_in_date, move_out_date],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, flat_id, tenant_id, move_in_date, move_out_date });
        }
    );
});

// PUT update lease
router.put('/:id', (req, res) => {
    const { flat_id, tenant_id, move_in_date, move_out_date } = req.body;
    db.run(
        "UPDATE leases SET flat_id = ?, tenant_id = ?, move_in_date = ?, move_out_date = ? WHERE id = ?",
        [flat_id, tenant_id, move_in_date, move_out_date, req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: req.params.id, flat_id, tenant_id, move_in_date, move_out_date });
        }
    );
});

// DELETE lease
router.delete('/:id', (req, res) => {
    db.run("DELETE FROM leases WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Lease deleted successfully" });
    });
});

module.exports = router;
