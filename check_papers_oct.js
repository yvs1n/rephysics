const { Pool } = require('pg');
const connectionString = 'postgresql://neondb_owner:npg_RIW1KMOsT7jk@ep-silent-forest-a1xlf3pg.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const res = await pool.query("SELECT id, title, paper, exam_date FROM papers WHERE title LIKE '%Oct 2023%' ORDER BY exam_date ASC, paper ASC");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
