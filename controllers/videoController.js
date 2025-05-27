const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const videoService = require('../services/videoService');

// Simulación de base de datos de videos (en producción usarías MongoDB)
const videos = [];

// Asegurar que existan los directorios necesarios
const uploadDir = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || '../uploads');
const tempDir = path.resolve(__dirname, '..', process.env.TEMP_DIR || '../uploads/temp');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

exports.generateVideo = async (req, res) => {
  try {
    const { prompt, duration = process.env.DEFAULT_DURATION, style = process.env.DEFAULT_VIDEO_STYLE, provider = process.env.DEFAULT_AI_PROVIDER } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: 'Se requiere un prompt para generar el video' });
    }
    
    // Validar duración
    const parsedDuration = parseInt(duration);
    if (parsedDuration > parseInt(process.env.MAX_VIDEO_DURATION)) {
      return res.status(400).json({ 
        message: `La duración máxima permitida es ${process.env.MAX_VIDEO_DURATION} segundos` 
      });
    }
    
    // ID único para el video
    const videoId = uuidv4();
    const outputPath = path.join(uploadDir, `${videoId}.mp4`);
    
    // Registro del video en nuestra "base de datos"
    const newVideo = {
      id: videoId,
      userId: req.user.id,
      prompt,
      style,
      duration: parsedDuration,
      provider,
      status: 'processing',
      createdAt: new Date(),
      path: `/videos/${videoId}.mp4`
    };
    
    videos.push(newVideo);
    
    // Respuesta inmediata mientras el video se procesa
    res.status(202).json({
      message: 'Video en proceso de generación',
      videoId,
      status: 'processing'
    });
    
    // Procesamiento asíncrono
    try {
      // Generar el video
      await videoService.generateVideo({
        id: videoId,
        prompt,
        style,
        duration: parsedDuration,
        provider,
        outputPath
      });
      
      // Actualizar estado del video
      const videoIndex = videos.findIndex(v => v.id === videoId);
      if (videoIndex !== -1) {
        videos[videoIndex].status = 'completed';
      }
    } catch (error) {
      console.error('Error al generar video:', error);
      
      // Actualizar estado a error
      const videoIndex = videos.findIndex(v => v.id === videoId);
      if (videoIndex !== -1) {
        videos[videoIndex].status = 'error';
        videos[videoIndex].error = error.message;
      }
    }
    
  } catch (error) {
    console.error('Error al procesar solicitud de video:', error);
    res.status(500).json({ message: 'Error al generar el video', error: error.message });
  }
};

exports.getAllVideos = (req, res) => {
  // Filtrar videos por usuario actual
  const userVideos = videos.filter(video => video.userId === req.user.id);
  res.json(userVideos);
};

exports.getVideoById = (req, res) => {
  const { id } = req.params;
  const video = videos.find(v => v.id === id && v.userId === req.user.id);
  
  if (!video) {
    return res.status(404).json({ message: 'Video no encontrado' });
  }
  
  res.json(video);
};

exports.getVideoStatus = (req, res) => {
  const { id } = req.params;
  const video = videos.find(v => v.id === id && v.userId === req.user.id);
  
  if (!video) {
    return res.status(404).json({ message: 'Video no encontrado' });
  }
  
  res.json({
    id: video.id,
    status: video.status,
    error: video.error
  });
};

exports.deleteVideo = (req, res) => {
  const { id } = req.params;
  const videoIndex = videos.findIndex(v => v.id === id && v.userId === req.user.id);
  
  if (videoIndex === -1) {
    return res.status(404).json({ message: 'Video no encontrado' });
  }
  
  // Eliminar archivo físico si existe
  const videoPath = path.join(uploadDir, `${id}.mp4`);
  if (fs.existsSync(videoPath)) {
    fs.unlinkSync(videoPath);
  }
  
  // Eliminar de la "base de datos"
  videos.splice(videoIndex, 1);
  
  res.json({ message: 'Video eliminado correctamente' });
};