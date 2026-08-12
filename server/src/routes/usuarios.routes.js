const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabase.service');
const auth = require('../middlewares/auth');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Memory store fallback for user lockout
const memoryLockouts = new Map();

// Configure rate limiter: max 5 requests per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: 'Demasiados intentos de inicio de sesión. Por favor, intente de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Helper to ensure header columns exist (No-op in Supabase as columns are defined in PostgreSQL schema)
async function ensureHeaders() {
  return ['Nombre de usuario', 'Contraseña', 'Perfil', 'NRO_VENDEDOR', 'Activo', 'Intentos fallidos', 'Bloqueado hasta'];
}

// Get all users from Supabase public view (Protected)
router.get('/', auth, async (req, res) => {
  try {
    const users = await supabaseService.getRows('atc_usuarios_v');
    
    // Sanitize for list (remove passwords)
    const sanitized = users.map(u => ({
      'Nombre de usuario': String(u['Nombre de usuario'] || '').trim(),
      'Perfil': u['Perfil'],
      'NRO_VENDEDOR': u['NRO_VENDEDOR'] || null,
      'Activo': u['Activo'] !== 'FALSE' && u['Activo'] !== 'Inactivo' && u['Activo'] !== false
    }));
    
    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// Login endpoint
router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const users = await supabaseService.getRows('atc_usuarios_v');
    
    // Find user by username case-insensitive
    const foundUser = users.find(u => 
      String(u['Nombre de usuario'] || '').trim().toLowerCase() === String(username || '').trim().toLowerCase()
    );

    if (foundUser) {
      // Check if account is locked out
      let attempts = foundUser['Intentos fallidos'] || 0;
      let lockedUntil = foundUser['Bloqueado hasta'] ? new Date(foundUser['Bloqueado hasta']) : null;

      // Merge with memory fallback
      const mem = memoryLockouts.get(username.toLowerCase());
      if (mem) {
        attempts = Math.max(attempts, mem.attempts);
        if (mem.lockedUntil && (!lockedUntil || mem.lockedUntil > lockedUntil)) {
          lockedUntil = mem.lockedUntil;
        }
      }

      if (lockedUntil && lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / (60 * 1000));
        return res.status(403).json({ 
          message: `La cuenta está bloqueada temporalmente por exceso de intentos fallidos. Intente de nuevo en ${minutesLeft} minutos.` 
        });
      }

      // Check if password matches
      const isPasswordCorrect = String(foundUser['Contraseña'] || '').trim() === String(password || '').trim();

      if (isPasswordCorrect) {
        if (foundUser['Activo'] === 'FALSE' || foundUser['Activo'] === 'Inactivo' || foundUser['Activo'] === false) {
          return res.status(403).json({ message: 'Usuario inactivo' });
        }
        
        // Reset attempts on successful login
        if (attempts > 0 || lockedUntil) {
          try {
            await supabaseService.updateRows('atc_usuarios_v', 
              { 'Nombre de usuario': foundUser['Nombre de usuario'] },
              { 'Intentos fallidos': 0, 'Bloqueado hasta': null }
            );
          } catch (err) {
            console.warn('Database error resetting attempts, using memory fallback:', err.message);
          }
          memoryLockouts.delete(username.toLowerCase());
        }

        // Sign JWT token
        const token = jwt.sign(
          { 
            nombre: foundUser['Nombre de usuario'], 
            perfil: foundUser['Perfil'], 
            nroVendedor: foundUser['NRO_VENDEDOR'] || null 
          },
          (process.env.JWT_SECRET || 'fallback-jwt-secret') + (process.env.NODE_ENV === 'test' ? '' : '-v2'),
          { expiresIn: '30d' }
        );
        
        // Return user data with token (omit password)
        const userData = {
          nombre: foundUser['Nombre de usuario'],
          perfil: foundUser['Perfil'],
          nroVendedor: foundUser['NRO_VENDEDOR'] || null,
          token
        };
        
        return res.json(userData);
      } else {
        // Password incorrect - increment attempts
        const newAttempts = attempts + 1;
        let nextLock = null;
        if (newAttempts >= 5) {
          nextLock = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        }

        try {
          await supabaseService.updateRows('atc_usuarios_v',
            { 'Nombre de usuario': foundUser['Nombre de usuario'] },
            { 
              'Intentos fallidos': newAttempts, 
              'Bloqueado hasta': nextLock ? nextLock.toISOString() : null 
            }
          );
        } catch (err) {
          console.warn('Database error persisting login attempts, using memory fallback:', err.message);
        }
        
        memoryLockouts.set(username.toLowerCase(), { 
          attempts: newAttempts, 
          lockedUntil: nextLock 
        });

        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
    } else {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Error en el servidor' });
  }
});

// POST /: Create a new user (Protected)
router.post('/', auth, async (req, res) => {
  const { nombre, perfil, legajo, password } = req.body;
  
  if (!nombre || !perfil) {
    return res.status(400).json({ message: 'Nombre de usuario y Perfil son requeridos' });
  }
  
  try {
    const users = await supabaseService.getRows('atc_usuarios_v');
    
    const exists = users.some(u => 
      String(u['Nombre de usuario'] || '').trim().toLowerCase() === String(nombre).trim().toLowerCase()
    );
    
    if (exists) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }
    
    const newUser = {
      'Nombre de usuario': String(nombre).trim(),
      'Contraseña': password || 'ATC123',
      'Perfil': perfil,
      'NRO_VENDEDOR': legajo || null,
      'Activo': 'TRUE'
    };
    
    await supabaseService.upsertRow('atc_usuarios_v', newUser);
    
    res.status(201).json({
      'Nombre de usuario': newUser['Nombre de usuario'],
      'Perfil': newUser['Perfil'],
      'NRO_VENDEDOR': newUser['NRO_VENDEDOR'] || null,
      'Activo': true
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error al crear usuario' });
  }
});

// PUT /:username: Edit user details (Protected)
router.put('/:username', auth, async (req, res) => {
  const { username } = req.params;
  const { nombre, perfil, legajo } = req.body;
  
  try {
    const users = await supabaseService.getRows('atc_usuarios_v');
    
    const index = users.findIndex(u => 
      String(u['Nombre de usuario'] || '').trim().toLowerCase() === String(username).trim().toLowerCase()
    );
    
    if (index === -1) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    const originalUser = users[index];
    const updatedUser = {
      'Nombre de usuario': nombre ? String(nombre).trim() : originalUser['Nombre de usuario'],
      'Perfil': perfil || originalUser['Perfil'],
      'NRO_VENDEDOR': legajo !== undefined ? legajo : originalUser['NRO_VENDEDOR']
    };
    
    await supabaseService.updateRows('atc_usuarios_v', { 'Nombre de usuario': originalUser['Nombre de usuario'] }, updatedUser);
    
    res.json({
      'Nombre de usuario': updatedUser['Nombre de usuario'],
      'Perfil': updatedUser['Perfil'],
      'NRO_VENDEDOR': updatedUser['NRO_VENDEDOR'] || null,
      'Activo': originalUser['Activo'] !== 'FALSE' && originalUser['Activo'] !== 'Inactivo' && originalUser['Activo'] !== false
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

// PATCH /:username/status: Toggle active status (Protected)
router.patch('/:username/status', auth, async (req, res) => {
  const { username } = req.params;
  const { activo } = req.body;
  
  try {
    const users = await supabaseService.getRows('atc_usuarios_v');
    
    const user = users.find(u => 
      String(u['Nombre de usuario'] || '').trim().toLowerCase() === String(username).trim().toLowerCase()
    );
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    await supabaseService.updateRows('atc_usuarios_v', { 'Nombre de usuario': user['Nombre de usuario'] }, {
      'Activo': activo ? 'TRUE' : 'FALSE'
    });
    
    res.json({
      'Nombre de usuario': user['Nombre de usuario'],
      'Perfil': user['Perfil'],
      'NRO_VENDEDOR': user['NRO_VENDEDOR'] || null,
      'Activo': !!activo
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Error al cambiar estado del usuario' });
  }
});

// PATCH /:username/password: Change password (Protected)
router.patch('/:username/password', auth, async (req, res) => {
  const { username } = req.params;
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ message: 'La contraseña es requerida' });
  }
  
  try {
    const users = await supabaseService.getRows('atc_usuarios_v');
    
    const user = users.find(u => 
      String(u['Nombre de usuario'] || '').trim().toLowerCase() === String(username).trim().toLowerCase()
    );
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    await supabaseService.updateRows('atc_usuarios_v', { 'Nombre de usuario': user['Nombre de usuario'] }, {
      'Contraseña': String(password).trim()
    });
    
    res.json({ message: 'Contraseña actualizada con éxito' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error al cambiar contraseña' });
  }
});

module.exports = router;
