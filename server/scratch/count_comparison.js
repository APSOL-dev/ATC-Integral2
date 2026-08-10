const sql = require('mssql');
const { sheets, SPREADSHEET_ID } = require('../src/config/sheets');
require('dotenv').config();

const mssqlConfig = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_HOST,
  port: parseInt(process.env.MSSQL_PORT, 10),
  database: process.env.MSSQL_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    requestTimeout: 30000,
  }
};

async function countComparison() {
  console.log('--- STARTING COUNT COMPARISON ---');
  let pool;

  try {
    // 1. Google Sheets count
    console.log('Fetching data from Google Sheets...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Pedidos!A:A',
    });
    
    const rows = response.data.values || [];
    const sheetIds = new Set();
    rows.forEach((row, index) => {
      if (index === 0) return; // skip header
      const idStr = row[0];
      if (idStr && idStr.trim() !== '') {
        const idNum = parseInt(idStr.trim(), 10);
        if (!isNaN(idNum)) {
          sheetIds.add(idNum);
        }
      }
    });
    
    const sheetsCount = sheetIds.size;
    console.log(`✅ Unique order IDs in Sheets: ${sheetsCount}`);

    // 2. SQL Database count & retrieve detailed data
    console.log('\nConnecting to SQL Database...');
    pool = await sql.connect(mssqlConfig);
    const sqlResult = await pool.request()
      .query('SELECT IDPedido, Fecha_Hora, Estado FROM AppTransacciones.PedidoAppCabe');
    
    const sqlOrders = sqlResult.recordset;
    const sqlCount = sqlOrders.length;
    console.log(`✅ Unique order IDs in SQL (PedidoAppCabe): ${sqlCount}`);

    // 3. Find SQL-only orders
    const sqlOnlyOrders = [];
    sqlOrders.forEach(order => {
      if (!sheetIds.has(order.IDPedido)) {
        sqlOnlyOrders.push(order);
      }
    });

    console.log(`\nFound ${sqlOnlyOrders.length} orders only in SQL Server.`);

    if (sqlOnlyOrders.length > 0) {
      // Analyze states
      const stateCounts = {};
      // Analyze dates (e.g. by Year-Month or Year)
      const dateCounts = {};

      sqlOnlyOrders.forEach(order => {
        // State
        const state = String(order.Estado || 'UNKNOWN').trim();
        stateCounts[state] = (stateCounts[state] || 0) + 1;

        // Date
        let dateKey = 'No Date';
        if (order.Fecha_Hora) {
          const d = new Date(order.Fecha_Hora);
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            dateKey = `${year}-${month}`;
          }
        }
        dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
      });

      console.log('\n--- ANALYSIS OF SQL-ONLY ORDERS ---');
      
      console.log('\n1. Grouped by Estado:');
      console.table(
        Object.keys(stateCounts).map(state => ({
          Estado: state,
          Cantidad: stateCounts[state]
        })).sort((a, b) => b.Cantidad - a.Cantidad)
      );

      console.log('\n2. Grouped by Month (YYYY-MM):');
      console.table(
        Object.keys(dateCounts).map(date => ({
          Mes: date,
          Cantidad: dateCounts[date]
        })).sort((a, b) => b.Cantidad - a.Cantidad)
      );

      console.log('\n3. Sample of SQL-only orders (First 20):');
      const sample = sqlOnlyOrders.slice(0, 20).map(order => ({
        IDPedido: order.IDPedido,
        Fecha: order.Fecha_Hora ? new Date(order.Fecha_Hora).toLocaleString() : 'N/A',
        Estado: order.Estado
      }));
      console.table(sample);
    }

  } catch (err) {
    console.error('❌ Error during comparison:', err.message);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\nDatabase connection closed.');
    }
  }
}

countComparison();
