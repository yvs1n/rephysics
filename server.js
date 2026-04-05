const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
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
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Auth Middleware
async function requireAuth(req, res, next) {
    const token = req.cookies.authToken;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Invalid session" });
        req.user = decoded;
        next();
    });
}

// ---- API ENDPOINTS ----

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({ error: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

        const token = jwt.sign({ 
            id: user.id, 
            email: user.email, 
            role: user.role, 
            display_name: user.display_name 
        }, SECRET_KEY, { expiresIn: '8h' });

        res.cookie('authToken', token, { httpOnly: true, secure: false, sameSite: 'strict' });
        res.json({ message: "Login successful!", role: user.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
            orderByClause = 'ORDER BY COALESCE(pr.last_opened, \'9999-12-31\') ASC';
        }

        const query = `
            SELECT p.*, 
                   COALESCE(pr.watched_seconds, 0) as watched_seconds, 
                   pr.last_opened
            FROM papers p 
            LEFT JOIN progress pr ON p.id = pr.paper_id AND pr.user_id = $1
            ${orderByClause}
        `;
        const result = await pool.query(query, [req.user.id]);
        res.json({ papers: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/dashboard', requireAuth, async (req, res) => {
    try {
        const userRes = await pool.query('SELECT display_name, email FROM users WHERE id = $1', [req.user.id]);
        const userRow = userRes.rows[0];

        const historyQuery = `
            SELECT p.title, p.series, pr.watched_seconds, p.duration_seconds, pr.last_opened, p.id 
            FROM progress pr
            JOIN papers p ON pr.paper_id = p.id
            WHERE pr.user_id = $1
            ORDER BY pr.last_opened DESC LIMIT 3
        `;
        const historyRes = await pool.query(historyQuery, [req.user.id]);
        const history = historyRes.rows;

        const totalRes = await pool.query('SELECT COUNT(*) as total FROM papers');
        const compRes = await pool.query('SELECT COUNT(*) as completed FROM progress WHERE user_id = $1 AND watched_seconds > 0', [req.user.id]);

        res.json({ 
            user: { email: userRow.email, display_name: userRow.display_name },
            history, 
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
            'UPDATE papers SET duration_seconds = $1 WHERE id = $2 AND duration_seconds = 0',
            [Math.round(durationSeconds), paperId]
        );
        res.json({ success: true, updated: result.rowCount > 0 });
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
app.get(['/dashboard.html', '/video_lessons.html', '/past_papers.html', '/player.html', '/settings.html'], requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', req.path));
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});
