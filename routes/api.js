const express = require('express');
const router = express.Router();

// Ruta de estado de la API
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// Ruta para obtener la configuración de la aplicación
router.get('/config', (req, res) => {
  // Enviar solo la configuración segura (no API keys)
  res.json({
    videoStyles: [
      'cinematic', 'realistic', 'cartoon', 'anime', 
      'digital-art', 'fantasy', 'abstract'
    ],
    defaultSettings: {
      fps: process.env.DEFAULT_FPS,
      duration: process.env.DEFAULT_DURATION,
      style: process.env.DEFAULT_VIDEO_STYLE
    },
    limits: {
      maxDuration: process.env.MAX_VIDEO_DURATION,
      maxLength: process.env.MAX_VIDEO_LENGTH
    },
    features: {
      textToSpeech: process.env.ENABLE_TEXT_TO_SPEECH === 'true',
      backgroundMusic: process.env.ENABLE_BACKGROUND_MUSIC === 'true'
    },
    aiProviders: {
      default: process.env.DEFAULT_AI_PROVIDER,
      openSource: [
        'OLLAMA', 'HUGGINGFACE', 'LOCALAI', 'OOBABOOGA'
      ],
      commercial: [
        'OPENAI', 'STABILITY', 'RUNWAY'
      ]
    }
  });
});

module.exports = router;