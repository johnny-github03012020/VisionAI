/**
 * FFmpeg Detector
 * Detecta si FFmpeg está instalado en el sistema y maneja la instalación manual
 */

class FFmpegDetector {
    constructor() {
        this.ffmpegPath = null;
        this.isInstalled = false;
        this.installPath = 'c:\\Proyectos\\VisionAI_3\\creadorVideos\\bin\\ffmpeg';
        this.customPaths = [
            'c:\\Proyectos\\VisionAI_3\\creadorVideos\\bin\\ffmpeg\\ffmpeg.exe',
            'c:\\Proyectos\\VisionAI_3\\creadorVideos\\bin\\ffmpeg.exe',
            'c:\\ffmpeg\\bin\\ffmpeg.exe'
        ];
    }

    async checkInstallation() {
        console.log('Verificando instalación de FFmpeg...');
        
        // Primero intentar con las rutas personalizadas
        for (const path of this.customPaths) {
            try {
                // Verificar si el archivo existe
                const response = await fetch('/api/check-file?path=' + encodeURIComponent(path));
                const data = await response.json();
                
                if (data.exists) {
                    console.log(`FFmpeg encontrado en: ${path}`);
                    this.ffmpegPath = path;
                    this.isInstalled = true;
                    return true;
                }
            } catch (error) {
                console.error('Error al verificar ruta personalizada:', error);
            }
        }
        
        // Si no se encontró en rutas personalizadas, verificar en PATH del sistema
        try {
            const response = await fetch('/api/check-ffmpeg');
            const data = await response.json();
            
            if (data.installed) {
                console.log('FFmpeg encontrado en PATH del sistema');
                this.ffmpegPath = data.path || 'ffmpeg';
                this.isInstalled = true;
                return true;
            } else {
                console.log('FFmpeg no encontrado en el sistema');
                this.isInstalled = false;
                return false;
            }
        } catch (error) {
            console.error('Error al verificar FFmpeg:', error);
            this.isInstalled = false;
            return false;
        }
    }
    
    showManualInstructions() {
        // Crear modal si no existe
        let modal = document.getElementById('ffmpeg-modal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ffmpeg-modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Instalación Manual de FFmpeg</h2>
                
                <div class="manual-instructions">
                    <h4>Sigue estos pasos para instalar FFmpeg manualmente:</h4>
                    <ol>
                        <li>Descarga FFmpeg desde <a href="https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-full.zip" target="_blank">este enlace directo</a></li>
                        <li>Extrae los archivos descargados</li>
                        <li>Navega a la carpeta extraída y busca la subcarpeta "bin"</li>
                        <li>Crea la carpeta: <code>${this.installPath}</code> si no existe</li>
                        <li>Copia todos los archivos de la carpeta "bin" a esta ubicación</li>
                        <li>Asegúrate de que el archivo <code>ffmpeg.exe</code> esté directamente en esa carpeta</li>
                        <li>Haz clic en "He completado la instalación manual" cuando hayas terminado</li>
                    </ol>
                </div>
                
                <button class="btn primary" id="confirm-manual">He completado la instalación manual</button>
            </div>
        `;
        
        // Mostrar modal
        modal.style.display = 'block';
        
        // Cerrar modal al hacer clic en X
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Confirmar instalación manual
        const confirmBtn = document.getElementById('confirm-manual');
        confirmBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/confirm-manual-install', {
                    method: 'POST'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert('¡FFmpeg instalado correctamente!');
                    modal.style.display = 'none';
                    window.location.reload();
                } else {
                    alert(`Error: ${data.error}`);
                }
            } catch (error) {
                alert('Error al verificar la instalación manual');
                console.error(error);
            }
        });
    }
}

// Crear instancia global
window.ffmpegDetector = new FFmpegDetector();

// Verificar FFmpeg al cargar la página
document.addEventListener('DOMContentLoaded', async function() {
    const isInstalled = await ffmpegDetector.checkInstallation();
    
    if (!isInstalled) {
        console.log('FFmpeg no está instalado. Mostrando asistente de instalación...');
        // Mostrar mensaje o modal para instalar FFmpeg
        if (typeof showFFmpegInstallationModal === 'function') {
            showFFmpegInstallationModal();
        } else {
            ffmpegDetector.showManualInstructions();
        }
    } else {
        console.log('FFmpeg está instalado correctamente');
        // Guardar estado en localStorage para futuras verificaciones
        localStorage.setItem('ffmpegInstalled', 'true');
        localStorage.setItem('ffmpegPath', ffmpegDetector.ffmpegPath);
    }
});