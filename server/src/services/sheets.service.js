const { sheets, SPREADSHEET_ID } = require('../config/sheets');

/**
 * Smart in-memory cache for Sheets reads.
 * - Only caches non-empty results (never caches empty arrays)
 * - TTL: 2 minutes
 * - Invalidated by any write operation
 */
const cache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

function clearCache() {
  cache.clear();
}

/**
 * Gets all rows from a given sheet, with smart caching.
 * @param {string} range e.g., 'Pedidos!A2:Z'
 */
async function getRows(range) {
  const now = Date.now();
  const cached = cache.get(range);

  // Only use cache if it has real data (non-empty) and hasn't expired
  if (cached && cached.data.length > 1 && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: range,
  });

  const data = response.data.values || [];

  // Only cache if we got real data back
  if (data.length > 1) {
    cache.set(range, { data, timestamp: now });
  }

  return data;
}

/**
 * Appends a row to a given sheet
 * @param {string} range e.g., 'Pedidos!A:Z'
 * @param {Array} values Array of values representing the row
 */
async function appendRow(range, values) {
  clearCache();
  return appendRows(range, [values]);
}

/**
 * Appends multiple rows to a given sheet
 * @param {string} range e.g., 'Pedidos!A:Z'
 * @param {Array<Array>} rows Array of arrays representing the rows
 */
async function appendRows(range, rows) {
  clearCache();
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: rows,
    },
  });
  return response.data;
}

/**
 * Updates a row in a given sheet
 * @param {string} range e.g., 'Pedidos!A5:Z5'
 * @param {Array} values Array of values representing the row
 */
async function updateRow(range, values) {
  clearCache();
  const response = await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [values],
    },
  });
  return response.data;
}

/**
 * Updates multiple rows in a given sheet
 * @param {string} range e.g., 'Pedidos!A5:Z10'
 * @param {Array<Array>} rows Array of arrays representing the rows
 */
async function updateRows(range, rows) {
  clearCache();
  const response = await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: range,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: rows,
    },
  });
  return response.data;
}

/**
 * Updates multiple ranges across sheets in a single HTTP batch request.
 * @param {Array<{range: string, values: Array<Array>}>} data
 */
async function batchUpdateValues(data) {
  clearCache();
  if (!Array.isArray(data) || data.length === 0) return;
  const response = await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    resource: {
      valueInputOption: 'USER_ENTERED',
      data: data,
    },
  });
  return response.data;
}

module.exports = {
  getRows,
  appendRow,
  appendRows,
  updateRow,
  updateRows,
  batchUpdateValues,
  clearCache
};
