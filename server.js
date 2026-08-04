const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Initialize SQLite Database
const dbFile = path.join(__dirname, 'attendance.db');
const db = new sqlite3.Database(dbFile, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS attendance (
            pc_number INTEGER PRIMARY KEY,
            student_id TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_STAMP
        )`);
    }
});

// Get all attendance records
app.get('/api/attendance', (req, res) => {
    db.all(`SELECT * FROM attendance`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Handle individual PC check-in
app.post('/api/checkin', (req, res) => {
    const { pcNumber, studentId } = req.body;

    if (!pcNumber || !studentId) {
        return res.status(400).json({ error: "PC number and Student ID are required." });
    }

    db.get(`SELECT * FROM attendance WHERE pc_number = ?`, [pcNumber], (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Database error." });
        }
        if (row) {
            return res.status(400).json({ error: `PC ${pcNumber} is already occupied!` });
        }

        db.run(`INSERT INTO attendance (pc_number, student_id) VALUES (?, ?)`,
            [pcNumber, studentId],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: "Failed to save check-in. Student ID might already be registered." });
                }
                res.json({ success: true, pcNumber, studentId });
            }
        );
    });
});

// Clear all records (Admin use)
app.post('/api/clear', (req, res) => {
    db.run(`DELETE FROM attendance`, [], (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true, message: "All attendance records cleared." });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});