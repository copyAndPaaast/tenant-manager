const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all contractors
router.get('/', (req, res) => {
    db.all("SELECT * FROM contractors", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET contractor by ID
router.get('/:id', (req, res) => {
    db.get("SELECT * FROM contractors WHERE id = ?", [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: "Contractor not found" });
        }
        res.json(row);
    });
});

// POST new contractor
router.post('/', (req, res) => {
    const { name, specialty, phone, email, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Contractor Name is required.' });
    }

    db.run(
        "INSERT INTO contractors (name, specialty, phone, email, description) VALUES (?, ?, ?, ?, ?)",
        [name, specialty, phone, email, description],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, name, specialty, phone, email, description });
        }
    );
});

// PUT update contractor
router.put('/:id', (req, res) => {
    const { name, specialty, phone, email, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Contractor Name is required.' });
    }

    db.run(
        "UPDATE contractors SET name = ?, specialty = ?, phone = ?, email = ?, description = ? WHERE id = ?",
        [name, specialty, phone, email, description, req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: req.params.id, name, specialty, phone, email, description });
        }
    );
});

module.exports = router;
