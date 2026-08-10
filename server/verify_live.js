async function verify() {
  try {
    const res = await fetch('http://localhost:3025/api/pedidos');
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Total orders fetched:', data.length);
    if (data.length > 0) {
      console.log('Sample order ID:', data[0].IDPedido);
    }
  } catch (err) {
    console.error('Fetch failed:', err.message);
  }
}
verify();
