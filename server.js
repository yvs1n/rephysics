const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = 3000;
const SECRET_KEY = "SUPER_SECRET_HAKING_PROOF_KEY_REPLACE_IN_PRODUCTION"; // Used to sign the JWT

app.use(express.json());
app.use(cookieParser());
// Public assets like CSS, images, etc
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Connect to SQLite
const db = new sqlite3.Database('./database.sqlite');

// Middleware to protect routes (Hacking Proofing the basics)
function requireAuth(req, res, next) {
    const token = req.cookies.authToken;
    if (!token) return res.status(401).json({ error: "Unauthorized. Please log in." });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: "Invalid session token." });
        req.user = decoded; // Contains id, email, role
        next();
    });
}

// ---- API ENDPOINTS ----

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err || !user) return res.status(401).json({ error: "Invalid email or password" });
        
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });
            
            // Create a JSON Web Token
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role, display_name: user.display_name }, SECRET_KEY, { expiresIn: '8h' });
            
            // Store it in an HTTP-Only cookie so JavaScript cannot read it (XSS protection)
            res.cookie('authToken', token, { httpOnly: true, secure: false, sameSite: 'strict' });
            res.json({ message: "Login successful!", role: user.role });
        });
    });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('authToken');
    res.json({ message: "Logged out" });
});

// Fetch all papers
app.get('/api/papers', requireAuth, (req, res) => {
    const sortParam = req.query.sort || 'date_desc';
    let orderByClause = '';

    if (sortParam === 'date_desc') {
        orderByClause = 'ORDER BY DATE(p.exam_date) DESC, p.paper DESC';
    } else if (sortParam === 'date_asc') {
        orderByClause = 'ORDER BY DATE(p.exam_date) ASC, p.paper ASC';
    } else if (sortParam === 'history_asc') {
        // Puts never-opened papers at bottom, or history oldest first
        orderByClause = 'ORDER BY IFNULL(pr.last_opened, "9999-12-31") ASC';
    } else {
        orderByClause = 'ORDER BY DATE(p.exam_date) DESC, p.paper DESC';
    }

    db.all(`SELECT p.*,
            COALESCE(pr.watched_seconds, 0) as watched_seconds,
            pr.last_opened
            FROM papers p 
            LEFT JOIN progress pr ON p.id = pr.paper_id AND pr.user_id = ?
            ${orderByClause}`, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ papers: rows });
    });
});

// Fetch Dashboard specific data (History + Last Opened)
app.get('/api/dashboard', requireAuth, (req, res) => {
    db.get(`SELECT display_name, email FROM users WHERE id = ?`, [req.user.id], (err, userRow) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const historyQuery = `SELECT p.title, p.series, pr.watched_seconds, p.duration_seconds, pr.last_opened, p.id 
                              FROM progress pr
                              JOIN papers p ON pr.paper_id = p.id
                              WHERE pr.user_id = ?
                              ORDER BY pr.last_opened DESC LIMIT 3`;
                              
        db.all(historyQuery, [req.user.id], (err, history) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Get Total Stats
            db.get(`SELECT COUNT(*) as total FROM papers`, (err, totRow) => {
                db.get(`SELECT COUNT(*) as completed FROM progress WHERE user_id = ? AND watched_seconds > 0`, [req.user.id], (err, compRow) => {
                    res.json({ 
                        user: { email: userRow.email, display_name: userRow.display_name },
                        history, 
                        lastOpened: history[0] || null,
                        stats: { total: totRow?.total || 0, completed: compRow?.completed || 0 }
                    });
                });
            });
        });
    });
});

// Save progress marker
app.post('/api/progress', requireAuth, (req, res) => {
    const { paperId, watchedSeconds } = req.body;
    
    // Upsert logic for progress
    const query = `
        INSERT INTO progress (user_id, paper_id, watched_seconds, last_opened)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, paper_id) DO UPDATE SET 
        watched_seconds = ?, 
        last_opened = CURRENT_TIMESTAMP
    `;
    db.run(query, [req.user.id, paperId, watchedSeconds, watchedSeconds], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Update real video duration once loaded in browser
app.post('/api/papers/:id/duration', requireAuth, (req, res) => {
    const paperId = parseInt(req.params.id);
    const { durationSeconds } = req.body;
    if (!durationSeconds || durationSeconds <= 0) return res.json({ success: false });
    db.run(`UPDATE papers SET duration_seconds = ? WHERE id = ? AND duration_seconds = 0`,
        [Math.round(durationSeconds), paperId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, updated: this.changes > 0 });
    });
});

// Protect specific HTML Routes
app.get('/dashboard.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'public/dashboard.html')));
app.get('/video_lessons.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'public/video_lessons.html')));
app.get('/past_papers.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'public/past_papers.html')));
app.get('/player.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'public/player.html')));
app.get('/settings.html', requireAuth, (req, res) => res.sendFile(path.join(__dirname, 'public/settings.html')));

// Settings API
app.post('/api/settings', requireAuth, (req, res) => {
    const { display_name, password } = req.body;
    if (display_name) {
        db.run(`UPDATE users SET display_name = ? WHERE id = ?`, [display_name, req.user.id]);
    }
    if (password) {
        const hash = bcrypt.hashSync(password, 10);
        db.run(`UPDATE users SET password = ? WHERE id = ?`, [hash, req.user.id]);
    }
    
    // We optionally regenerate the token to push the new display name
    db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id], (err, user) => {
        if (!user) return res.json({ success: true });
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, display_name: user.display_name }, SECRET_KEY, { expiresIn: '8h' });
        res.cookie('authToken', token, { httpOnly: true, secure: false, sameSite: 'strict' });
        res.json({ success: true });
    });
});

// Fallback HTML router
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// START
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});
