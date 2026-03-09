const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all buildings (with calculated flat sqm sum)
router.get('/', (req, res) => {
    const query = `
        SELECT b.*, 
        (SELECT SUM(square_meters) FROM flats f WHERE f.building_id = b.id) as flats_sqm_sum
        FROM buildings b
        ORDER BY b.address ASC
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET building by ID (with calculated flat sqm sum)
router.get('/:id', (req, res) => {
    const query = `
        SELECT b.*, 
        (SELECT SUM(square_meters) FROM flats f WHERE f.building_id = b.id) as flats_sqm_sum
        FROM buildings b
        WHERE b.id = ?
    `;
    db.get(query, [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: "Building not found" });
        }
        res.json(row);
    });
});

// POST new building
router.post('/', (req, res) => {
    const { address, description, total_square_meters } = req.body;

    if (!address) {
        return res.status(400).json({ error: 'Address is a required field.' });
    }

    db.run(
        "INSERT INTO buildings (address, description, total_square_meters) VALUES (?, ?, ?)",
        [address, description, total_square_meters],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, address, description, total_square_meters });
        }
    );
});

// PUT update building
router.put('/:id', (req, res) => {
    const { address, description, total_square_meters } = req.body;

    if (!address) {
        return res.status(400).json({ error: 'Address is a required field.' });
    }

    db.run(
        "UPDATE buildings SET address = ?, description = ?, total_square_meters = ? WHERE id = ?",
        [address, description, total_square_meters, req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: req.params.id, address, description, total_square_meters });
        }
    );
});

module.exports = router;
