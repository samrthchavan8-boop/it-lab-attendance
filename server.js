const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'attendance.json');

// Helper to read data safely
function readData() {
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

// Helper to write data safely
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API: Get attendance records
app.get('/api/attendance', (req, res) => {
    const records = readData();
    res.json({ success: true, data: records });
});

// API: Book a PC
app.post('/api/attendance', (req, res) => {
    const { studentId, studentName, pcNumber } = req.body;
    let records = readData();

    // Check if PC is already booked
    const existingPC = records.find(r => r.pcNumber == pcNumber);
    if (existingPC) {
        return res.status(400).json({ success: false, message: 'PC already booked!' });
    }

    const newRecord = { 
        studentId, 
        studentName, 
        pcNumber, 
        time: new Date().toLocaleTimeString() 
    };
    
    records.push(newRecord);
    writeData(records);

    res.json({ success: true, message: 'PC booked successfully!' });
});

// API: Clear records (Admin)
app.post('/api/clear', (req, res) => {
    writeData([]);
    res.json({ success: true, message: 'All records cleared!' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});