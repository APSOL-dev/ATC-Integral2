const pool = require('../server/src/config/mysql');

async function checkColumns() {
  try {
    const [rows] = await pool.query('DESCRIBE `App.ClientesMay`');
    console.log('Columns in App.ClientesMay:');
    console.log(rows.map(r => r.Field));
    process.exit(0);
  } catch (err) {
    console.error('Error describing table:', err);
    process.exit(1);
  }
}

checkColumns();
