require('dotenv').config();
const cors =require('cors');
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serves your HTML file

// Initialize Supabase (Backend only)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// --- API ROUTES ---

app.get('/', (req, res) => res.send('Hello World!'));
app.get('/test', (req, res) => res.send('Hello World!'));

// 1. Get all classes
app.get('/classes', async (req, res) => {
    const { data, error } = await supabase.from('class_rosters').select('class_name');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// 2. Create a new class roster
app.post('/classes', async (req, res) => {
    const { className, students } = req.body;
    const { error } = await supabase.from('class_rosters').insert({ class_name: className, students });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// 3. Get roster for a specific class
app.get('/roster/:className', async (req, res) => {
    const { data, error } = await supabase
        .from('class_rosters')
        .select('students')
        .eq('class_name', req.params.className)
        .single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// 4. Save Attendance
app.post('/attendance', async (req, res) => {
    const { className, date, hour, attendanceData } = req.body;
    const { error } = await supabase.from('attendance_records').upsert({
        class_name: className,
        date,
        hour,
        attendance_data: attendanceData
    }, { onConflict: 'class_name, date, hour' });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// 5. Load Attendance
app.get('/attendance', async (req, res) => {
    const { className, date, hour } = req.query;
    const { data, error } = await supabase
        .from('attendance_records')
        .select('attendance_data')
        .eq('class_name', className)
        .eq('date', date)
        .eq('hour', hour)
        .single();

    if (error && error.code !== 'PGRST116') { // Ignore "no rows found" error
        return res.status(500).json({ error: error.message });
    }
    res.json(data || null);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));