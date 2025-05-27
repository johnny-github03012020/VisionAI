const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Verificar si FFmpeg está instalado
router.get('/check-ffmpeg', (req, res) => {
    // Rutas adicionales donde buscar FFmpeg en Windows
    const possiblePaths = [
        'ffmpeg',
        'C:\\ffmpeg\\bin\\ffmpeg.exe',
        'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
        path.join(__dirname, '..', 'bin', 'ffmpeg.exe')
    ];
    
    // Verificar cada ruta posible
    let ffmpegFound = false;
    let ffmpegPath = null;
    
    // Función para verificar manualmente las rutas
    const checkPaths = () => {
        for (const testPath of possiblePaths) {
            if (testPath !== 'ffmpeg' && fs.existsSync(testPath)) {
                ffmpegFound = true;
                ffmpegPath = testPath;
                break;
            }
        }
        
        if (ffmpegFound) {
            console.log('FFmpeg encontrado en:', ffmpegPath);
            return res.json({ 
                found: true, 
                installed: true, 
                path: ffmpegPath 
            });
        } else {
            console.log('FFmpeg no encontrado en ninguna ruta conocida');
            
            // Verificar si existe en la carpeta bin pero no se detectó
            const binPath = path.join(__dirname, '..', 'bin', 'ffmpeg.exe');
            if (fs.existsSync(binPath)) {
                console.log('FFmpeg encontrado en bin pero no detectado anteriormente:', binPath);
                return res.json({
                    found: true,
                    installed: true,
                    path: binPath
                });
            }
            
            return res.json({ 
                found: false, 
                installed: false, 
                error: 'FFmpeg no encontrado en el sistema' 
            });
        }
    };
    
    // Primero intentamos con el comando 'where'
    exec('where ffmpeg', (error, stdout, stderr) => {
        if (!error && stdout) {
            const paths = stdout.trim().split('\r\n');
            ffmpegPath = paths[0]; // Tomar solo la primera línea
            
            // Verificar que el archivo realmente existe
            if (fs.existsSync(ffmpegPath)) {
                console.log('FFmpeg encontrado con where:', ffmpegPath);
                return res.json({ 
                    found: true, 
                    installed: true, 
                    path: ffmpegPath 
                });
            }
        }
        
        // Si falla el comando 'where', verificamos las rutas manualmente
        checkPaths();
    });
});

// Instalar FFmpeg automáticamente
// Instalar FFmpeg
let installInProgress = false;
let lastInstallTime = 0;

router.post('/install-ffmpeg', (req, res) => {
    // Evitar instalaciones simultáneas
    if (installInProgress) {
        return res.status(409).json({
            success: false,
            error: 'Ya hay una instalación en progreso'
        });
    }
    
    installInProgress = true;
    
    console.log('Ejecutando script de instalación de FFmpeg...');
    
    // Ejecutar el script de Node.js en lugar del script de PowerShell
    const scriptPath = path.join(__dirname, '..', 'scripts', 'install-ffmpeg.js');
    
    exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
        installInProgress = false;
        
        if (error) {
            console.error('Error al instalar FFmpeg:', error);
            console.error('Salida de error:', stderr);
            return res.json({ 
                success: false, 
                error: `Error al instalar FFmpeg: ${error.message}`,
                details: stderr
            });
        }
        
        console.log('Resultado de la instalación:', stdout);
        
        // Verificar si el archivo existe después de la instalación
        const ffmpegExePath = path.join(__dirname, '..', 'bin', 'ffmpeg.exe');
        if (fs.existsSync(ffmpegExePath)) {
            console.log('FFmpeg instalado correctamente en:', ffmpegExePath);
            return res.json({ 
                success: true, 
                message: 'FFmpeg instalado correctamente',
                path: ffmpegExePath
            });
        } else {
            console.error('Error: FFmpeg no se instaló correctamente');
            return res.json({ 
                success: false, 
                error: 'No se pudo instalar FFmpeg. El archivo no existe después de la instalación.',
                details: stdout
            });
        }
    });
});

module.exports = router;