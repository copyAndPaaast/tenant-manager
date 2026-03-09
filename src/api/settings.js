const express = require('express');
const router = express.Router();
const db = require('../db/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
const SETTINGS_DIR = path.join(UPLOAD_DIR, 'settings');
if (!fs.existsSync(SETTINGS_DIR)) fs.mkdirSync(SETTINGS_DIR, { recursive: true });

// Logo upload: keep whatever extension the user uploads, always named "logo.*"
const logoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, SETTINGS_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'logo' + ext);
    }
});
const uploadLogo = multer({
    storage: logoStorage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'));
        }
        cb(null, true);
    }
});

// GET a single setting
router.get('/:key', (req, res) => {
    db.get('SELECT value FROM settings WHERE key = ?', [req.params.key], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ key: req.params.key, value: row ? row.value : null });
    });
});

// POST logo upload — deletes any previous logo file first
router.post('/logo', uploadLogo.single('logo'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const logoUrl = `/uploads/settings/${req.file.filename}`;

    // Remove old logo files with a different extension
    fs.readdirSync(SETTINGS_DIR).forEach(f => {
        if (f.startsWith('logo.') && f !== req.file.filename) {
            fs.unlink(path.join(SETTINGS_DIR, f), () => {});
        }
    });

    db.run(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        ['logo', logoUrl],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ key: 'logo', value: logoUrl });
        }
    );
});

// DELETE logo
router.delete('/logo', (req, res) => {
    fs.readdirSync(SETTINGS_DIR).forEach(f => {
        if (f.startsWith('logo.')) fs.unlink(path.join(SETTINGS_DIR, f), () => {});
    });
    db.run('DELETE FROM settings WHERE key = ?', ['logo'], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

module.exports = router;
