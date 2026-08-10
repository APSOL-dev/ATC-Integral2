const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const authOptions = {
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
};

let googleCredsCargadas = false;

if (process.env.GOOGLE_CREDS_JSON) {
  try {
    let credsStr = process.env.GOOGLE_CREDS_JSON.trim();
    
    // Strip wrapping quotes if present
    if (credsStr.startsWith("'") && credsStr.endsWith("'")) {
      credsStr = credsStr.slice(1, -1);
    }
    if (credsStr.startsWith('"') && credsStr.endsWith('"')) {
      credsStr = credsStr.slice(1, -1);
    }

    const parsed = JSON.parse(credsStr);

    // Ensure real newlines in private_key (env vars store them as literal \n)
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }

    authOptions.credentials = parsed;
    googleCredsCargadas = true;
  } catch (err) {
    console.error('❌ [sheets.js] Error parsing GOOGLE_CREDS_JSON:', err.message);
  }
} else {
  const keyFilePath = path.resolve(__dirname, '../../credentials/google-service-account.json');
  authOptions.keyFile = keyFilePath;
  googleCredsCargadas = true;
}

console.log(`📋 [sheets.js] Credenciales de Google cargadas correctamente: ${googleCredsCargadas}`);

const auth = new google.auth.GoogleAuth(authOptions);

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

module.exports = {
  sheets,
  SPREADSHEET_ID
};
