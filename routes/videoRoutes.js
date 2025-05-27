const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware);

// Generar video
router.post('/generate', (req, res) => {
    // Implementación de generación de video
    const { prompt, provider, style, duration } = req.body;
    
    // Validar parámetros
    if (!prompt) {
        return res.status(400).json({ error: 'Se requiere una descripción del video' });
    }
    
    // Simular generación para desarrollo
    const videoId = 'video_' + Date.now();
    
    // Responder con ID de generación
    res.json({ 
        success: true, 
        message: 'Generación iniciada', 
        videoId: videoId 
    });
});

// Obtener todos los videos
router.get('/', (req, res) => {
    // Simular lista de videos para desarrollo
    const videos = [
        {
            id: 'video_1',
            title: 'Video de ejemplo 1',
            description: 'Un hermoso atardecer en la playa',
            url: '/videos/sample1.mp4',
            thumbnail: '/img/thumbnail1.jpg',
            createdAt: new Date().toISOString(),
            style: 'cinematic',
            duration: 4,
            provider: 'OLLAMA'
        },
        {
            id: 'video_2',
            title: 'Video de ejemplo 2',
            description: 'Montañas nevadas al amanecer',
            url: '/videos/sample2.mp4',
            thumbnail: '/img/thumbnail2.jpg',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            style: 'realistic',
            duration: 6,
            provider: 'OPENAI'
        }
    ];
    
    res.json({ videos });
});

// Obtener un video específico
router.get('/:id', (req, res) => {
    const videoId = req.params.id;
    
    // Simular video para desarrollo
    const video = {
        id: videoId,
        title: 'Video de ejemplo',
        description: 'Descripción del video de ejemplo',
        url: '/videos/sample.mp4',
        thumbnail: '/img/thumbnail.jpg',
        createdAt: new Date().toISOString(),
        style: 'cinematic',
        duration: 4,
        provider: 'OLLAMA'
    };
    
    res.json(video);
});

// Eliminar un video
router.delete('/:id', (req, res) => {
    const videoId = req.params.id;
    
    // Simular eliminación para desarrollo
    res.json({ success: true, message: 'Video eliminado correctamente' });
});

module.exports = router;