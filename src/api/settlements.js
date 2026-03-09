const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get all settlements for a building
router.get('/building/:buildingId', (req, res) => {
    const buildingId = req.params.buildingId;
    db.all('SELECT * FROM annual_settlements WHERE building_id = ? ORDER BY year DESC', [buildingId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ data: rows });
    });
});

// Get a single settlement with its expenses
router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.get('SELECT * FROM annual_settlements WHERE id = ?', [id], (err, settlement) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!settlement) {
            return res.status(404).json({ error: 'Settlement not found' });
        }

        db.all('SELECT * FROM annual_settlement_expenses WHERE settlement_id = ?', [id], (err, expenses) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            db.all('SELECT * FROM annual_settlement_flats WHERE settlement_id = ?', [id], (err, flats) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ data: { ...settlement, expenses, flats } });
            });
        });
    });
});

// Create a new settlement with expenses
router.post('/', (req, res) => {
    const { building_id, year, date, status, expenses, flats } = req.body;
    db.serialize(() => {
        db.run(
            'INSERT INTO annual_settlements (building_id, year, date, status) VALUES (?, ?, ?, ?)',
            [building_id, year, date || new Date().toISOString().split('T')[0], status || 'Draft'],
            function (err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                const settlementId = this.lastID;

                const finishInsert = () => {
                    if (flats && flats.length > 0) {
                        const stmt2 = db.prepare('INSERT INTO annual_settlement_flats (settlement_id, flat_id, heating_bill) VALUES (?, ?, ?)');
                        flats.forEach(f => {
                            stmt2.run(settlementId, f.flat_id, f.heating_bill || 0);
                        });
                        stmt2.finalize((err) => {
                            if (err) return res.status(500).json({ error: err.message });
                            res.json({ message: 'success', data: { id: settlementId } });
                        });
                    } else {
                        res.json({ message: 'success', data: { id: settlementId } });
                    }
                };

                if (expenses && expenses.length > 0) {
                    const stmt = db.prepare('INSERT INTO annual_settlement_expenses (settlement_id, description, amount) VALUES (?, ?, ?)');
                    expenses.forEach(exp => {
                        stmt.run(settlementId, exp.description, exp.amount);
                    });
                    stmt.finalize((err) => {
                        if (err) return res.status(500).json({ error: err.message });
                        finishInsert();
                    });
                } else {
                    finishInsert();
                }
            }
        );
    });
});

// Update a settlement and its expenses
router.put('/:id', (req, res) => {
    const settlementId = req.params.id;
    const { year, date, status, expenses, flats } = req.body;

    db.serialize(() => {
        db.run(
            'UPDATE annual_settlements SET year = ?, date = ?, status = ? WHERE id = ?',
            [year, date, status, settlementId],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });

                // Delete old expenses
                db.run('DELETE FROM annual_settlement_expenses WHERE settlement_id = ?', [settlementId], (err) => {
                    if (err) return res.status(500).json({ error: err.message });

                    const finishUpdate = () => {
                        db.run('DELETE FROM annual_settlement_flats WHERE settlement_id = ?', [settlementId], (err) => {
                            if (err) return res.status(500).json({ error: err.message });

                            if (flats && flats.length > 0) {
                                const stmt2 = db.prepare('INSERT INTO annual_settlement_flats (settlement_id, flat_id, heating_bill) VALUES (?, ?, ?)');
                                flats.forEach(f => {
                                    stmt2.run(settlementId, f.flat_id, f.heating_bill || 0);
                                });
                                stmt2.finalize((err) => {
                                    if (err) return res.status(500).json({ error: err.message });
                                    res.json({ message: 'success' });
                                });
                            } else {
                                res.json({ message: 'success' });
                            }
                        });
                    };

                    // Insert new expenses
                    if (expenses && expenses.length > 0) {
                        const stmt = db.prepare('INSERT INTO annual_settlement_expenses (settlement_id, description, amount) VALUES (?, ?, ?)');
                        expenses.forEach(exp => {
                            stmt.run(settlementId, exp.description, exp.amount);
                        });
                        stmt.finalize((err) => {
                            if (err) return res.status(500).json({ error: err.message });
                            finishUpdate();
                        });
                    } else {
                        finishUpdate();
                    }
                });
            }
        );
    });
});

// Delete a settlement
router.delete('/:id', (req, res) => {
    const settlementId = req.params.id;
    db.serialize(() => {
        db.run('DELETE FROM annual_settlement_flats WHERE settlement_id = ?', [settlementId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            db.run('DELETE FROM annual_settlement_expenses WHERE settlement_id = ?', [settlementId], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                db.run('DELETE FROM annual_settlements WHERE id = ?', [settlementId], function (err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: 'deleted', changes: this.changes });
                });
            });
        });
    });
});

module.exports = router;
