/**
 * FFmpeg Installer
 * Maneja la instalación de FFmpeg
 */

class FFmpegInstaller {
    constructor() {
        this.installationPath = 'c:\\Proyectos\\VisionAI_3\\creadorVideos\\bin\\ffmpeg';
        // Actualizar URL para usar la versión de gyan.dev en lugar de BtbN
        this.downloadUrl = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-full-shared.7z';
        this.progressElement = null;
        this.statusElement = null;
    }

    async install() {
        try {
            this.updateStatus('Iniciando instalación de FFmpeg...', 5);
            
            // Crear directorio de instalación si no existe
            await this.createInstallDir();
            
            // Descargar FFmpeg
            this.updateStatus('Descargando FFmpeg...', 10);
            const downloadResult = await this.downloadFFmpeg();
            
            if (!downloadResult.success) {
                throw new Error('Error al descargar FFmpeg: ' + downloadResult.error);
            }
            
            // Extraer archivos
            this.updateStatus('Extrayendo archivos...', 40);
            const extractResult = await this.extractFFmpeg(downloadResult.filePath);
            
            if (!extractResult.success) {
                throw new Error('Error al extraer FFmpeg: ' + extractResult.error);
            }
            
            // Verificar instalación
            this.updateStatus('Verificando instalación...', 80);
            const verifyResult = await this.verifyInstallation();
            
            if (!verifyResult.success) {
                throw new Error('Error al verificar la instalación: ' + verifyResult.error);
            }
            
            // Instalación completada
            this.updateStatus('Instalación completada', 100);
            localStorage.setItem('ffmpegInstalled', 'true');
            localStorage.setItem('ffmpegPath', verifyResult.path);
            
            return { success: true, path: verifyResult.path };
        } catch (error) {
            console.error('Error durante la instalación de FFmpeg:', error);
            this.updateStatus('Error: ' + error.message, -1);
            return { success: false, error: error.message };
        }
    }

    async createInstallDir() {
        try {
            const response = await fetch('/api/create-directory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ path: this.installationPath })
            });
            
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'No se pudo crear el directorio de instalación');
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error al crear directorio:', error);
            return { success: false, error: error.message };
        }
    }

    async downloadFFmpeg() {
        try {
            const response = await fetch('/api/download-ffmpeg', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    url: this.downloadUrl,
                    destination: this.installationPath + '\\ffmpeg.zip'
                })
            });
            
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'No se pudo descargar FFmpeg');
            }
            
            return { success: true, filePath: data.filePath };
        } catch (error) {
            console.error('Error al descargar FFmpeg:', error);
            return { success: false, error: error.message };
        }
    }

    async extractFFmpeg(zipPath) {
        try {
            const response = await fetch('/api/extract-zip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    zipPath: zipPath,
                    destination: this.installationPath,
                    // Añadir información sobre la estructura de archivos de gyan.dev
                    subfolderStructure: true,
                    binFolder: 'bin'
                })
            });
            
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'No se pudo extraer FFmpeg');
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error al extraer FFmpeg:', error);
            return { success: false, error: error.message };
        }
    }

    async verifyInstallation() {
        try {
            // Buscar ffmpeg.exe en el directorio de instalación y subdirectorios
            const response = await fetch('/api/find-ffmpeg', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    basePath: this.installationPath
                })
            });
            
            const data = await response.json();
            if (!data.success || !data.path) {
                throw new Error(data.error || 'No se encontró ffmpeg.exe en los archivos extraídos');
            }
            
            return { success: true, path: data.path };
        } catch (error) {
            console.error('Error al verificar instalación:', error);
            return { success: false, error: error.message };
        }
    }

    updateStatus(message, progress) {
        console.log(`Instalación FFmpeg: ${message} (${progress}%)`);
        
        // Actualizar elementos de UI si están disponibles
        if (this.statusElement) {
            this.statusElement.textContent = message;
        }
        
        if (this.progressElement && progress >= 0) {
            this.progressElement.style.width = `${progress}%`;
        }
    }

    setProgressElement(element) {
        this.progressElement = element;
    }

    setStatusElement(element) {
        this.statusElement = element;
    }
}

// Crear instancia global
const ffmpegInstaller = new FFmpegInstaller();

// Función para mostrar el modal de instalación
function showFFmpegInstallationModal() {
    // Verificar si el modal ya existe
    let modal = document.getElementById('ffmpeg-modal');
    
    if (!modal) {
        // Crear el modal
        modal = document.createElement('div');
        modal.id = 'ffmpeg-modal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Instalación de FFmpeg</h2>
                <p>FFmpeg es necesario para generar videos. Se instalará automáticamente.</p>
                
                <div class="ffmpeg-installing">
                    <h3>Instalando FFmpeg...</h3>
                    <p>Por favor espera, esto puede tardar unos minutos.</p>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress" id="ffmpeg-progress"></div>
                        </div>
                    </div>
                    <p id="install-status">Iniciando instalación...</p>
                </div>
                
                <div class="ffmpeg-error hidden" id="ffmpeg-error">
                    <h3>Error en la instalación</h3>
                    <p id="error-message"></p>
                    <div class="error-actions">
                        <button class="btn btn-retry" id="retry-install">Reintentar</button>
                        <button class="btn btn-manual" id="manual-install">Instalación manual</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Configurar eventos
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        const retryBtn = modal.querySelector('#retry-install');
        retryBtn.addEventListener('click', function() {
            startInstallation();
        });
        
        const manualBtn = modal.querySelector('#manual-install');
        manualBtn.addEventListener('click', function() {
            showManualInstructions();
        });
    }
    
    // Mostrar el modal
    modal.style.display = 'block';
    
    // Iniciar instalación
    startInstallation();
}

// Función para iniciar la instalación
async function startInstallation() {
    const progressElement = document.getElementById('ffmpeg-progress');
    const statusElement = document.getElementById('install-status');
    const errorDiv = document.getElementById('ffmpeg-error');
    
    // Ocultar mensajes de error previos
    if (errorDiv) {
        errorDiv.classList.add('hidden');
    }
    
    // Configurar elementos de progreso
    ffmpegInstaller.setProgressElement(progressElement);
    ffmpegInstaller.setStatusElement(statusElement);
    
    // Iniciar instalación
    const result = await ffmpegInstaller.install();
    
    if (!result.success) {
        // Mostrar error
        const errorMessage = document.getElementById('error-message');
        if (errorMessage) {
            errorMessage.textContent = result.error || 'Error desconocido durante la instalación';
        }
        
        if (errorDiv) {
            errorDiv.classList.remove('hidden');
        }
    } else {
        // Instalación exitosa, cerrar modal después de un momento
        setTimeout(function() {
            const modal = document.getElementById('ffmpeg-modal');
            if (modal) {
                modal.style.display = 'none';
            }
            
            // Recargar la página o redirigir al generador
            window.location.reload();
        }, 2000);
    }
}

// Función para mostrar instrucciones de instalación manual
function showManualInstructions() {
    const modal = document.getElementById('ffmpeg-modal');
    if (!modal) return;
    
    const modalContent = modal.querySelector('.modal-content');
    modalContent.innerHTML = `
        <span class="close">&times;</span>
        <h2>Instalación Manual de FFmpeg</h2>
        
        <div class="manual-instructions">
            <h4>Sigue estos pasos para instalar FFmpeg manualmente:</h4>
            <ol>
                <li>Descarga FFmpeg desde <a href="https://www.gyan.dev/ffmpeg/builds/" target="_blank">gyan.dev</a> (versión "release full")</li>
                <li>Extrae los archivos descargados</li>
                <li>Navega a la carpeta extraída y busca la subcarpeta "bin"</li>
                <li>Copia todos los archivos de la carpeta "bin" a esta ubicación:
                    <code>c:\\Proyectos\\VisionAI_3\\creadorVideos\\bin\\ffmpeg</code>
                </li>
                <li>Asegúrate de que el archivo <code>ffmpeg.exe</code> esté directamente en esa carpeta</li>
                <li>Haz clic en "He completado la instalación manual" cuando hayas terminado</li>
            </ol>
        </div>
        
        <button class="btn btn-primary" id="confirm-manual">He completado la instalación manual</button>
    `;
    
    // Configurar eventos
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    const confirmBtn = modal.querySelector('#confirm-manual');
    confirmBtn.addEventListener('click', async function() {
        // Verificar si la instalación manual fue exitosa
        const isInstalled = await ffmpegDetector.checkInstallation();
        
        if (isInstalled) {
            modal.style.display = 'none';
            window.location.reload();
        } else {
            alert('No se pudo detectar FFmpeg. Por favor verifica que hayas copiado los archivos correctamente.');
        }
    });
}