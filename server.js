const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'attendance.json');

// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Serves index.html, admin.html, etc. from root

// Helper function to read data
function getData() {
    if (!fs.existsSync(DATA_FILE)) {
        return [];
    }
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

// Helper function to write data
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API Endpoint to get attendance records
app.get('/api/attendance', (req, res) => {
    const records = getData();
    res.json(records);
});

// API Endpoint to submit attendance/booking
app.post('/api/attendance', (req, res) => {
    const records = getData();
    const newRecord = {
        id: Date.now(),
        ...req.body,
        timestamp: new Date().toISOString()
    };
    records.push(newRecord);
    saveData(records);
    res.json({ success: true, record: newRecord });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});