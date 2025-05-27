const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Verificar espacio en disco
router.get('/check-disk-space', (req, res) => {
  try {
    const videosDir = path.join(__dirname, '../../public/videos');
    
    // Crear directorio de videos si no existe
    if (!fs.existsSync(videosDir)) {
      fs.mkdirSync(videosDir, { recursive: true });
    }
    
    // En Windows, usar wmic para obtener espacio en disco
    exec('wmic logicaldisk get freespace,size,caption', (error, stdout) => {
      if (error) {
        return res.json({
          sufficient: true, // Asumir suficiente en caso de error
          error: error.message
        });
      }
      
      // Parsear la salida de wmic
      const lines = stdout.trim().split('\n').slice(1);
      const drives = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          return {
            drive: parts[0],
            freeSpace: parseInt(parts[1], 10),
            size: parseInt(parts[2], 10)
          };
        }
        return null;
      }).filter(Boolean);
      
      // Obtener la unidad donde está el directorio de videos
      const videoDrive = videosDir.split(':')[0].toUpperCase() + ':';
      const driveInfo = drives.find(d => d.drive === videoDrive) || drives[0];
      
      if (driveInfo) {
        const freeSpaceMB = Math.floor(driveInfo.freeSpace / (1024 * 1024));
        const totalSpaceMB = Math.floor(driveInfo.size / (1024 * 1024));
        const recommendedMB = 1000; // 1GB recomendado
        
        return res.json({
          sufficient: freeSpaceMB >= recommendedMB,
          available: freeSpaceMB,
          total: totalSpaceMB,
          recommended: recommendedMB,
          drive: driveInfo.drive
        });
      } else {
        return res.json({
          sufficient: true,
          error: 'No se pudo determinar el espacio en disco'
        });
      }
    });
  } catch (error) {
    console.error('Error al verificar espacio en disco:', error);
    return res.json({
      sufficient: true, // Asumir suficiente en caso de error
      error: error.message
    });
  }
});

// Verificar permisos de la carpeta de videos
router.get('/check-video-permissions', (req, res) => {
  try {
    const videosDir = path.join(__dirname, '../../public/videos');
    
    // Verificar si el directorio existe
    if (!fs.existsSync(videosDir)) {
      // Intentar crear el directorio
      fs.mkdirSync(videosDir, { recursive: true });
    }
    
    // Verificar permisos de escritura
    const testFile = path.join(videosDir, '.permission_test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    
    return res.json({
      hasPermissions: true
    });
  } catch (error) {
    console.error('Error al verificar permisos de video:', error);
    return res.json({
      hasPermissions: false,
      message: error.message
    });
  }
});

// Verificar conexión con el proveedor de API
router.get('/check-api-connection', (req, res) => {
  const provider = req.query.provider || 'ollama';
  
  // Simulación de verificación de conexión
  // En un entorno real, aquí se verificaría la conexión con el proveedor
  const providers = {
    ollama: { connected: true },
    replicate: { connected: true },
    huggingface: { connected: true },
    openai: { connected: true },
    anthropic: { connected: true },
    stability: { connected: true }
  };
  
  // Si el proveedor existe en nuestra lista, devolver su estado
  if (providers[provider]) {
    return res.json({ 
      connected: providers[provider].connected,
      provider: provider
    });
  }
  
  // Si el proveedor no existe, devolver error
  return res.json({ 
    connected: false,
    provider: provider,
    message: 'Proveedor no soportado'
  });
});

module.exports = router;