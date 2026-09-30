const sql = require('mssql');
const dns = require('dns');
const { Resolver } = require('dns').promises;
require('dotenv').config();

// Ensure Node.js resolves IPv4 addresses first (avoids IPv6 hanging timeouts with DDNS)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const config = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_HOST,
  port: parseInt(process.env.MSSQL_PORT, 10),
  database: process.env.MSSQL_DATABASE,
  connectionTimeout: 30000,
  requestTimeout: 60000,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 60000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
    acquireTimeoutMillis: 30000,
  }
};

// Helper to proactively resolve DDNS hostnames directly via public DNS (Google/Cloudflare)
// to bypass Docker / VPS local DNS proxy limitations with CNAME chains
async function resolveHostToIp(hostname) {
  if (!hostname) return hostname;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return hostname;

  // 1. Try system DNS lookup
  try {
    const res = await dns.promises.lookup(hostname, { family: 4 });
    if (res && res.address) {
      return res.address;
    }
  } catch (err) {
    // Continue to public DNS fallback
  }

  // 2. Try public DNS (Google 8.8.8.8 / Cloudflare 1.1.1.1)
  try {
    const publicResolver = new Resolver();
    publicResolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    const ips = await publicResolver.resolve4(hostname);
    if (ips && ips.length > 0) {
      return ips[0];
    }
  } catch (err) {
    // Continue to DDNS fallback
  }

  // 3. Fallback specifically for ATC dynamic DNS chain
  if (hostname === 'sj.atodocolor.com.ar' || hostname === 'atc.fw-precixo.com.ar') {
    try {
      const publicResolver = new Resolver();
      publicResolver.setServers(['8.8.8.8', '1.1.1.1']);
      const ips = await publicResolver.resolve4('oficinapuerto01.ddns.net');
      if (ips && ips.length > 0) {
        return ips[0];
      }
    } catch (e) {}
  }

  return hostname;
}

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

  const targetHost = process.env.MSSQL_HOST || 'sj.atodocolor.com.ar';
  const targetPort = parseInt(process.env.MSSQL_PORT, 10) || 8888;
  const resolvedIp = await resolveHostToIp(targetHost);

  console.log(`🔄 Attempting to connect to MSSQL (${resolvedIp}:${targetPort})...`);

  const dynamicConfig = {
    ...config,
    server: resolvedIp,
    port: targetPort,
  };

  connectionPromise = new sql.ConnectionPool(dynamicConfig)
    .connect()
    .then(pool => {
      console.log(`✅ Connected to MSSQL (Casa29 at ${resolvedIp})`);
      activePool = pool;
      connectionPromise = null;

      // Handle individual connection errors without destroying the entire healthy pool
      pool.on('error', err => {
        console.warn('⚠️ MSSQL Pool socket warning (auto-managed by pool):', err.message);
        if (pool && !pool.connected) {
          activePool = null;
        }
      });

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
  config,
  poolPromise,
  getOrConnectPool,
  resolveHostToIp,
  resetPool: () => {
    if (activePool) {
      try { activePool.close(); } catch (e) {}
      activePool = null;
    }
    connectionPromise = null;
  }
};
