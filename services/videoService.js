const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { spawn } = require('child_process');
const aiService = require('./aiService');

// Configuración de directorios
const tempDir = path.resolve(__dirname, '..', process.env.TEMP_DIR || '../uploads/temp');
const outputDir = path.join(__dirname, '../public/videos');

// Asegurar que los directorios existan
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Genera un video a partir de imágenes usando FFmpeg
 * @param {Array} imagePaths - Rutas de las imágenes
 * @param {string} outputPath - Ruta de salida del video
 * @param {number} duration - Duración total del video en segundos
 * @param {number} fps - Frames por segundo
 * @returns {Promise<string>} - Ruta del video generado
 */
async function createVideoFromImages(imagePaths, outputPath, duration, fps = process.env.DEFAULT_FPS) {
  return new Promise((resolve, reject) => {
    // Calcular duración por imagen
    const totalFrames = fps * duration;
    const framesPerImage = Math.floor(totalFrames / imagePaths.length);
    
    // Crear archivo de entrada para FFmpeg
    const inputFile = path.join(tempDir, `input_${Date.now()}.txt`);
    const fileContent = imagePaths.map(imgPath => 
      `file '${imgPath.replace(/\\/g, '/')}'
duration ${framesPerImage / fps}`
    ).join('\n');
    
    fs.writeFileSync(inputFile, fileContent);
    
    // Comando FFmpeg
    const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
    const ffmpeg = spawn(ffmpegPath, [
      '-f', 'concat',
      '-safe', '0',
      '-i', inputFile,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'medium',
      '-r', fps.toString(),
      '-y',
      outputPath
    ]);
    
    ffmpeg.stdout.on('data', (data) => {
      console.log(`FFmpeg stdout: ${data}`);
    });
    
    ffmpeg.stderr.on('data', (data) => {
      console.log(`FFmpeg stderr: ${data}`);
    });
    
    ffmpeg.on('close', (code) => {
      // Limpiar archivo temporal
      fs.unlinkSync(inputFile);
      
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });
  });
}

/**
 * Proceso completo de generación de video
 * @param {Object} options - Opciones para la generación
 * @returns {Promise<Object>} - Información del video generado
 */
/**
 * Genera un video a partir de imágenes y audio
 * @param {Object} options - Opciones para la generación del video
 * @returns {Promise<string>} - Ruta del video generado
 */
async function generateVideo(options) {
  const { prompt, provider, style, duration } = options;
  
  try {
    console.log('Generando escenas para el video...');
    const scenes = await aiService.generateScenes(prompt, provider);
    
    console.log('Generando imágenes para las escenas...');
    const imagePaths = await aiService.generateImages(scenes, style, provider);
    
    console.log('Creando video a partir de las imágenes...');
    
    // Verificar si FFmpeg está disponible en diferentes rutas
    const ffmpegPaths = [
      'ffmpeg',                        // Si está en PATH
      'C:/ffmpeg/bin/ffmpeg.exe',      // Ruta común en Windows
      path.join(__dirname, '..', 'bin', 'ffmpeg.exe'), // Ruta relativa al proyecto
      'C:/Program Files/ffmpeg/bin/ffmpeg.exe'  // Otra ruta común
    ];
    
    let ffmpegPath = null;
    
    // Intentar encontrar FFmpeg
    for (const testPath of ffmpegPaths) {
      try {
        // Verificar si el ejecutable existe (para rutas absolutas)
        if (testPath !== 'ffmpeg' && fs.existsSync(testPath)) {
          ffmpegPath = testPath;
          break;
        }
        
        // Intentar ejecutar ffmpeg para ver si está disponible
        const { execSync } = require('child_process');
        execSync(`${testPath} -version`, { stdio: 'ignore' });
        ffmpegPath = testPath;
        break;
      } catch (error) {
        console.log(`FFmpeg no encontrado en: ${testPath}`);
      }
    }
    
    // Si no se encuentra FFmpeg, crear un mensaje de error claro
    if (!ffmpegPath) {
      console.error('FFmpeg no está instalado o no se encuentra en las rutas esperadas.');
      console.error('Por favor, instale FFmpeg y asegúrese de que esté en el PATH del sistema.');
      console.error('Puede descargarlo desde: https://ffmpeg.org/download.html');
      
      // Crear un video de error (un archivo HTML que explica el problema)
      const videoId = uuidv4();
      const errorVideoPath = path.join(__dirname, '..', 'public', 'videos', `${videoId}.html`);
      
      // Asegurar que el directorio existe
      const videosDir = path.join(__dirname, '..', 'public', 'videos');
      if (!fs.existsSync(videosDir)) {
        fs.mkdirSync(videosDir, { recursive: true });
      }
      
      // Crear un archivo HTML que explica el error
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error: FFmpeg no encontrado</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: red; font-weight: bold; }
            .instructions { margin-top: 30px; text-align: left; max-width: 600px; margin: 30px auto; }
            .download-btn { 
              display: inline-block; 
              background-color: #4CAF50; 
              color: white; 
              padding: 10px 20px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin-top: 20px; 
            }
          </style>
        </head>
        <body>
          <h1 class="error">Error: FFmpeg no encontrado</h1>
          <p>No se pudo generar el video porque FFmpeg no está instalado o no se encuentra en las rutas esperadas.</p>
          
          <div class="instructions">
            <h2>Instrucciones para instalar FFmpeg:</h2>
            <ol>
              <li>Descargue FFmpeg desde <a href="https://ffmpeg.org/download.html" target="_blank">https://ffmpeg.org/download.html</a></li>
              <li>Extraiga los archivos a una carpeta, por ejemplo: C:\\ffmpeg</li>
              <li>Agregue la carpeta bin (C:\\ffmpeg\\bin) al PATH del sistema</li>
              <li>Reinicie la aplicación</li>
            </ol>
          </div>
          
          <p>Una vez instalado FFmpeg, intente generar el video nuevamente.</p>
          <a href="https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip" class="download-btn">Descargar FFmpeg para Windows</a>
        </body>
        </html>
      `;
      
      fs.writeFileSync(errorVideoPath, errorHtml);
      
      return {
        id: videoId,
        path: `/videos/${videoId}.html`,
        error: true,
        message: 'FFmpeg no encontrado'
      };
    }
    
    // Generar un ID único para el video
    const id = uuidv4();
    const outputPath = path.join(outputDir, `${id}.mp4`);
    
    // Continuar con la generación del video usando la ruta de FFmpeg encontrada
    process.env.FFMPEG_PATH = ffmpegPath;
    await createVideoFromImages(imagePaths, outputPath, duration);
    
    // Paso 4: Limpiar archivos temporales
    console.log('Limpiando archivos temporales...');
    imagePaths.forEach(imagePath => {
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (err) {
        console.error(`Error al eliminar archivo temporal ${imagePath}:`, err);
      }
    });
    
    console.log(`Video generado exitosamente: ${outputPath}`);
    
    return {
      id,
      path: `/videos/${id}.mp4`,
      scenes
    };
  } catch (error) {
    console.error('Error al generar el video:', error);
    throw error;
  }
}

module.exports = {
  generateVideo,
  createVideoFromImages
};