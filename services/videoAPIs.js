const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configuración de APIs
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;

// Directorio para archivos temporales
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Genera imágenes usando la API de Stability AI
 * @param {string} prompt - Descripción de la imagen a generar
 * @param {string} style - Estilo de la imagen
 * @param {number} count - Número de imágenes a generar
 * @returns {Promise<Array>} - Array de URLs o paths de las imágenes generadas
 */
async function generateImagesWithStability(prompt, style = 'photorealistic', count = 4) {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${STABILITY_API_KEY}`
      },
      data: {
        text_prompts: [
          {
            text: prompt,
            weight: 1
          }
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: count,
        steps: 30,
        style_preset: style
      }
    });

    // Guardar imágenes localmente
    const images = [];
    for (let i = 0; i < response.data.artifacts.length; i++) {
      const artifact = response.data.artifacts[i];
      const imagePath = path.join(tempDir, `${uuidv4()}.png`);
      
      // Decodificar base64 y guardar como archivo
      fs.writeFileSync(imagePath, Buffer.from(artifact.base64, 'base64'));
      images.push(imagePath);
    }

    return images;
  } catch (error) {
    console.error('Error generando imágenes con Stability AI:', error.response?.data || error.message);
    throw new Error('Error al generar imágenes');
  }
}

/**
 * Genera texto descriptivo usando OpenAI
 * @param {string} prompt - Prompt inicial para generar el texto
 * @returns {Promise<string>} - Texto generado
 */
async function generateTextWithOpenAI(prompt) {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      data: {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente creativo especializado en crear descripciones detalladas para escenas de video.'
          },
          {
            role: 'user',
            content: `Basado en esta idea: "${prompt}", genera una descripción detallada para 4 escenas de video que se puedan usar para crear un video corto. Cada escena debe ser clara y visual.`
          }
        ],
        max_tokens: 500
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error generando texto con OpenAI:', error.response?.data || error.message);
    throw new Error('Error al generar texto descriptivo');
  }
}

module.exports = {
  generateImagesWithStability,
  generateTextWithOpenAI
};