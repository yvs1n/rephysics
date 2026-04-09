const { Pool } = require('pg');
const connectionString = 'postgresql://neondb_owner:npg_RIW1KMOsT7jk@ep-silent-forest-a1xlf3pg.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log("Fetching papers...");
        const res = await pool.query("SELECT id, title, paper, exam_date FROM papers");
        const papers = res.rows;
        
        console.log(`Processing ${papers.length} papers...`);

        for (const p of papers) {
            // Group papers by series (extracted from title e.g. "June 2024")
            const seriesMatch = p.title.match(/(June|Oct|Jan|Nov|May)\s+\d{4}/i);
            if (!seriesMatch) continue;
            
            const series = seriesMatch[0];
            const date = new Date(p.exam_date);
            
            // Treat the 1st of the month as the base date for the series
            // Or use the current month/year but force the day
            let baseDate = new Date(date.getFullYear(), date.getMonth(), 1);
            
            let dayOffset = 0;
            const paperCode = p.paper.toUpperCase();

            // Logic:
            // 1[PBCH] -> Day 1 (offset 0)
            // 1[PBCH]R -> Day 2 (offset 1)
            // 2[PBCH] -> Day 3 (offset 2)
            // 2[PBCH]R -> Day 4 (offset 3)
            
            if (paperCode.startsWith('1')) {
                if (paperCode.endsWith('R')) dayOffset = 1;
                else dayOffset = 0;
            } else if (paperCode.startsWith('2')) {
                if (paperCode.endsWith('R')) dayOffset = 3;
                else dayOffset = 2;
            }

            const newDate = new Date(baseDate);
            newDate.setDate(baseDate.getDate() + dayOffset);
            
            // Correct for potential timezone shift when storing
            const formattedDate = newDate.toISOString().split('T')[0];
            
            console.log(`Updating Paper ${p.id} (${p.title}): ${p.exam_date} -> ${formattedDate}`);
            await pool.query("UPDATE papers SET exam_date = $1 WHERE id = $2", [formattedDate, p.id]);
        }
        
        console.log("Migration completed successfully!");
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await pool.end();
    }
}

migrate();
