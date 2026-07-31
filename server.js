const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

// Connect to SQLite database
const db = new sqlite3.Database('./attendance.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // AUTO-RESET: Automatically clear old attendance records every time the server starts
        db.run(`DELETE FROM attendance`, [], (err) => {
            if (err) {
                console.error('Error resetting attendance:', err.message);
            } else {
                console.log('Lab session reset: All previous attendance records cleared automatically.');
            }
        });
    }
});

// Create attendance table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId TEXT,
    pcNumber INTEGER,
    time TEXT
)`);

// API route to handle student seat booking
app.post('/api/check-in', (req, res) => {
    const { studentId, pcNumber } = req.body;

    if (!studentId || !pcNumber) {
        return res.status(400).json({ success: false, message: 'Student ID and PC Number are required.' });
    }

    // Check if PC is already taken
    db.get(`SELECT * FROM attendance WHERE pcNumber = ?`, [pcNumber], (err, row) => {
        if (row) {
            return res.status(400).json({ success: false, message: `PC - ${pcNumber} is already booked!` });
        }

        // Save attendance to database
        const time = new Date().toLocaleTimeString();
        db.run(`INSERT INTO attendance (studentId, pcNumber, time) VALUES (?, ?, ?)`, [studentId, pcNumber, time], function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
            console.log(`Attendance recorded: Student ${studentId} at PC - ${pcNumber}`);
            res.json({ success: true, message: `Successfully seated at PC - ${pcNumber}` });
        });
    });
});

// API route to get all attendance records for the dashboard
app.get('/api/attendance', (req, res) => {
    db.all(`SELECT * FROM attendance`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, data: rows });
    });
});

// API route to reset/clear all attendance records manually via admin button
app.delete('/api/attendance/reset', (req, res) => {
    db.run(`DELETE FROM attendance`, [], function(err) {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        console.log('Lab attendance records cleared by admin.');
        res.json({ success: true, message: 'All lab records have been successfully reset.' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});