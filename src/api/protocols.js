const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all protocols (with optional query filters)
router.get('/', (req, res) => {
    let query = "SELECT * FROM protocols";
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

    query += " ORDER BY date DESC";

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET protocol by ID
router.get('/:id', (req, res) => {
    db.get("SELECT * FROM protocols WHERE id = ?", [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: "Protocol not found" });
        }
        res.json(row);
    });
});

// POST new protocol
router.post('/', (req, res) => {
    const { date, information, flat_id, tenant_id } = req.body;
    db.run(
        "INSERT INTO protocols (date, information, flat_id, tenant_id) VALUES (?, ?, ?, ?)",
        [date, information, flat_id, tenant_id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, date, information, flat_id, tenant_id });
        }
    );
});

// PUT update protocol
router.put('/:id', (req, res) => {
    const { date, information, flat_id, tenant_id } = req.body;
    db.run(
        "UPDATE protocols SET date = ?, information = ?, flat_id = ?, tenant_id = ? WHERE id = ?",
        [date, information, flat_id, tenant_id, req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: req.params.id, date, information, flat_id, tenant_id });
        }
    );
});

// DELETE protocol
router.delete('/:id', (req, res) => {
    db.run("DELETE FROM protocols WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Protocol deleted successfully" });
    });
});

module.exports = router;
