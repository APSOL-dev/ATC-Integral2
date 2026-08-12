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

let activePool = null;
let connectionPromise = null;

async function getOrConnectPool() {
  if (activePool && activePool.connected) {
    return activePool;
  }

  if (connectionPromise) {
    try {
      const pool = await connectionPromise;
      if (pool && pool.connected) {
        return pool;
      }
    } catch (err) {
      // Ignore to allow retry
    }
  }

  console.log('🔄 Attempting to connect to MSSQL...');
  connectionPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
      console.log('✅ Connected to MSSQL (Casa29)');
      activePool = pool;
      connectionPromise = null;
      return pool;
    })
    .catch(err => {
      console.error('❌ MSSQL Connection Failed:', err.message);
      activePool = null;
      connectionPromise = null;
      return null;
    });

  return connectionPromise;
}

const poolPromise = {
  then: function(onFulfilled, onRejected) {
    return getOrConnectPool().then(onFulfilled, onRejected);
  }
};

// Trigger initial connection attempt in background
getOrConnectPool().catch(() => {});

module.exports = {
  sql,
  poolPromise
};
