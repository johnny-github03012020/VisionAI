const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const authController = require('../controllers/authController');
const path = require('path');
const fs = require('fs');

// Middleware de autenticación para todas las rutas
router.use(authController.verifyToken);

// Ruta para descargar un video (debe ir ANTES de las rutas con parámetros genéricos)
router.get('/download/:id', (req, res) => {
  const videoId = req.params.id;
  const videoPath = path.join(__dirname, '..', 'public', 'videos', `${videoId}.mp4`);
  
  if (fs.existsSync(videoPath)) {
    res.download(videoPath, `video_${videoId}.mp4`);
  } else {
    res.status(404).json({ message: 'Video no encontrado' });
  }
});

// Rutas para la generación y gestión de videos
router.post('/generate', videoController.generateVideo);
router.get('/', videoController.getAllVideos);
router.get('/:id', videoController.getVideoById);
router.get('/:id/status', videoController.getVideoStatus);
router.delete('/:id', videoController.deleteVideo);

module.exports = router;