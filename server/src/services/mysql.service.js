const pool = require('../config/mysql');

async function getClientes() {
  const [rows] = await pool.query('SELECT * FROM `App.ClientesMay`');
  return rows;
}

async function getClienteById(id) {
  const [rows] = await pool.query('SELECT * FROM `App.ClientesMay` WHERE NRO_CLIENTE = ?', [id]);
  return rows[0];
}

async function getProductos() {
  const [rows] = await pool.query('SELECT * FROM `App.Productos`');
  return rows;
}

async function getVendedores() {
  const [rows] = await pool.query('SELECT * FROM `App.Vendedores`');
  return rows;
}

module.exports = {
  getClientes,
  getClienteById,
  getProductos,
  getVendedores
};
