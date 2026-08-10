import React from 'react';

const OrdersTable = ({ data }) => (
  <div className="card area-orders" style={{ height: '100%' }}>
    <div className="card-title">Tabla de los pedidos</div>
    <div style={{ overflowY: 'auto', flexGrow: 1 }}>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Vendedor</th>
            <th>Estado</th>
            <th>Importe</th>
          </tr>
        </thead>
        <tbody>
          {data.map((order, idx) => (
            <tr key={idx}>
              <td>{order.date}</td>
              <td>{order.client}</td>
              <td>{order.seller}</td>
              <td><span className={`status-pill pill-${getStatusColor(order.status)}`}>{order.status}</span></td>
              <td><strong>{order.amount}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const getStatusColor = (status) => {
  switch (status) {
    case 'Completado': return 'green';
    case 'Pendiente': return 'yellow';
    case 'Cancelado': return 'magenta';
    case 'En Producción': return 'cyan';
    default: return 'black';
  }
};

export default OrdersTable;
