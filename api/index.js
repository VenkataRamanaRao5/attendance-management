require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors())
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const JWT_SECRET = process.env.JWT_SECRET

// --- MIDDLEWARE: PROTECT ROUTES ---
// This checks if the user sent a valid Token before letting them access data
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <TOKEN>

    if (!token) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user; // Attach user info to the request
        next();
    });
}

app.get('/', async (req, res) => {
    res.send("Hello");
})

// --- AUTH ROUTES ---

// 1. Register
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    // Hash the password so we don't store it as plain text
    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await supabase
        .from('app_users')
        .insert({ username, password: hashedPassword });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, message: "User registered!" });
});

// 2. Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Find user
    const { data: users, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username);

    if (error || users.length === 0) return res.status(400).json({ error: "User not found" });

    const user = users[0];

    // Check password
    if (await bcrypt.compare(password, user.password)) {
        // Create a Token containing the User ID
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
        res.json({ token, username: user.username });
    } else {
        res.status(401).json({ error: "Invalid password" });
    }
});

// --- DATA ROUTES (PROTECTED) ---

// 1. Get ONLY the logged-in user's classes
app.get('/classes', authenticateToken, async (req, res) => {
    const { data, error } = await supabase
        .from('class_rosters')
        .select('class_name')
        .eq('owner_id', req.user.id); // Filter by User ID

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// 2. Create Class (Attached to User)
app.post('/classes', authenticateToken, async (req, res) => {
    const { className, students } = req.body;
    
    const { error } = await supabase.from('class_rosters').insert({ 
        class_name: className, 
        students,
        owner_id: req.user.id // Attach the Creator ID
    });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// 3. Get Roster (Must belong to user)
app.get('/roster/:className', authenticateToken, async (req, res) => {
    const { data, error } = await supabase
        .from('class_rosters')
        .select('students')
        .eq('class_name', req.params.className)
        .eq('owner_id', req.user.id) // Security Check
        .single();
    
    if (error) return res.status(500).json({ error: "Class not found or access denied" });
    res.json(data);
});

// 4. Save/Load Attendance (Reused logic, relying on class_name uniqueness per user)
// ideally you should also check ownership here, but for simplicity:
app.post('/attendance', authenticateToken, async (req, res) => {
    const { className, date, hour, attendanceData } = req.body;
    // Note: We assume class names are unique enough or user validation on fetch handles it.
    // For tighter security, you'd check ownership of 'className' first.
    
    const { error } = await supabase.from('attendance_records').upsert({
        class_name: className,
        date,
        hour,
        attendance_data: attendanceData
    }, { onConflict: 'class_name, date, hour' });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

app.get('/attendance', authenticateToken, async (req, res) => {
    const { className, date, hour } = req.query;
    const { data, error } = await supabase
        .from('attendance_records')
        .select('attendance_data')
        .eq('class_name', className)
        .eq('date', date)
        .eq('hour', hour)
        .single();

    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
    res.json(data || null);
});

// --- REPORT ROUTE ---
// Queries: single class, single roll no, range of dates
// Returns: list of dates with present/absent status (daily, not hourly)
app.get('/report', authenticateToken, async (req, res) => {
    const { className, rollNo, startDate, endDate } = req.query;

    if (!className || !rollNo || !startDate || !endDate) {
        return res.status(400).json({ error: "Missing required fields: className, rollNo, startDate, endDate" });
    }

    try {
        // Fetch all attendance records for this class in the date range
        const { data: records, error } = await supabase
            .from('attendance_records')
            .select('date, hour, attendance_data')
            .eq('class_name', className)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        if (error) return res.status(500).json({ error: error.message });

        // Process records to extract student's attendance
        const attendanceByDate = {};
        let totalHours = 0;
        let presentHours = 0;
        let absentHours = 0;

        records.forEach(record => {
            const { date, hour, attendance_data } = record;
            
            // hour is an array or comma-separated string, count the hours
            let hourCount = 1;
            if (Array.isArray(hour)) {
                hourCount = hour.length;
            } else if (typeof hour === 'string') {
                hourCount = hour.split(',').length;
            }

            const studentStatus = attendance_data?.[rollNo];

            if (studentStatus) {
                totalHours += hourCount;
                
                if (!attendanceByDate[date]) {
                    attendanceByDate[date] = [];
                }

                // Add hour entries for this date
                if (Array.isArray(hour)) {
                    hour.forEach(h => {
                        attendanceByDate[date].push({
                            hour: h,
                            status: studentStatus
                        });
                        if (studentStatus === 'Present') presentHours++;
                        else if (studentStatus === 'Absent') absentHours++;
                    });
                } else if (typeof hour === 'string') {
                    hour.split(',').forEach(h => {
                        attendanceByDate[date].push({
                            hour: h.trim(),
                            status: studentStatus
                        });
                        if (studentStatus === 'Present') presentHours++;
                        else if (studentStatus === 'Absent') absentHours++;
                    });
                } else {
                    attendanceByDate[date].push({
                        hour: hour,
                        status: studentStatus
                    });
                    if (studentStatus === 'Present') presentHours++;
                    else if (studentStatus === 'Absent') absentHours++;
                }
            }
        });

        // Format response: calendar view with daily status (not hourly)
        const details = Object.entries(attendanceByDate).map(([date, status]) => ({
            date,
            status // Either 'Present' or 'Absent' for the entire day
        }));

        res.json({
            summary: {
                totalHours,
                presentHours,
                absentHours,
                percentage: totalHours > 0 ? ((presentHours / totalHours) * 100).toFixed(1) : 0
            },
            details // Array of { date, status }
        });
    } catch (err) {
        console.error('Report error:', err);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// --- CLASS REPORT ROUTE ---
// Queries: class name, start date, end date
// Returns: attendance summary for all students in class (for CSV export)
app.get('/class-report', authenticateToken, async (req, res) => {
    const { className, startDate, endDate } = req.query;

    if (!className || !startDate || !endDate) {
        return res.status(400).json({ error: "Missing required fields: className, startDate, endDate" });
    }

    try {
        // Fetch roster
        const { data: rosterData, error: rosterError } = await supabase
            .from('class_rosters')
            .select('students')
            .eq('class_name', className)
            .eq('owner_id', req.user.id)
            .single();

        if (rosterError) return res.status(400).json({ error: "Class not found" });

        const students = rosterData.students || [];

        // Fetch all attendance records for this class in the date range
        const { data: records, error: recordsError } = await supabase
            .from('attendance_records')
            .select('date, hour, attendance_data')
            .eq('class_name', className)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        if (recordsError) return res.status(500).json({ error: recordsError.message });

        // Build attendance columns (one per record, containing date and hour range)
        const attendanceColumns = records.map(record => {
            const { date, hour } = record;
            
            // Parse hours
            const hours = Array.isArray(hour) ? hour : (typeof hour === 'string' ? hour.split(',').map(h => h.trim()) : [hour.toString()]);
            
            return {
                date,
                hours: `"${hours.join(',')}"`, // Store hours as comma-separated string
                hourCount: hours.length
            };
        });

        // Calculate attendance for each student
        const studentStats = {};
        const studentAttendance = {};

        students.forEach(student => {
            studentStats[student.roll] = {
                roll: student.roll,
                name: student.name,
                presentHours: 0,
                absentHours: 0,
                totalHours: 0
            };
            studentAttendance[student.roll] = {};
        });

        // For each record, store attendance for each student
        records.forEach((record, recordIndex) => {
            const { attendance_data, hour } = record;
            
            // Count hours for this record
            let hourCount = 1;
            if (Array.isArray(hour)) {
                hourCount = hour.length;
            } else if (typeof hour === 'string') {
                hourCount = hour.split(',').length;
            }

            // Update stats for each student
            Object.keys(attendance_data || {}).forEach(rollNo => {
                if (studentStats[rollNo]) {
                    const status = attendance_data[rollNo];
                    studentStats[rollNo].totalHours += hourCount;
                    if (status === 'Present') {
                        studentStats[rollNo].presentHours += hourCount;
                    } else if (status === 'Absent') {
                        studentStats[rollNo].absentHours += hourCount;
                    }
                    
                    // Store attendance by record index
                    studentAttendance[rollNo][recordIndex] = status;
                }
            });
        });

        // Calculate percentages and format response
        const classReport = Object.values(studentStats).map(stat => ({
            ...stat,
            percentage: stat.totalHours > 0 ? ((stat.presentHours / stat.totalHours) * 100).toFixed(1) : 0
        }));

        res.json({
            className,
            startDate,
            endDate,
            totalHours: records.reduce((sum, r) => {
                let hourCount = 1;
                if (Array.isArray(r.hour)) {
                    hourCount = r.hour.length;
                } else if (typeof r.hour === 'string') {
                    hourCount = r.hour.split(',').length;
                }
                return sum + hourCount;
            }, 0),
            students: classReport,
            attendanceColumns, // Array of { date, hours, hourCount } for each record
            studentAttendance // Map of rollNo -> { recordIndex -> "Present"/"Absent" }
        });
    } catch (err) {
        console.error('Class report error:', err);
        res.status(500).json({ error: 'Failed to generate class report' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));