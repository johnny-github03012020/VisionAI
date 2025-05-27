// Middleware de autenticación temporal para desarrollo
const authMiddleware = (req, res, next) => {
    // Para desarrollo, permitimos todas las solicitudes sin autenticación
    // En producción, esto debería verificar tokens JWT o sesiones
    
    // Simular usuario autenticado para desarrollo
    req.user = {
        id: 'dev-user-id',
        username: 'developer',
        email: 'dev@example.com',
        role: 'admin'
    };
    
    next();
};

module.exports = authMiddleware;