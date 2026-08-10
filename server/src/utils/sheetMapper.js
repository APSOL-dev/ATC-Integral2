/**
 * Maps spreadsheet rows to objects using the first row as headers.
 */
function rowsToObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(h => String(h || '').trim());
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      if (header) obj[header] = row[index];
    });
    return obj;
  });
}

/**
 * Maps an object to a spreadsheet row based on headers.
 */
function objectToRow(obj, headers) {
  return headers.map(header => {
    const cleanHeader = String(header || '').trim();
    return obj[cleanHeader] || obj[header] || '';
  });
}

module.exports = {
  rowsToObjects,
  objectToRow
};
