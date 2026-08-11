const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const secret = (process.env.JWT_SECRET || 'fallback-jwt-secret') + (process.env.NODE_ENV === 'test' ? '' : '-v2');
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'No autorizado' });
  }
};
