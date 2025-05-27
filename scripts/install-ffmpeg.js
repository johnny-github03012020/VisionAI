/**
 * Script para instalar FFmpeg
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { exec } = require('child_process');

// Primero instalar el módulo extract-zip si no está disponible
try {
    require.resolve('extract-zip');
    console.log('Módulo extract-zip ya instalado');
} catch (e) {
    console.log('Instalando módulo extract-zip...');
    require('child_process').execSync('npm install extract-zip');
    console.log('Módulo extract-zip instalado correctamente');
}

// Ahora podemos importar extract-zip
const extract = require('extract-zip');

// Configuración
const config = {
    // Usar una URL directa y estable para la descarga
    downloadUrl: 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-full.zip',
    installPath: path.join(__dirname, '..', 'bin', 'ffmpeg'),
    zipPath: path.join(__dirname, '..', 'bin', 'ffmpeg.zip')
};

// Crear directorio de instalación si no existe
function createDirectory() {
    if (!fs.existsSync(path.dirname(config.installPath))) {
        fs.mkdirSync(path.dirname(config.installPath), { recursive: true });
    }
    
    if (!fs.existsSync(config.installPath)) {
        fs.mkdirSync(config.installPath, { recursive: true });
    }
}

// Descargar FFmpeg usando un método simple y directo
function downloadFFmpeg() {
    return new Promise((resolve, reject) => {
        console.log('Descargando FFmpeg...');
        console.log('URL de descarga:', config.downloadUrl);
        
        const file = fs.createWriteStream(config.zipPath);
        
        const request = https.get(config.downloadUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (response) => {
            // Manejar redirecciones
            if (response.statusCode === 301 || response.statusCode === 302) {
                console.log('Siguiendo redirección a:', response.headers.location);
                file.close();
                fs.unlinkSync(config.zipPath);
                
                // Actualizar URL y reintentar
                config.downloadUrl = response.headers.location;
                downloadFFmpeg().then(resolve).catch(reject);
                return;
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                console.log('Descarga completada');
                resolve();
            });
        });
        
        request.on('error', (err) => {
            fs.unlink(config.zipPath, () => {});
            reject(new Error(`Error al descargar FFmpeg: ${err.message}`));
        });
    });
}

// Extraer archivos
async function extractFFmpeg() {
    console.log('Extrayendo archivos...');
    
    try {
        await extract(config.zipPath, { dir: config.installPath });
        console.log('Extracción completada');
    } catch (err) {
        throw new Error(`Error al extraer FFmpeg: ${err.message}`);
    }
}

// Mover archivos de la subcarpeta bin a la carpeta principal
function moveFiles() {
    console.log('Organizando archivos...');
    
    try {
        // Buscar ffmpeg.exe recursivamente
        function findFile(dir, filename) {
            console.log(`Buscando ${filename} en ${dir}`);
            const files = fs.readdirSync(dir);
            
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    const found = findFile(fullPath, filename);
                    if (found) return found;
                } else if (file.toLowerCase() === filename.toLowerCase()) {
                    console.log(`Encontrado ${filename} en ${fullPath}`);
                    return fullPath;
                }
            }
            
            return null;
        }
        
        // Buscar los ejecutables
        const ffmpegExe = findFile(config.installPath, 'ffmpeg.exe');
        const ffprobeExe = findFile(config.installPath, 'ffprobe.exe');
        const ffplayExe = findFile(config.installPath, 'ffplay.exe');
        
        if (!ffmpegExe) {
            throw new Error('No se encontró ffmpeg.exe en los archivos extraídos');
        }
        
        // Copiar los ejecutables a la raíz
        fs.copyFileSync(ffmpegExe, path.join(config.installPath, 'ffmpeg.exe'));
        console.log('ffmpeg.exe copiado a la raíz');
        
        if (ffprobeExe) {
            fs.copyFileSync(ffprobeExe, path.join(config.installPath, 'ffprobe.exe'));
            console.log('ffprobe.exe copiado a la raíz');
        }
        
        if (ffplayExe) {
            fs.copyFileSync(ffplayExe, path.join(config.installPath, 'ffplay.exe'));
            console.log('ffplay.exe copiado a la raíz');
        }
        
        console.log('Archivos organizados correctamente');
    } catch (error) {
        throw new Error(`Error al organizar archivos: ${error.message}`);
    }
}

// Verificar instalación
function verifyInstallation() {
    console.log('Verificando instalación...');
    
    const ffmpegExePath = path.join(config.installPath, 'ffmpeg.exe');
    if (!fs.existsSync(ffmpegExePath)) {
        throw new Error('No se encontró ffmpeg.exe en los archivos extraídos');
    }
    
    console.log('FFmpeg instalado correctamente');
}

// Función principal
async function installFFmpeg() {
    try {
        createDirectory();
        await downloadFFmpeg();
        await extractFFmpeg();
        moveFiles();
        verifyInstallation();
        console.log('Instalación de FFmpeg completada con éxito');
    } catch (error) {
        console.error('Error durante la instalación de FFmpeg:', error.message);
        process.exit(1);
    }
}

// Ejecutar instalación
installFFmpeg();