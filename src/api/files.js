const express = require('express');
const router = express.Router();
const db = require('../db/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Multer writes to a flat temp area first; we move the file after resolving the entity name
const upload = multer({ dest: path.join(UPLOAD_DIR, 'tmp') });

// Turns any string into a safe folder/file name component
function sanitize(str) {
    return (str || 'unknown')
        .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe')
        .replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 60) || 'unknown';
}

// Look up a human-readable label for the entity to use as subfolder name
function getEntityLabel(entityType, entityId) {
    return new Promise((resolve) => {
        const queries = {
            tenant:     { table: 'tenants',            expr: "first_name || '_' || last_name" },
            building:   { table: 'buildings',           expr: 'address' },
            flat:       { table: 'flats',               expr: 'name_number' },
            expense:    { table: 'expenses',            expr: "COALESCE(title, description)" },
            contractor: { table: 'contractors',         expr: 'name' },
            settlement: { table: 'annual_settlements',  expr: "CAST(year AS TEXT)" },
        };
        const q = queries[entityType];
        if (!q) return resolve(`id_${entityId}`);
        db.get(`SELECT ${q.expr} AS label FROM ${q.table} WHERE id = ?`, [entityId], (err, row) => {
            resolve(err || !row ? `id_${entityId}` : sanitize(row.label));
        });
    });
}

// GET files for an entity
router.get('/', (req, res) => {
    const { entity_type, entity_id } = req.query;
    if (!entity_type || !entity_id) {
        return res.status(400).json({ error: 'entity_type and entity_id are required' });
    }
    db.all(
        'SELECT * FROM files WHERE entity_type = ? AND entity_id = ? ORDER BY uploaded_at DESC',
        [entity_type, entity_id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows || []);
        }
    );
});

// POST upload
router.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { entity_type, entity_id } = req.body;
    const { originalname, mimetype, size, path: tmpPath } = req.file;

    // Build structured target path: uploads/{type}s/{entity_label}/{date}_{original_name}
    const entityLabel = await getEntityLabel(entity_type, entity_id);
    const typeFolder = entity_type + 's';
    const subDir = path.join(UPLOAD_DIR, typeFolder, entityLabel);
    fs.mkdirSync(subDir, { recursive: true });

    const datePrefix = new Date().toISOString().slice(0, 10); // 2026-03-09
    const ext = path.extname(originalname);
    const base = sanitize(path.basename(originalname, ext));
    const storedFilename = `${datePrefix}_${base}${ext}`;

    // Handle name collisions by appending a counter
    let finalFilename = storedFilename;
    let counter = 1;
    while (fs.existsSync(path.join(subDir, finalFilename))) {
        finalFilename = `${datePrefix}_${base}_${counter}${ext}`;
        counter++;
    }

    const finalPath = path.join(subDir, finalFilename);
    fs.renameSync(tmpPath, finalPath);

    // stored_name is a relative path from UPLOAD_DIR so download/delete stays simple
    const storedName = path.join(typeFolder, entityLabel, finalFilename);

    db.run(
        'INSERT INTO files (entity_type, entity_id, original_name, stored_name, mimetype, size) VALUES (?, ?, ?, ?, ?, ?)',
        [entity_type, entity_id, originalname, storedName, mimetype, size],
        function (err) {
            if (err) {
                fs.unlink(finalPath, () => {});
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
                id: this.lastID,
                entity_type,
                entity_id,
                original_name: originalname,
                stored_name: storedName,
                mimetype,
                size
            });
        }
    );
});

// GET download
router.get('/:id/download', (req, res) => {
    db.get('SELECT * FROM files WHERE id = ?', [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'File not found' });
        const filePath = path.join(UPLOAD_DIR, row.stored_name);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on disk' });
        res.download(filePath, row.original_name);
    });
});

// DELETE
router.delete('/:id', (req, res) => {
    db.get('SELECT * FROM files WHERE id = ?', [req.params.id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'File not found' });
        const filePath = path.join(UPLOAD_DIR, row.stored_name);
        fs.unlink(filePath, () => {});
        db.run('DELETE FROM files WHERE id = ?', [req.params.id], (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            res.json({ success: true });
        });
    });
});

module.exports = router;
