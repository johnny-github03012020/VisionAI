/**
 * Script para verificar la instalación de FFmpeg
 */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Ruta de instalación de FFmpeg
const ffmpegPath = path.join(__dirname, '..', 'bin', 'ffmpeg');

// Función para verificar si FFmpeg está instalado
async function checkFFmpeg() {
    console.log('Verificando instalación de FFmpeg...');
    
    // Verificar si el directorio existe
    if (!fs.existsSync(ffmpegPath)) {
        console.log('Directorio de FFmpeg no encontrado');
        return false;
    }
    
    // Verificar si ffmpeg.exe existe
    const ffmpegExePath = path.join(ffmpegPath, 'ffmpeg.exe');
    if (!fs.existsSync(ffmpegExePath)) {
        console.log('ffmpeg.exe no encontrado');
        return false;
    }
    
    // Verificar si ffmpeg.exe es ejecutable
    try {
        const result = await new Promise((resolve, reject) => {
            exec(`"${ffmpegExePath}" -version`, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout);
            });
        });
        
        console.log('FFmpeg instalado correctamente');
        console.log(result.split('\n')[0]);
        return true;
    } catch (error) {
        console.log('Error al ejecutar FFmpeg:', error.message);
        return false;
    }
}

// Ejecutar verificación
checkFFmpeg().then(installed => {
    if (!installed) {
        console.log('FFmpeg no está instalado correctamente');
        process.exit(1);
    } else {
        console.log('FFmpeg está instalado y funcionando correctamente');
        process.exit(0);
    }
});