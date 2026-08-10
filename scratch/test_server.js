
fetch('http://localhost:3000/api/health')
  .then(res => res.json())
  .then(data => console.log('Health check:', data))
  .catch(err => console.error('Health check failed:', err.message));
