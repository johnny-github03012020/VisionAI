const express = require('express');
const router = express.Router();

// Middleware temporal para desarrollo
const tempAuthMiddleware = (req, res, next) => {
    // Para desarrollo, permitimos todas las solicitudes sin autenticación
    req.user = {
        id: 'dev-user-id',
        username: 'developer',
        email: 'dev@example.com',
        role: 'admin'
    };
    next();
};

// Ruta para verificar si el usuario está autenticado
router.get('/me', tempAuthMiddleware, (req, res) => {
    res.json({
        authenticated: true,
        user: req.user
    });
});

// Ruta para iniciar sesión
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // Validar campos
    if (!username || !password) {
        return res.status(400).json({ error: 'Se requieren nombre de usuario y contraseña' });
    }
    
    // Para desarrollo, aceptamos cualquier credencial
    res.json({
        success: true,
        user: {
            id: 'dev-user-id',
            username: username,
            email: `${username}@example.com`,
            role: 'user'
        },
        token: 'dev-token-' + Date.now()
    });
});

// Ruta para registrarse
router.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    
    // Validar campos
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Se requieren todos los campos' });
    }
    
    // Para desarrollo, aceptamos cualquier registro
    res.json({
        success: true,
        message: 'Usuario registrado correctamente'
    });
});

// Ruta para cerrar sesión
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Sesión cerrada correctamente'
    });
});

module.exports = router;