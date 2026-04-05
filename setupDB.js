const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');

const dbPath = './database.sqlite';

// Always start fresh for correct reseeding
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log("Deleted old database explicitly.");
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to new database');
    }
});

db.serialize(() => {
    // 1. Create Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT,
        display_name TEXT
    )`);

    // 2. Create Papers Table
    db.run(`CREATE TABLE IF NOT EXISTS papers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        series TEXT,
        paper TEXT,
        exam_date DATE,
        duration_seconds INTEGER,
        video_url TEXT,
        pdf_url TEXT,
        ms_url TEXT,
        ma_url TEXT
    )`);

    // 3. Create Progress Table
    db.run(`CREATE TABLE IF NOT EXISTS progress (
        user_id INTEGER,
        paper_id INTEGER,
        watched_seconds INTEGER DEFAULT 0,
        last_opened TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, paper_id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (paper_id) REFERENCES papers (id)
    )`);

    const saltRounds = 10;
    
    // Seed Student
    const studentHash = bcrypt.hashSync('student', saltRounds);
    db.run(`INSERT INTO users (email, password, role, display_name) VALUES (?, ?, ?, ?)`, ['student@gmail.com', studentHash, 'student', 'Student']);

    // Seed Admin
    const adminHash = bcrypt.hashSync('admin', saltRounds);
    db.run(`INSERT INTO users (email, password, role, display_name) VALUES (?, ?, ?, ?)`, ['admin@gmail.com', adminHash, 'admin', 'Admin']);

    // All 55 Exam Papers (U2R renamed to 2PR, U1R kept as is)
    const RAW_PAPERS = [
        "June 2018 1P", "June 2018 2P", "June 2018 1PR", "June 2018 2PR", 
        "Jan 2019 1P", "Jan 2019 2P", "June 2019 1P", "June 2019 2P", "June 2019 1PR", "June 2019 2PR", 
        "Jan 2020 1P", "Jan 2020 2P", "Jan 2020 1PR", "Jan 2020 2PR", "June 2020 1P", "June 2020 2P", 
        "Jan 2021 1P", "Jan 2021 2P", "Jan 2021 1PR", "Jan 2021 2PR", "June 2021 1P", "June 2021 2P", "Oct 2021 1P", "Oct 2021 2P", 
        "Jan 2022 1P", "Jan 2022 2P", "Jan 2022 1PR", "Jan 2022 2PR", "June 2022 1P", "June 2022 2P", "June 2022 1PR", "June 2022 2PR", 
        "Jan 2023 1P", "Jan 2023 2P", "Jan 2023 1PR", "Jan 2023 2PR", "June 2023 1P", "June 2023 2P", "June 2023 1PR", "June 2023 2PR", "Oct 2023 1P", "Oct 2023 2P", 
        "June 2024 1PR", "June 2024 2PR", "Oct 2024 1P", "Oct 2024 2P", 
        "June 2025 1P", "June 2025 2P", "June 2025 1PR", "June 2025 2PR", "June 2025 U1R",
        "Oct 2025 1P", "Oct 2025 2P", "Oct 2025 1PR", "Oct 2025 2PR"
    ];

    // Long reliable public MP4s from W3C (always available, different durations)
    const videoPool = [
        "https://media.w3.org/2010/05/bunny/movie.mp4",       // Big Buck Bunny ~9min
        "https://media.w3.org/2010/05/sintel/movie.mp4",       // Sintel ~14min
        "https://media.w3.org/2010/05/bunny/trailer.mp4",      // Bunny trailer ~32s
        "https://media.w3.org/2010/05/sintel/trailer.mp4",     // Sintel trailer ~2min
        "https://media.w3.org/2010/05/video/movie_300.mp4",    // Test video ~3min
        "https://media.w3.org/2010/05/bunny/movie.mp4",
        "https://media.w3.org/2010/05/sintel/movie.mp4",
        "https://media.w3.org/2010/05/bunny/trailer.mp4",
        "https://media.w3.org/2010/05/sintel/trailer.mp4",
        "https://media.w3.org/2010/05/video/movie_300.mp4"
    ];

    const stmt = db.prepare(`INSERT INTO papers (title, series, paper, exam_date, duration_seconds, video_url) VALUES (?, ?, ?, ?, ?, ?)`);

    const mnthMap = { "Jan": "01", "June": "06", "Oct": "10" };
    // Day offsets so papers within same month/year sort correctly
    const pprMap = { "1P": "01", "1PR": "02", "U1R": "02", "2P": "03", "2PR": "04", "U2R": "04" };

    RAW_PAPERS.forEach((raw, index) => {
        const parts = raw.split(" ");
        const month = parts[0];
        const year = parts[1];
        const paperIdnt = parts[2];

        const series = `${month} ${year} Series`;
        const title = `Paper ${paperIdnt} - ${series}`;
        
        const monthNum = mnthMap[month] || "01";
        const day = pprMap[paperIdnt] || "01";
        
        const examDate = `${year}-${monthNum}-${day}`;

        // Duration set to 0 — will be updated on first play from actual video metadata
        const video = videoPool[index % videoPool.length];
        
        stmt.run([title, series, paperIdnt, examDate, 0, video]);
    });
    
    stmt.finalize();
    console.log(`Successfully recreated and seeded exactly ${RAW_PAPERS.length} papers into the database.`);
});
