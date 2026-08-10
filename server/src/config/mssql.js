const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_HOST,
  port: parseInt(process.env.MSSQL_PORT, 10),
  database: process.env.MSSQL_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    requestTimeout: 60000,
    connectionTimeout: 60000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ Connected to MSSQL (Casa29)');
    return pool;
  })
  .catch(err => {
    console.error('❌ MSSQL Connection Failed:', err.message);
    // Don't throw - allow server to keep running without MSSQL
    return null;
  });

module.exports = {
  sql,
  poolPromise
};
