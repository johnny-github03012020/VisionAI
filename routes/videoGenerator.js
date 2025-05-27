const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const authController = require('../controllers/authController');

// Todas las rutas requieren autenticación
router.use(authController.verifyToken);

// Rutas para generación y gestión de videos
router.post('/generate', videoController.generateVideo);
router.get('/', videoController.getAllVideos);
router.get('/:id', videoController.getVideoById);
router.get('/:id/status', videoController.getVideoStatus);
router.delete('/:id', videoController.deleteVideo);

module.exports = router;