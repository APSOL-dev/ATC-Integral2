require('dotenv').config();
const mssql = require('./src/services/mssql.service');

async function test() {
  try {
    console.log('Testing Vendedor Mapping...');
    const vendedores = await mssql.getVendedores();
    const vdorId = '22'; // Sample ID from user
    
    const vdorObj = vendedores.find(v => {
      const sqlVdor = String(v.VDOR || '');
      const sqlAlias = String(v.ALIAS || '').toLowerCase();
      const sqlNombre = String(v.NOMBRE || '').toLowerCase();
      const searchId = vdorId.toLowerCase();

      if (parseInt(sqlVdor) === parseInt(searchId) && !isNaN(parseInt(sqlVdor))) return true;
      if (sqlVdor === searchId) return true;
      if (sqlAlias === searchId) return true;
      if (sqlNombre === searchId) return true;
      return false;
    });

    if (vdorObj) {
      console.log('SUCCESS: Found mapping for 22 ->', vdorObj.NOMBRE);
    } else {
      console.log('FAILED: No mapping found for 22');
    }
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit(0);
}

test();
