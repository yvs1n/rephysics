const { Pool } = require('pg');
const pool = new Pool({ 
    connectionString: 'postgresql://neondb_owner:npg_RIW1KMOsT7jk@ep-silent-forest-a1xlf3pg.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function check() {
    const res = await pool.query(`
        SELECT u.email, array_agg(us.subject) as subjects
        FROM users u
        LEFT JOIN user_subjects us ON u.id = us.user_id
        GROUP BY u.email
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
}
check();
