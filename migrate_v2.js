const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_RIW1KMOsT7jk@ep-silent-forest-a1xlf3pg.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    console.log("Starting Migration v2: Multi-Subject Support...");
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Update Tables Schema
        console.log("Updating schemas...");
        await client.query(`ALTER TABLE papers ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'Physics'`);
        await client.query(`ALTER TABLE upcoming_exams ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT 'Physics'`);
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_subjects (
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                subject TEXT NOT NULL,
                PRIMARY KEY (user_id, subject)
            )
        `);

        // 2. Map existing users to Physics
        console.log("Mapping existing users to Physics...");
        await client.query(`
            INSERT INTO user_subjects (user_id, subject)
            SELECT id, 'Physics' FROM users
            ON CONFLICT DO NOTHING
        `);

        // 3. Clone Papers for other subjects
        console.log("Cloning papers for Math, Biology, Chemistry...");
        const physicsPapers = await client.query(`SELECT * FROM papers WHERE subject = 'Physics'`);
        
        const subjects = [
            { name: 'Math', suffix: 'H' },
            { name: 'Biology', suffix: 'B' },
            { name: 'Chemistry', suffix: 'C' }
        ];

        for (const sub of subjects) {
            console.log(`- Cloning for ${sub.name}...`);
            for (const p of physicsPapers.rows) {
                // Determine new title and identifier (e.g., 1P -> 1H)
                // Current title format: "Paper 1P - June 2018 Series"
                const newPaperIdnt = p.paper.replace('P', sub.suffix);
                const newTitle = p.title.replace(p.paper, newPaperIdnt);
                
                await client.query(`
                    INSERT INTO papers (title, series, paper, exam_date, duration_seconds, video_url, pdf_url, ms_url, ma_url, subject)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (title) DO NOTHING
                `, [newTitle, p.series, newPaperIdnt, p.exam_date, p.duration_seconds, p.video_url, p.pdf_url, p.ms_url, p.ma_url, sub.name]);
            }
        }

        await client.query('COMMIT');
        console.log("Migration v2 Completed Successfully.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Migration v2 Failed:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
