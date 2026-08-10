const pool = require('../server/src/config/mysql');

async function listTables() {
  try {
    const [rows] = await pool.query('SHOW TABLES');
    console.log('Tables in database:');
    console.log(rows);
    process.exit(0);
  } catch (err) {
    console.error('Error listing tables:', err);
    process.exit(1);
  }
}

listTables();
