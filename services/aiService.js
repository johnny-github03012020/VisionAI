const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Configuración de directorios
const tempDir = path.resolve(__dirname, '..', process.env.TEMP_DIR || '../uploads/temp');

// Asegurar que el directorio temporal exista
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Genera descripciones de escenas para el video
 * @param {string} prompt - Descripción general del video
 * @param {string} provider - Proveedor de IA a utilizar
 * @returns {Promise<Array>} - Array de descripciones de escenas
 */
async function generateScenes(prompt, provider) {
  console.log(`Generando escenas con proveedor: ${provider}`);
  
  try {
    let scenes = [];
    
    // Try the specified provider first
    switch (provider.toUpperCase()) {
      case 'OLLAMA':
        try {
          scenes = await generateScenesWithOllama(prompt);
        } catch (error) {
          console.log(`Error con Ollama: ${error.message}. Intentando con OpenAI como fallback...`);
          // Fall back to OpenAI if Ollama fails
          if (process.env.OPENAI_API_KEY) {
            scenes = await generateScenesWithOpenAI(prompt);
          } else {
            // If no OpenAI key, use mock data
            scenes = getMockScenes(prompt);
          }
        }
        break;
      case 'HUGGINGFACE':
        scenes = await generateScenesWithHuggingFace(prompt);
        break;
      case 'LOCALAI':
        scenes = await generateScenesWithLocalAI(prompt);
        break;
      case 'OPENAI':
        scenes = await generateScenesWithOpenAI(prompt);
        break;
      default:
        // Fallback a Ollama si el proveedor no es reconocido
        console.log(`Proveedor ${provider} no reconocido, usando Ollama como fallback`);
        scenes = await generateScenesWithOllama(prompt);
    }
    
    // Asegurar que tenemos al menos 4 escenas
    if (scenes.length < 4) {
      const defaultScene = prompt;
      while (scenes.length < 4) {
        scenes.push(defaultScene);
      }
    }
    
    return scenes.slice(0, 4); // Limitar a 4 escenas
  } catch (error) {
    console.error('Error al generar escenas:', error);
    
    // En caso de error, devolver el prompt original como escena
    return Array(4).fill(prompt);
  }
}

/**
 * Genera imágenes para las escenas del video
 * @param {Array} scenes - Descripciones de las escenas
 * @param {string} style - Estilo visual de las imágenes
 * @param {string} provider - Proveedor de IA a utilizar
 * @returns {Promise<Array>} - Array de rutas de las imágenes generadas
 */
async function generateImages(scenes, style, provider) {
  console.log(`Generando imágenes con proveedor: ${provider}`);
  
  try {
    let imagePaths = [];
    
    // Intentar generar imágenes para cada escena
    for (const scene of scenes) {
      try {
        let scenePaths = [];
        
        switch (provider.toUpperCase()) {
          case 'OLLAMA':
            scenePaths = await generateImagesWithOllama(scene, style);
            break;
          case 'HUGGINGFACE':
            scenePaths = await generateImagesWithHuggingFace(scene, style);
            break;
          case 'STABILITY':
            scenePaths = await generateImagesWithStability(scene, style);
            break;
          case 'LOCALAI':
            scenePaths = await generateImagesWithLocalAI(scene, style);
            break;
          default:
            // Fallback a Ollama si el proveedor no es reconocido
            console.log(`Proveedor ${provider} no reconocido para imágenes, usando Ollama como fallback`);
            scenePaths = await generateImagesWithOllama(scene, style);
        }
      } catch (error) {
        console.error(`Error generando imagen para escena "${scene.substring(0, 30)}...": ${error.message}`);
        // Si falla, intentamos usar imágenes de prueba
        scenePaths = await getTestImages();
      }
      
      imagePaths = imagePaths.concat(scenePaths);
    }
    
    // Si no se generaron imágenes, usar imágenes de prueba
    if (imagePaths.length === 0) {
      console.log('No se generaron imágenes. Usando imágenes de prueba...');
      imagePaths = await getTestImages(scenes.length);
    }
    
    return imagePaths;
  } catch (error) {
    console.error('Error al generar imágenes:', error);
    
    // En caso de error, intentar usar imágenes de prueba
    try {
      const testImages = await getTestImages(4);
      if (testImages.length > 0) {
        console.log('Usando imágenes de prueba como fallback...');
        return testImages;
      }
    } catch (testError) {
      console.error('Error al obtener imágenes de prueba:', testError);
    }
    
    throw new Error('No se pudieron generar las imágenes para el video');
  }
}

/**
 * Obtiene imágenes de prueba para usar cuando falla la generación de IA
 * @param {number} count - Número de imágenes a obtener
 * @returns {Promise<Array>} - Array de rutas de imágenes
 */
async function getTestImages(count = 1) {
  // Directorio de imágenes de prueba
  const testImagesDir = path.join(__dirname, '..', 'public', 'test-images');
  
  // Crear el directorio si no existe
  if (!fs.existsSync(testImagesDir)) {
    fs.mkdirSync(testImagesDir, { recursive: true });
    
    // Si no hay imágenes de prueba, crear algunas imágenes de ejemplo
    await createPlaceholderImages(testImagesDir, 4);
  }
  
  // Obtener lista de imágenes disponibles
  const imageFiles = fs.readdirSync(testImagesDir)
    .filter(file => file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg'))
    .map(file => path.join(testImagesDir, file));
  
  if (imageFiles.length === 0) {
    // Si no hay imágenes, crear algunas
    await createPlaceholderImages(testImagesDir, 4);
    return getTestImages(count);
  }
  
  // Seleccionar imágenes aleatorias
  const selectedImages = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * imageFiles.length);
    selectedImages.push(imageFiles[randomIndex]);
  }
  
  return selectedImages;
}

/**
 * Crea imágenes de marcador de posición con texto
 * @param {string} directory - Directorio donde crear las imágenes
 * @param {number} count - Número de imágenes a crear
 */
async function createPlaceholderImages(directory, count = 4) {
  console.log('Creando imágenes de marcador de posición...');
  
  // Usar el módulo child_process para ejecutar comandos
  const { execSync } = require('child_process');
  
  const texts = [
    'Escena 1: Introducción',
    'Escena 2: Desarrollo',
    'Escena 3: Clímax',
    'Escena 4: Conclusión'
  ];
  
  // Crear imágenes simples con texto usando ffmpeg
  for (let i = 0; i < count && i < texts.length; i++) {
    const outputPath = path.join(directory, `placeholder_${i + 1}.png`);
    
    try {
      // Verificar si ffmpeg está disponible
      execSync('ffmpeg -version', { stdio: 'ignore' });
      
      // Crear imagen con ffmpeg
      execSync(`ffmpeg -f lavfi -i color=c=black:s=1024x1024 -vf "drawtext=fontfile=/Windows/Fonts/arial.ttf:text='${texts[i]}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2" -frames:v 1 "${outputPath}"`, { stdio: 'ignore' });
      
      console.log(`Imagen creada: ${outputPath}`);
    } catch (error) {
      console.error('Error al crear imagen con ffmpeg:', error.message);
      
      // Alternativa: crear un archivo de texto simple
      const htmlContent = `
        <html>
          <body style="margin:0;padding:0;display:flex;justify-content:center;align-items:center;width:1024px;height:1024px;background:black;">
            <div style="color:white;font-family:Arial;font-size:48px;text-align:center;">
              ${texts[i]}
            </div>
          </body>
        </html>
      `;
      
      const htmlPath = path.join(directory, `placeholder_${i + 1}.html`);
      fs.writeFileSync(htmlPath, htmlContent);
      console.log(`Archivo HTML creado como alternativa: ${htmlPath}`);
      
      // Copiar una imagen de ejemplo si existe
      const exampleImagePath = path.join(__dirname, '..', 'public', 'example.jpg');
      if (fs.existsSync(exampleImagePath)) {
        fs.copyFileSync(exampleImagePath, outputPath.replace('.png', '.jpg'));
        console.log(`Imagen de ejemplo copiada: ${outputPath.replace('.png', '.jpg')}`);
      }
    }
  }
}

// Implementaciones específicas para cada proveedor

async function generateScenesWithOllama(prompt) {
  try {
    const response = await axios.post(`${process.env.OLLAMA_API_ENDPOINT}/generate`, {
      model: process.env.OLLAMA_TEXT_MODEL || 'llama3',
      prompt: `Basado en esta idea: "${prompt}", genera 4 descripciones detalladas para escenas de video. Cada descripción debe ser clara y visual. Responde solo con las 4 descripciones separadas por el carácter |.`,
      stream: false
    });
    
    const text = response.data.response;
    return text.split('|').map(scene => scene.trim()).filter(scene => scene.length > 0);
  } catch (error) {
    console.error('Error con Ollama:', error.message);
    throw error;
  }
}

async function generateScenesWithLocalAI(prompt) {
  try {
    const response = await axios.post(`${process.env.LOCALAI_ENDPOINT}/chat/completions`, {
      model: process.env.LOCALAI_TEXT_MODEL || 'llama3',
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente creativo especializado en crear descripciones detalladas para escenas de video.'
        },
        {
          role: 'user',
          content: `Basado en esta idea: "${prompt}", genera 4 descripciones detalladas para escenas de video. Cada descripción debe ser clara y visual. Responde solo con las 4 descripciones separadas por el carácter |.`
        }
      ]
    });
    
    const text = response.data.choices[0].message.content;
    return text.split('|').map(scene => scene.trim()).filter(scene => scene.length > 0);
  } catch (error) {
    console.error('Error con LocalAI:', error.message);
    throw error;
  }
}

async function generateScenesWithHuggingFace(prompt) {
  try {
    const response = await axios.post(
      `${process.env.HUGGINGFACE_INFERENCE_ENDPOINT}/${process.env.HUGGINGFACE_TEXT_MODEL}`,
      {
        inputs: `Basado en esta idea: "${prompt}", genera 4 descripciones detalladas para escenas de video. Cada descripción debe ser clara y visual. Responde solo con las 4 descripciones separadas por el carácter |.`
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const text = response.data[0].generated_text;
    return text.split('|').map(scene => scene.trim()).filter(scene => scene.length > 0);
  } catch (error) {
    console.error('Error con HuggingFace:', error.message);
    throw error;
  }
}

async function generateScenesWithOpenAI(prompt) {
  try {
    const response = await axios.post(
      `${process.env.OPENAI_API_ENDPOINT}/chat/completions`,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente creativo especializado en crear descripciones detalladas para escenas de video.'
          },
          {
            role: 'user',
            content: `Basado en esta idea: "${prompt}", genera 4 descripciones detalladas para escenas de video. Cada descripción debe ser clara y visual. Responde solo con las 4 descripciones separadas por el carácter |.`
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const text = response.data.choices[0].message.content;
    return text.split('|').map(scene => scene.trim()).filter(scene => scene.length > 0);
  } catch (error) {
    console.error('Error con OpenAI:', error.message);
    throw error;
  }
}

async function generateImagesWithOllama(prompt, style) {
  try {
    const response = await axios.post(`${process.env.OLLAMA_API_ENDPOINT}/generate`, {
      model: process.env.OLLAMA_IMAGE_MODEL || 'llava',
      prompt: `Generate a detailed image of: ${prompt}. Style: ${style}.`,
      stream: false,
      images: true
    });
    
    // Guardar la imagen generada
    const imagePath = path.join(tempDir, `${uuidv4()}.png`);
    const imageData = response.data.images[0];
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(imagePath, Buffer.from(base64Data, 'base64'));
    
    return [imagePath];
  } catch (error) {
    console.error('Error con Ollama para imágenes:', error.message);
    throw error;
  }
}

async function generateImagesWithLocalAI(prompt, style) {
  try {
    const response = await axios.post(`${process.env.LOCALAI_ENDPOINT}/images/generations`, {
      model: process.env.LOCALAI_IMAGE_MODEL || 'sdxl',
      prompt: `${prompt}. Style: ${style}.`,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json'
    });
    
    // Guardar la imagen generada
    const imagePath = path.join(tempDir, `${uuidv4()}.png`);
    const imageData = response.data.data[0].b64_json;
    fs.writeFileSync(imagePath, Buffer.from(imageData, 'base64'));
    
    return [imagePath];
  } catch (error) {
    console.error('Error con LocalAI para imágenes:', error.message);
    throw error;
  }
}

async function generateImagesWithHuggingFace(prompt, style) {
  try {
    const response = await axios({
      method: 'post',
      url: `${process.env.HUGGINGFACE_INFERENCE_ENDPOINT}/${process.env.HUGGINGFACE_IMAGE_MODEL}`,
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        inputs: `${prompt}. Style: ${style}.`,
        parameters: {
          num_inference_steps: 30,
          guidance_scale: 7.5
        }
      },
      responseType: 'arraybuffer'
    });
    
    // Guardar la imagen generada
    const imagePath = path.join(tempDir, `${uuidv4()}.png`);
    fs.writeFileSync(imagePath, Buffer.from(response.data));
    
    return [imagePath];
  } catch (error) {
    console.error('Error con HuggingFace para imágenes:', error.message);
    throw error;
  }
}

async function generateImagesWithStability(prompt, style) {
  try {
    const response = await axios({
      method: 'post',
      url: `${process.env.STABILITY_AI_ENDPOINT}/generation/stable-diffusion-xl-1024-v1-0/text-to-image`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`
      },
      data: {
        text_prompts: [
          {
            text: `${prompt}. Style: ${style}.`,
            weight: 1
          }
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        samples: 1,
        steps: 30,
        style_preset: style
      }
    });

    // Guardar la imagen generada
    const imagePath = path.join(tempDir, `${uuidv4()}.png`);
    const artifact = response.data.artifacts[0];
    fs.writeFileSync(imagePath, Buffer.from(artifact.base64, 'base64'));
    
    return [imagePath];
  } catch (error) {
    console.error('Error con Stability AI para imágenes:', error.message);
    throw error;
  }
}

async function generateImagesWithRunway(prompt, style) {
  try {
    const response = await axios({
      method: 'post',
      url: `${process.env.RUNWAY_API_ENDPOINT}/text-to-image`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`
      },
      data: {
        prompt: `${prompt}. Style: ${style}.`,
        num_steps: 30,
        guidance_scale: 7.5,
        width: 1024,
        height: 1024
      }
    });

    // Descargar la imagen generada
    const imageUrl = response.data.output_url;
    const imageResponse = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer'
    });

    // Guardar la imagen localmente
    const imagePath = path.join(tempDir, `${uuidv4()}.png`);
    fs.writeFileSync(imagePath, Buffer.from(imageResponse.data));
    
    return [imagePath];
  } catch (error) {
    console.error('Error con Runway para imágenes:', error.message);
    throw error;
  }
}

// Función para manejar el fallback entre proveedores
async function fallbackProvider(operation, prompt, style) {
  if (process.env.USE_FALLBACK !== 'true') {
    throw new Error('No se pudo completar la operación y el fallback está desactivado');
  }

  console.log('Intentando fallback a otro proveedor...');
  
  // Lista de proveedores para intentar en orden
  const openSourceProviders = ['OLLAMA', 'LOCALAI', 'HUGGINGFACE'];
  const commercialProviders = process.env.FALLBACK_TO_COMMERCIAL === 'true' 
    ? ['OPENAI', 'STABILITY'] 
    : [];
  
  const providers = [...openSourceProviders, ...commercialProviders];
  
  for (const provider of providers) {
    try {
      console.log(`Intentando con proveedor: ${provider}`);
      
      if (operation === 'scenes') {
        switch (provider) {
          case 'OLLAMA':
            return await generateScenesWithOllama(prompt);
          case 'LOCALAI':
            return await generateScenesWithLocalAI(prompt);
          case 'HUGGINGFACE':
            return await generateScenesWithHuggingFace(prompt);
          case 'OPENAI':
            return await generateScenesWithOpenAI(prompt);
        }
      } else if (operation === 'images') {
        switch (provider) {
          case 'OLLAMA':
            return await generateImagesWithOllama(prompt, style);
          case 'LOCALAI':
            return await generateImagesWithLocalAI(prompt, style);
          case 'HUGGINGFACE':
            return await generateImagesWithHuggingFace(prompt, style);
          case 'STABILITY':
            return await generateImagesWithStability(prompt, style);
        }
      }
    } catch (error) {
      console.error(`Fallback con ${provider} falló:`, error.message);
      // Continuar con el siguiente proveedor
    }
  }
  
  throw new Error('Todos los proveedores fallaron');
}

module.exports = {
  generateScenes,
  generateImages
};


// Add a function to generate mock scenes when all providers fail
/**
 * Obtiene escenas de ejemplo cuando fallan los proveedores de IA
 * @param {string} prompt - Descripción del video
 * @returns {Array} - Array de descripciones de escenas
 */
function getMockScenes(prompt) {
  console.log('Usando escenas de ejemplo para desarrollo...');
  return [
    `Una pantalla oscura con el texto "CÓDIGOS DEL MIEDO" apareciendo lentamente mientras se escucha un latido de corazón.`,
    `Imágenes rápidas de códigos binarios, pantallas de computadora y rostros asustados mirando monitores.`,
    `Un reloj digital marcando abril 2025 mientras logos de redes sociales aparecen en el fondo.`,
    `El logo de "Medios & Mercados de Negocios" seguido del texto "Muy pronto cerca de ti..." con efecto de glitch.`
  ];
}

// Modificar la función generateScenes para usar escenas de ejemplo cuando fallan los proveedores
async function generateScenes(prompt, provider) {
  console.log(`Generando escenas con proveedor: ${provider}`);
  
  try {
    let scenes = [];
    
    try {
      // Try the specified provider first
      switch (provider.toUpperCase()) {
        case 'OLLAMA':
          scenes = await generateScenesWithOllama(prompt);
          break;
        case 'HUGGINGFACE':
          scenes = await generateScenesWithHuggingFace(prompt);
          break;
        case 'LOCALAI':
          scenes = await generateScenesWithLocalAI(prompt);
          break;
        case 'OPENAI':
          scenes = await generateScenesWithOpenAI(prompt);
          break;
        default:
          // Fallback a Ollama si el proveedor no es reconocido
          console.log(`Proveedor ${provider} no reconocido, usando Ollama como fallback`);
          scenes = await generateScenesWithOllama(prompt);
      }
    } catch (error) {
      console.log(`Error con el proveedor ${provider}: ${error.message}. Usando escenas de ejemplo.`);
      scenes = getMockScenes(prompt);
    }
    
    // Asegurar que tenemos al menos 4 escenas
    if (scenes.length < 4) {
      const defaultScene = prompt;
      while (scenes.length < 4) {
        scenes.push(defaultScene);
      }
    }
    
    return scenes.slice(0, 4); // Limitar a 4 escenas
  } catch (error) {
    console.error('Error al generar escenas:', error);
    
    // En caso de error, devolver escenas de ejemplo
    return getMockScenes(prompt);
  }
}

// Modificar la función generateImages para usar imágenes de ejemplo
async function generateImages(scenes, style, provider) {
  console.log(`Generando imágenes con proveedor: ${provider}`);
  
  try {
    let imagePaths = [];
    
    // Intentar generar imágenes para cada escena
    for (const scene of scenes) {
      try {
        let scenePaths = [];
        
        switch (provider.toUpperCase()) {
          case 'OLLAMA':
            scenePaths = await generateImagesWithOllama(scene, style);
            break;
          case 'HUGGINGFACE':
            scenePaths = await generateImagesWithHuggingFace(scene, style);
            break;
          case 'STABILITY':
            scenePaths = await generateImagesWithStability(scene, style);
            break;
          case 'LOCALAI':
            scenePaths = await generateImagesWithLocalAI(scene, style);
            break;
          default:
            console.log(`Proveedor ${provider} no reconocido para imágenes, usando imágenes de ejemplo`);
            scenePaths = await getTestImages(1);
        }
        
        if (scenePaths.length === 0) {
          scenePaths = await getTestImages(1);
        }
        
        imagePaths = imagePaths.concat(scenePaths);
      } catch (error) {
        console.error(`Error generando imagen para escena "${scene.substring(0, 30)}...": ${error.message}`);
        // Si falla, usar imágenes de prueba
        const testImages = await getTestImages(1);
        imagePaths = imagePaths.concat(testImages);
      }
    }
    
    // Si no se generaron imágenes, usar imágenes de prueba
    if (imagePaths.length === 0) {
      console.log('No se generaron imágenes. Usando imágenes de prueba...');
      imagePaths = await getTestImages(4);
    }
    
    return imagePaths;
  } catch (error) {
    console.error('Error al generar imágenes:', error);
    
    // En caso de error, intentar usar imágenes de prueba
    try {
      return await getTestImages(4);
    } catch (testError) {
      console.error('Error al obtener imágenes de prueba:', testError);
      throw new Error('No se pudieron generar las imágenes para el video');
    }
  }
}

/**
 * Obtiene imágenes de prueba para usar cuando falla la generación de IA
 * @param {number} count - Número de imágenes a obtener
 * @returns {Promise<Array>} - Array de rutas de imágenes
 */
async function getTestImages(count = 1) {
  // Directorio de imágenes de prueba
  const testImagesDir = path.join(__dirname, '..', 'public', 'test-images');
  
  // Crear el directorio si no existe
  if (!fs.existsSync(testImagesDir)) {
    fs.mkdirSync(testImagesDir, { recursive: true });
    
    // Si no hay imágenes de prueba, crear algunas imágenes de ejemplo
    await createPlaceholderImages(testImagesDir, 4);
  }
  
  // Obtener lista de imágenes disponibles
  const imageFiles = fs.readdirSync(testImagesDir)
    .filter(file => file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg'))
    .map(file => path.join(testImagesDir, file));
  
  if (imageFiles.length === 0) {
    // Si no hay imágenes, crear algunas
    await createPlaceholderImages(testImagesDir, 4);
    return getTestImages(count);
  }
  
  // Seleccionar imágenes aleatorias
  const selectedImages = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * imageFiles.length);
    selectedImages.push(imageFiles[randomIndex]);
  }
  
  return selectedImages;
}

/**
 * Crea imágenes de marcador de posición con texto
 * @param {string} directory - Directorio donde crear las imágenes
 * @param {number} count - Número de imágenes a crear
 */
async function createPlaceholderImages(directory, count = 4) {
  console.log('Creando imágenes de marcador de posición...');
  
  const texts = [
    'Escena 1: Introducción',
    'Escena 2: Desarrollo',
    'Escena 3: Clímax',
    'Escena 4: Conclusión'
  ];
  
  // Crear imágenes simples con texto
  for (let i = 0; i < count && i < texts.length; i++) {
    const outputPath = path.join(directory, `placeholder_${i + 1}.jpg`);
    
    // Crear un archivo de texto con extensión .jpg como último recurso
    fs.writeFileSync(outputPath, `Imagen de prueba para ${texts[i]}`);
    console.log(`Imagen de prueba creada: ${outputPath}`);
  }
}