const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// In production (Render), DATABASE_URL is an environment variable.
// Locally, we use the Neon URL you provided.
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_RIW1KMOsT7jk@ep-silent-forest-a1xlf3pg.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Neon
});

async function setup() {
    console.log("Connecting to Neon PostgreSQL...");
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        console.log("Creating tables...");
        
        // 1. Users Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'student',
                display_name TEXT
            )
        `);

        // 2. Papers Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS papers (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                series TEXT NOT NULL,
                paper TEXT NOT NULL,
                exam_date DATE NOT NULL,
                duration_seconds INTEGER DEFAULT 0,
                video_url TEXT,
                pdf_url TEXT,
                ms_url TEXT,
                ma_url TEXT
            )
        `);

        // 3. Progress Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS progress (
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                paper_id INTEGER REFERENCES papers(id) ON DELETE CASCADE,
                watched_seconds INTEGER DEFAULT 0,
                last_opened TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (user_id, paper_id)
            )
        `);

        console.log("Seeding users...");
        const saltRounds = 10;
        
        // Use EXCLUDED or DO NOTHING to avoid duplicate errors on re-run
        const studentHash = bcrypt.hashSync('student', saltRounds);
        await client.query(`
            INSERT INTO users (email, password, role, display_name) 
            VALUES ($1, $2, $3, $4) 
            ON CONFLICT (email) DO NOTHING`, 
            ['student@gmail.com', studentHash, 'student', 'Student']
        );

        const adminHash = bcrypt.hashSync('admin', saltRounds);
        await client.query(`
            INSERT INTO users (email, password, role, display_name) 
            VALUES ($1, $2, $3, $4) 
            ON CONFLICT (email) DO NOTHING`, 
            ['admin@gmail.com', adminHash, 'admin', 'Admin']
        );

        console.log("Seeding papers...");
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

        const videoPool = [
            "https://media.w3.org/2010/05/bunny/movie.mp4",
            "https://media.w3.org/2010/05/sintel/movie.mp4",
            "https://media.w3.org/2010/05/bunny/trailer.mp4",
            "https://media.w3.org/2010/05/sintel/trailer.mp4",
            "https://media.w3.org/2010/05/video/movie_300.mp4"
        ];

        const mnthMap = { "Jan": "01", "June": "06", "Oct": "10" };
        const pprMap = { "1P": "01", "1PR": "02", "U1R": "02", "2P": "03", "2PR": "04", "U2R": "04" };

        const insertPaperQuery = `
            INSERT INTO papers (title, series, paper, exam_date, duration_seconds, video_url) 
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT DO NOTHING
        `;

        for (let i = 0; i < RAW_PAPERS.length; i++) {
            const raw = RAW_PAPERS[i];
            const parts = raw.split(" ");
            const month = parts[0];
            const year = parts[1];
            const paperIdnt = parts[2];
            const series = `${month} ${year} Series`;
            const title = `Paper ${paperIdnt} - ${series}`;
            const examDate = `${year}-${mnthMap[month] || "01"}-${pprMap[paperIdnt] || "01"}`;
            const video = videoPool[i % videoPool.length];

            await client.query(insertPaperQuery, [title, series, paperIdnt, examDate, 0, video]);
        }

        await client.query('COMMIT');
        console.log(`Successfully migrated and seeded exactly ${RAW_PAPERS.length} papers into Neon PostgreSQL.`);
        
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

setup().catch(console.error);
