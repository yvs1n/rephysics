const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || "SUPER_SECRET_HAKING_PROOF_KEY_REPLACE_IN_PRODUCTION";

// Database Connection
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_RIW1KMOsT7jk@ep-silent-forest-a1xlf3pg.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use(cookieParser());
// Add upcoming_exam columns if they don't exist
// Add upcoming_exams table
pool.query(`
    CREATE TABLE IF NOT EXISTS upcoming_exams (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`).catch(() => null);

// Add exam_date column if missing
pool.query(`ALTER TABLE upcoming_exams ADD COLUMN IF NOT EXISTS exam_date DATE`).catch(() => null);

// Auth Middleware
async function requireAuth(req, res, next) {
    const token = req.cookies.authToken;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Invalid session" });
        req.user = decoded;
        // Inject active subject from cookie
        req.activeSubject = req.cookies.activeSubject;
        next();
    });
}

async function requireAdmin(req, res, next) {
    const token = req.cookies.authToken;
    if (!token) {
        if (req.accepts('html')) return res.status(403).send('Forbidden: Admins only');
        return res.status(401).json({ error: "Unauthorized" });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            if (req.accepts('html')) return res.status(403).send('Forbidden: Admins only');
            return res.status(401).json({ error: "Invalid session" });
        }
        if (decoded.role !== 'admin') {
            if (req.accepts('html')) return res.status(403).send('Forbidden: Admins only');
            return res.status(403).json({ error: "Forbidden: Admins only" });
        }
        req.user = decoded;
        next();
    });
}

// Protect specific HTML files before static serving
app.get('/dashboard.html', (req, res, next) => {
    const token = req.cookies.authToken;
    if (token) {
        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (!err && decoded.role === 'admin') {
                return res.sendFile(path.join(__dirname, 'public', 'admin.html'));
            } else {
                return res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
            }
        });
    } else {
        return res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    }
});

app.get('/admin.html', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use(express.static(path.join(__dirname, 'public'), { index: false }));
// ---- API ENDPOINTS ----

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({ error: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

        // Fetch user subjects
        const subRes = await pool.query('SELECT subject FROM user_subjects WHERE user_id = $1', [user.id]);
        const subjects = subRes.rows.map(r => r.subject);

        const token = jwt.sign({ 
            id: user.id, 
            email: user.email, 
            role: user.role, 
            display_name: user.display_name,
            subjects: subjects
        }, SECRET_KEY, { expiresIn: '8h' });

        res.cookie('authToken', token, { httpOnly: true, secure: false, sameSite: 'strict' });
        
        // Auto-select if only one subject
        if (subjects.length === 1) {
            res.cookie('activeSubject', subjects[0], { httpOnly: true, secure: false, sameSite: 'strict' });
        } else {
            res.clearCookie('activeSubject');
        }

        res.json({ message: "Login successful!", role: user.role, subjects: subjects });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/select-subject', requireAuth, (req, res) => {
    const { subject } = req.body;
    if (req.user.subjects.includes(subject)) {
        res.cookie('activeSubject', subject, { httpOnly: true, secure: false, sameSite: 'strict' });
        res.json({ success: true });
    } else {
        res.status(403).json({ error: "Unauthorized subject selection" });
    }
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('authToken');
    res.json({ message: "Logged out" });
});

app.get('/api/papers', requireAuth, async (req, res) => {
    try {
        const sortParam = req.query.sort || 'date_desc';
        let orderByClause = 'ORDER BY p.exam_date DESC, p.paper DESC';

        if (sortParam === 'date_asc') {
            orderByClause = 'ORDER BY p.exam_date ASC, p.paper ASC';
        } else if (sortParam === 'history_asc') {
            orderByClause = "ORDER BY COALESCE(pr.last_opened, '9999-12-31') ASC";
        }

        const subjectParam = req.query.subject || (req.activeSubject || 'Physics');
        const isAdminAll = (subjectParam === 'all' && (req.user.role === 'admin' || req.user.role === 'instructor'));

        const query = `
            SELECT p.*, 
                   COALESCE(ao.teacher_insights, p.teacher_insights) as teacher_insights,
                   COALESCE(ao.insights_header, p.insights_header) as insights_header,
                   COALESCE(pr.watched_seconds, 0) as watched_seconds, 
                   pr.last_opened
            FROM papers p 
            LEFT JOIN progress pr ON p.id = pr.paper_id AND pr.user_id = $1
            LEFT JOIN admin_overrides ao ON p.id = ao.paper_id AND ao.user_id = $1
            WHERE (p.subject = $2 OR $3 = true)
            ${orderByClause}
        `;
        const result = await pool.query(query, [req.user.id, subjectParam, isAdminAll]);
        res.json({ papers: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/dashboard', requireAuth, async (req, res) => {
    try {
        const userRes = await pool.query('SELECT display_name, email, role, upcoming_exam_title, upcoming_exam_subtitle FROM users WHERE id = $1', [req.user.id]);
        const userRow = userRes.rows[0];

        const historyQuery = `
            SELECT p.title, p.series, pr.watched_seconds, p.duration_seconds, pr.last_opened, p.id 
            FROM progress pr
            JOIN papers p ON pr.paper_id = p.id
            WHERE pr.user_id = $1 AND p.subject = $2
            ORDER BY pr.last_opened DESC LIMIT 3
        `;
        const historyRes = await pool.query(historyQuery, [req.user.id, req.activeSubject || 'Physics']);
        const history = historyRes.rows;

        const totalRes = await pool.query('SELECT COUNT(*) as total FROM papers WHERE subject = $1', [req.activeSubject || 'Physics']);
        const compRes = await pool.query(`
            SELECT COUNT(*) as completed 
            FROM progress pr
            JOIN papers p ON pr.paper_id = p.id
            WHERE pr.user_id = $1 AND p.subject = $2 AND pr.watched_seconds > 0
        `, [req.user.id, req.activeSubject || 'Physics']);

        // Fetch Global & Targeted Upcoming Exams (Filtered by Subject)
        const examsQuery = `
            SELECT id, title, subtitle, exam_date FROM upcoming_exams 
            WHERE (user_id IS NULL OR user_id = $1) AND subject = $2
            ORDER BY exam_date ASC NULLS LAST, created_at ASC
        `;
        const examsRes = await pool.query(examsQuery, [req.user.id, req.activeSubject || 'Physics']);

        res.json({ 
            user: { 
                email: userRow.email, 
                display_name: userRow.display_name, 
                role: userRow.role,
                subjects: req.user.subjects,
                activeSubject: req.activeSubject || null
            },
            history, 
            upcomingExams: examsRes.rows,
            lastOpened: history[0] || null,
            stats: { 
                total: parseInt(totalRes.rows[0].total), 
                completed: parseInt(compRes.rows[0].completed) 
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/me', requireAuth, async (req, res) => {
    try {
        const userRes = await pool.query('SELECT id, display_name, email, role FROM users WHERE id = $1', [req.user.id]);
        const user = userRes.rows[0];
        
        // Include enrolment info
        const subRes = await pool.query('SELECT subject FROM user_subjects WHERE user_id = $1', [req.user.id]);
        user.subjects = subRes.rows.map(r => r.subject);
        user.activeSubject = req.activeSubject || null;
        
        res.json(user);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/progress', requireAuth, async (req, res) => {
    try {
        const { paperId, watchedSeconds } = req.body;
        const query = `
            INSERT INTO progress (user_id, paper_id, watched_seconds, last_opened)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, paper_id) DO UPDATE SET 
                watched_seconds = EXCLUDED.watched_seconds, 
                last_opened = EXCLUDED.last_opened
        `;
        await pool.query(query, [req.user.id, paperId, watchedSeconds]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/papers/:id/duration', requireAuth, async (req, res) => {
    try {
        const paperId = parseInt(req.params.id);
        const { durationSeconds } = req.body;
        if (!durationSeconds || durationSeconds <= 0) return res.json({ success: false });

        const result = await pool.query(
            'UPDATE papers SET duration_seconds = $1 WHERE id = $2',
            [Math.round(durationSeconds), paperId]
        );
        res.json({ success: true, updated: result.rowCount > 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Account Management API ---
app.get('/api/admin/accounts', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, role, display_name FROM users ORDER BY id ASC');
        res.json({ accounts: result.rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/accounts', requireAdmin, async (req, res) => {
    try {
        const { email, password, role, display_name } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (email, password, role, display_name) VALUES ($1, $2, $3, $4)',
            [email, hashedPassword, role || 'student', display_name]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/accounts/:id', requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { email, role, display_name, password } = req.body;
        
        let query = 'UPDATE users SET email = $1, role = $2, display_name = $3';
        let params = [email, role, display_name, userId];
        
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = $5';
            params.push(hashedPassword);
        }
        
        query += ' WHERE id = $4';
        const result = await pool.query(query, params);
        res.json({ success: result.rowCount > 0 });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/accounts/:id', requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        // Prevent self-deletion
        if (userId === req.user.id) return res.status(403).json({ error: "Cannot delete your own account" });
        
        const result = await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        res.json({ success: result.rowCount > 0 });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin Students List
app.get('/api/admin/students', requireAdmin, async (req, res) => {
    try {
        const query = `
            WITH subject_progress AS (
                SELECT pr.user_id, p.subject, COUNT(DISTINCT pr.paper_id) as completed_count
                FROM progress pr
                JOIN papers p ON pr.paper_id = p.id
                WHERE pr.watched_seconds > 0
                GROUP BY pr.user_id, p.subject
            ),
            user_basis AS (
                SELECT u.id, u.display_name, u.email,
                       ARRAY_AGG(DISTINCT us.subject) as subjects,
                       COUNT(DISTINCT pr.paper_id) as completed_papers,
                       MAX(pr.last_opened) as last_active
                FROM users u
                LEFT JOIN user_subjects us ON u.id = us.user_id
                LEFT JOIN progress pr ON u.id = pr.user_id AND pr.watched_seconds > 0
                WHERE u.role = 'student'
                GROUP BY u.id
            )
            SELECT u.*, 
                   COALESCE((
                       SELECT json_object_agg(sp.subject, sp.completed_count)
                       FROM subject_progress sp
                       WHERE sp.user_id = u.id
                   ), '{}'::json) as progress_by_subject
            FROM user_basis u
            ORDER BY u.last_active DESC NULLS LAST
        `;
        const result = await pool.query(query);
        res.json({ students: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Papers List (with global insights)
app.get('/api/admin/papers', requireAdmin, async (req, res) => {
    try {
        const query = 'SELECT * FROM papers ORDER BY exam_date DESC, paper DESC';
        const result = await pool.query(query);
        res.json({ papers: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Update Paper
app.post('/api/admin/papers/:id', requireAdmin, async (req, res) => {
    try {
        const paperId = req.params.id;
        const { target_student_id, insights_header, teacher_insights } = req.body;

        if (target_student_id === 'all') {
            await pool.query(`UPDATE papers SET insights_header = $1, teacher_insights = $2 WHERE id = $3`, 
                [insights_header, teacher_insights, paperId]
            );
        } else {
            await pool.query(`
                INSERT INTO admin_overrides (user_id, paper_id, insights_header, teacher_insights)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_id, paper_id) DO UPDATE 
                SET insights_header = EXCLUDED.insights_header, teacher_insights = EXCLUDED.teacher_insights
            `, [target_student_id, paperId, insights_header, teacher_insights]);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/admin/upcoming-exams', requireAdmin, async (req, res) => {
    try {
        const query = `
            SELECT ue.id, ue.title, ue.subtitle, ue.exam_date, ue.user_id, u.display_name, u.email 
            FROM upcoming_exams ue
            LEFT JOIN users u ON ue.user_id = u.id
            ORDER BY ue.exam_date ASC NULLS LAST, ue.created_at ASC
        `;
        const result = await pool.query(query);
        res.json({ exams: result.rows });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/upcoming-exams', requireAdmin, async (req, res) => {
    try {
        const { title, subtitle, exam_date, target_student_id, subject } = req.body;
        const sub = subject || 'Physics';
        if (target_student_id === 'all') {
            await pool.query('INSERT INTO upcoming_exams (title, subtitle, exam_date, subject) VALUES ($1, $2, $3, $4)', [title, subtitle, exam_date, sub]);
        } else {
            await pool.query('INSERT INTO upcoming_exams (user_id, title, subtitle, exam_date, subject) VALUES ($1, $2, $3, $4, $5)', [target_student_id, title, subtitle, exam_date, sub]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/upcoming-exams/:id', requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM upcoming_exams WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/upcoming-exams/:id', requireAdmin, async (req, res) => {
    try {
        const { title, subtitle, exam_date, target_student_id, subject } = req.body;
        const uid = target_student_id === 'all' ? null : target_student_id;
        const sub = subject || 'Physics';
        await pool.query(
            'UPDATE upcoming_exams SET title = $1, subtitle = $2, exam_date = $3, user_id = $4, subject = $5 WHERE id = $6',
            [title, subtitle, exam_date, uid, sub, req.params.id]
        );
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin Update Student Subjects
app.post('/api/admin/students/:id/subjects', requireAdmin, async (req, res) => {
    try {
        const { subjects } = req.body; // Array of strings
        const userId = req.params.id;
        
        await pool.query('DELETE FROM user_subjects WHERE user_id = $1', [userId]);
        for (const sub of subjects) {
            await pool.query('INSERT INTO user_subjects (user_id, subject) VALUES ($1, $2)', [userId, sub]);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// Settings API
app.post('/api/settings', requireAuth, async (req, res) => {
    try {
        const { display_name, password } = req.body;
        if (display_name) {
            await pool.query('UPDATE users SET display_name = $1 WHERE id = $2', [display_name, req.user.id]);
        }
        if (password) {
            const hash = await bcrypt.hash(password, 10);
            await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.user.id]);
        }
        
        const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
        const user = userRes.rows[0];
        const token = jwt.sign({ 
            id: user.id, 
            email: user.email, 
            role: user.role, 
            display_name: user.display_name 
        }, SECRET_KEY, { expiresIn: '8h' });

        res.cookie('authToken', token, { httpOnly: true, secure: false, sameSite: 'strict' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Static Route Handling
app.get(['/dashboard.html', '/video_lessons.html', '/past_papers.html', '/player.html', '/settings.html', '/admin.html'], requireAuth, (req, res) => {
    if (req.path === '/past_papers.html' && req.user.role === 'admin') {
        return res.sendFile(path.join(__dirname, 'public', 'admin.html'));
    }
    if (req.path === '/admin.html' && req.user.role !== 'admin') {
        return res.redirect('/dashboard.html');
    }
    res.sendFile(path.join(__dirname, 'public', req.path));
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// For local development
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running at http://0.0.0.0:${PORT}`);
    });
}

module.exports = app;

