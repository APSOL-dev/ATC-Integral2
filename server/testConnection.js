require('dotenv').config();
const sql = require('mssql');

const config = {
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  server: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT, 10),
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

async function testConnection() {
  console.log('Testing MSSQL Connection to:', config.server);
  try {
    let pool = await sql.connect(config);
    console.log('Connected to MSSQL successfully.');

    // Query databases to find Casa29
    let dbResult = await pool.request().query('SELECT name FROM sys.databases');
    const dbs = dbResult.recordset.map(r => r.name);
    console.log('Available databases:', dbs.join(', '));

    const casaDb = 'Casa29';
    
    if (casaDb) {
      console.log(`\nSwitching to database: ${casaDb}`);
      config.database = casaDb;
      pool.close(); // close connection without DB

      pool = await sql.connect(config); // reconnect with DB
      
      const tablesResult = await pool.request().query("SELECT table_name, table_type FROM information_schema.tables");
      console.log(`Available tables/views in ${casaDb}:`);
      console.log(tablesResult.recordset.map(t => `${t.table_name} (${t.table_type})`).join(', '));
      
      // Try to query the view
      try {
        const clientResult = await pool.request().query('SELECT TOP 5 * FROM App.ClientesMay');
        console.log(`\nSuccessfully queried 5 clients from App.ClientesMay`);
        console.log(clientResult.recordset);
      } catch (e) {
        console.log(`Could not query App.ClientesMay: ${e.message}`);
      }
    }

    pool.close();
  } catch (err) {
    console.error('MSSQL Error:', err.message);
  }
}

testConnection();
