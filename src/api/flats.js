const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET all flats (with optional query filter)
router.get('/', (req, res) => {
    let query = "SELECT * FROM flats";
    let params = [];

    if (req.query.building_id) {
        query += " WHERE building_id = ?";
        params.push(req.query.building_id);
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// GET flat by ID
router.get('/:id', (req, res) => {
    db.get("SELECT * FROM flats WHERE id = ?", [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: "Flat not found" });
        }
        res.json(row);
    });
});

// POST new flat
router.post('/', (req, res) => {
    const { building_id, name_number, location_in_building, square_meters, description } = req.body;

    if (!building_id || !name_number) {
        return res.status(400).json({ error: 'Building ID and Name/Number are required.' });
    }

    db.run(
        "INSERT INTO flats (building_id, name_number, location_in_building, square_meters, description) VALUES (?, ?, ?, ?, ?)",
        [building_id, name_number, location_in_building, square_meters, description],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, building_id, name_number, location_in_building, square_meters, description });
        }
    );
});

// PUT update flat
router.put('/:id', (req, res) => {
    const { building_id, name_number, location_in_building, square_meters, description } = req.body;

    if (!building_id || !name_number) {
        return res.status(400).json({ error: 'Building ID and Name/Number are required.' });
    }

    db.run(
        "UPDATE flats SET building_id = ?, name_number = ?, location_in_building = ?, square_meters = ?, description = ? WHERE id = ?",
        [building_id, name_number, location_in_building, square_meters, description, req.params.id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: req.params.id, building_id, name_number, location_in_building, square_meters, description });
        }
    );
});

module.exports = router;
