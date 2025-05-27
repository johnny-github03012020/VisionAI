/**
 * FFmpeg Helper - Funciones para detectar y gestionar FFmpeg
 */
document.addEventListener('DOMContentLoaded', function() {
  // Estado de FFmpeg
  let ffmpegStatus = {
    installed: false,
    path: null,
    checking: false,
    installing: false
  };

  // Elemento para mostrar el banner de error
  let ffmpegErrorBanner = null;

  // Función para verificar si FFmpeg está instalado
  async function checkFFmpeg() {
    ffmpegStatus.checking = true;
    updateFFmpegStatusUI();

    try {
      const response = await fetch('/api/system/check-ffmpeg');
      const data = await response.json();
      
      ffmpegStatus.installed = data.installed;
      ffmpegStatus.path = data.path || null;
      
      if (!data.installed) {
        showFFmpegErrorBanner();
      } else {
        hideFFmpegErrorBanner();
      }
    } catch (error) {
      console.error('Error al verificar FFmpeg:', error);
      ffmpegStatus.installed = false;
      showFFmpegErrorBanner('No se pudo verificar FFmpeg. Error de conexión con el servidor.');
    }
    
    ffmpegStatus.checking = false;
    updateFFmpegStatusUI();
    
    return ffmpegStatus.installed;
  }

  // Función para instalar FFmpeg automáticamente
  async function installFFmpeg() {
    if (ffmpegStatus.installing) return;
    
    ffmpegStatus.installing = true;
    updateFFmpegStatusUI();
    
    try {
      // Mostrar modal de instalación
      showInstallingModal();
      
      const response = await fetch('/api/system/install-ffmpeg');
      const data = await response.json();
      
      if (data.installed) {
        ffmpegStatus.installed = true;
        ffmpegStatus.path = data.path;
        hideFFmpegErrorBanner();
        updateInstallingModalSuccess();
        
        // Recargar la página después de 3 segundos
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        updateInstallingModalError(data.error || 'Error desconocido durante la instalación');
      }
    } catch (error) {
      console.error('Error al instalar FFmpeg:', error);
      updateInstallingModalError(error.message);
    }
    
    ffmpegStatus.installing = false;
    updateFFmpegStatusUI();
  }

  // Función para mostrar el banner de error de FFmpeg
  function showFFmpegErrorBanner(customMessage) {
    // Si ya existe el banner, actualizarlo
    if (ffmpegErrorBanner) {
      const messageElement = ffmpegErrorBanner.querySelector('p');
      if (messageElement && customMessage) {
        messageElement.textContent = customMessage;
      }
      return;
    }

    // Crear el banner
    ffmpegErrorBanner = document.createElement('div');
    ffmpegErrorBanner.className = 'ffmpeg-error-banner';
    ffmpegErrorBanner.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      <div class="ffmpeg-error-content">
        <h3>FFmpeg no está instalado</h3>
        <p>${customMessage || 'FFmpeg es necesario para generar videos. No se ha detectado en su sistema.'}</p>
        <div class="ffmpeg-error-actions">
          <button id="ffmpeg-install-auto-btn" class="btn primary">
            <i class="fas fa-magic"></i> Instalar automáticamente
          </button>
          <button id="ffmpeg-install-manual-btn" class="btn secondary">
            <i class="fas fa-download"></i> Instalar manualmente
          </button>
        </div>
      </div>
    `;

    // Insertar el banner al principio del contenido principal
    const mainContent = document.querySelector('main') || document.querySelector('.container');
    if (mainContent) {
      mainContent.insertBefore(ffmpegErrorBanner, mainContent.firstChild);
      
      // Configurar botones
      document.getElementById('ffmpeg-install-auto-btn').addEventListener('click', installFFmpeg);
      document.getElementById('ffmpeg-install-manual-btn').addEventListener('click', showManualInstallModal);
    }
  }

  // Función para ocultar el banner de error
  function hideFFmpegErrorBanner() {
    if (ffmpegErrorBanner && ffmpegErrorBanner.parentNode) {
      ffmpegErrorBanner.parentNode.removeChild(ffmpegErrorBanner);
      ffmpegErrorBanner = null;
    }
  }

  // Función para mostrar el modal de instalación manual
  function showManualInstallModal() {
    // Crear el modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'ffmpeg-manual-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <div class="ffmpeg-assistant">
          <div class="ffmpeg-assistant-header">
            <i class="fas fa-tools"></i>
            <h2>Instalación manual de FFmpeg</h2>
          </div>
          
          <div class="ffmpeg-assistant-steps">
            <div class="ffmpeg-assistant-step">
              <h4>Descargar FFmpeg</h4>
              <p>Descargue el paquete de FFmpeg para Windows:</p>
              <a href="https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip" 
                 class="btn primary" target="_blank" id="download-ffmpeg-btn">
                <i class="fas fa-download"></i> Descargar FFmpeg para Windows (64-bit)
              </a>
            </div>
            
            <div class="ffmpeg-assistant-step">
              <h4>Extraer el archivo</h4>
              <p>Extraiga el archivo ZIP descargado a una ubicación permanente, por ejemplo:</p>
              <code>C:\\ffmpeg</code>
              <p>El archivo contiene una carpeta llamada <code>ffmpeg-master-latest-win64-gpl</code> con una subcarpeta <code>bin</code> que contiene los ejecutables.</p>
            </div>
            
            <div class="ffmpeg-assistant-step">
              <h4>Añadir FFmpeg al PATH</h4>
              <p>Para que FFmpeg esté disponible desde cualquier ubicación, debe añadirlo a la variable PATH del sistema:</p>
              <ol>
                <li>Haga clic derecho en "Este equipo" o "Mi PC" y seleccione "Propiedades"</li>
                <li>Haga clic en "Configuración avanzada del sistema"</li>
                <li>Haga clic en "Variables de entorno"</li>
                <li>En la sección "Variables del sistema", seleccione "Path" y haga clic en "Editar"</li>
                <li>Haga clic en "Nuevo" y añada la ruta a la carpeta bin de FFmpeg (por ejemplo: <code>C:\\ffmpeg\\ffmpeg-master-latest-win64-gpl\\bin</code>)</li>
                <li>Haga clic en "Aceptar" en todas las ventanas</li>
              </ol>
            </div>
            
            <div class="ffmpeg-assistant-step">
              <h4>Verificar la instalación</h4>
              <p>Para verificar que FFmpeg se ha instalado correctamente:</p>
              <ol>
                <li>Abra una nueva ventana de Símbolo del sistema (cmd) o PowerShell</li>
                <li>Escriba <code>ffmpeg -version</code> y presione Enter</li>
                <li>Si ve información sobre la versión de FFmpeg, la instalación ha sido exitosa</li>
              </ol>
              <p>Nota: Es posible que necesite reiniciar su computadora para que los cambios en el PATH surtan efecto.</p>
            </div>
          </div>
          
          <div class="ffmpeg-assistant-actions">
            <button id="ffmpeg-verify-btn" class="btn primary">
              <i class="fas fa-check-circle"></i> Verificar instalación
            </button>
            <button id="ffmpeg-close-btn" class="btn secondary">
              <i class="fas fa-times"></i> Cerrar
            </button>
          </div>
        </div>
      </div>
    `;

    // Añadir el modal al documento
    document.body.appendChild(modal);
    
    // Mostrar el modal
    modal.style.display = 'block';
    
    // Configurar botones
    document.getElementById('ffmpeg-verify-btn').addEventListener('click', checkFFmpeg);
    document.getElementById('ffmpeg-close-btn').addEventListener('click', function() {
      modal.style.display = 'none';
      document.body.removeChild(modal);
    });
    
    // Configurar el botón de cerrar
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', function() {
      modal.style.display = 'none';
      document.body.removeChild(modal);
    });
    
    // Cerrar el modal al hacer clic fuera del contenido
    window.addEventListener('click', function(event) {
      if (event.target === modal) {
        modal.style.display = 'none';
        document.body.removeChild(modal);
      }
    });
  }

  // Función para mostrar el modal de instalación automática
  function showInstallingModal() {
    // Crear el modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'ffmpeg-installing-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="ffmpeg-installing">
          <div class="ffmpeg-installing-header">
            <i class="fas fa-cog fa-spin"></i>
            <h2>Instalando FFmpeg</h2>
          </div>
          
          <div class="installation-progress">
            <div class="progress-step" id="download-step">
              <div class="progress-step-icon in-progress">
                <i class="fas fa-spinner fa-spin"></i>
              </div>
              <div class="progress-step-text">
                <h4>Descargando FFmpeg</h4>
                <div class="progress-step-status">En progreso...</div>
              </div>
            </div>
            
            <div class="progress-step" id="extract-step">
              <div class="progress-step-icon pending">
                <i class="fas fa-archive"></i>
              </div>
              <div class="progress-step-text">
                <h4>Extrayendo archivos</h4>
                <div class="progress-step-status">Pendiente</div>
              </div>
            </div>
            
            <div class="progress-step" id="install-step">
              <div class="progress-step-icon pending">
                <i class="fas fa-wrench"></i>
              </div>
              <div class="progress-step-text">
                <h4>Configurando FFmpeg</h4>
                <div class="progress-step-status">Pendiente</div>
              </div>
            </div>
            
            <div class="progress-step" id="verify-step">
              <div class="progress-step-icon pending">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="progress-step-text">
                <h4>Verificando instalación</h4>
                <div class="progress-step-status">Pendiente</div>
              </div>
            </div>
          </div>
          
          <div class="installation-message" id="installation-message">
            Por favor, espere mientras se instala FFmpeg automáticamente...
          </div>
        </div>
      </div>
    `;

    // Añadir el modal al documento
    document.body.appendChild(modal);
    
    // Mostrar el modal
    modal.style.display = 'block';
  }

  // Función para actualizar el modal de instalación con éxito
  function updateInstallingModalSuccess() {
    const modal = document.getElementById('ffmpeg-installing-modal');
    if (!modal) return;
    
    // Actualizar pasos
    document.querySelector('#download-step .progress-step-icon').className = 'progress-step-icon completed';
    document.querySelector('#download-step .progress-step-icon i').className = 'fas fa-check';
    document.querySelector('#download-step .progress-step-status').textContent = 'Completado';
    
    document.querySelector('#extract-step .progress-step-icon').className = 'progress-step-icon completed';
    document.querySelector('#extract-step .progress-step-icon i').className = 'fas fa-check';
    document.querySelector('#extract-step .progress-step-status').textContent = 'Completado';
    
    document.querySelector('#install-step .progress-step-icon').className = 'progress-step-icon completed';
    document.querySelector('#install-step .progress-step-icon i').className = 'fas fa-check';
    document.querySelector('#install-step .progress-step-status').textContent = 'Completado';
    
    document.querySelector('#verify-step .progress-step-icon').className = 'progress-step-icon completed';
    document.querySelector('#verify-step .progress-step-icon i').className = 'fas fa-check';
    document.querySelector('#verify-step .progress-step-status').textContent = 'Completado';
    
    // Actualizar mensaje
    document.getElementById('installation-message').innerHTML = `
      <div class="installation-success">
        <i class="fas fa-check-circle"></i>
        <p>FFmpeg se ha instalado correctamente. La página se recargará automáticamente en 3 segundos.</p>
      </div>
    `;
  }

  // Función para actualizar el modal de instalación con error
  function updateInstallingModalError(errorMessage) {
    const modal = document.getElementById('ffmpeg-installing-modal');
    if (!modal) return;
    
    // Actualizar pasos con error
    const steps = ['download-step', 'extract-step', 'install-step', 'verify-step'];
    let errorFound = false;
    
    for (const step of steps) {
      const stepElement = document.getElementById(step);
      const iconElement = stepElement.querySelector('.progress-step-icon');
      const statusElement = stepElement.querySelector('.progress-step-status');
      
      if (!errorFound && iconElement.classList.contains('in-progress')) {
        iconElement.className = 'progress-step-icon error';
        iconElement.querySelector('i').className = 'fas fa-times';
        statusElement.textContent = 'Error';
        errorFound = true;
      } else if (!errorFound) {
        iconElement.className = 'progress-step-icon completed';
        iconElement.querySelector('i').className = 'fas fa-check';
        statusElement.textContent = 'Completado';
      }
    }
    
    // Actualizar mensaje
    document.getElementById('installation-message').innerHTML = `
      <div class="installation-error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al instalar FFmpeg: ${errorMessage}</p>
        <button id="retry-install-btn" class="btn primary">
          <i class="fas fa-redo"></i> Reintentar
        </button>
        <button id="manual-install-btn" class="btn secondary">
          <i class="fas fa-download"></i> Instalar manualmente
        </button>
      </div>
    `;
    
    // Configurar botones
    document.getElementById('retry-install-btn').addEventListener('click', function() {
      // Cerrar el modal actual
      modal.style.display = 'none';
      document.body.removeChild(modal);
      
      // Reintentar instalación
      installFFmpeg();
    });
    
    document.getElementById('manual-install-btn').addEventListener('click', function() {
      // Cerrar el modal actual
      modal.style.display = 'none';
      document.body.removeChild(modal);
      
      // Mostrar modal de instalación manual
      showManualInstallModal();
    });
  }

  // Función para actualizar el estado de FFmpeg en la UI
  function updateFFmpegStatusUI() {
    // Actualizar botones y elementos de la UI según el estado de FFmpeg
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
      generateBtn.disabled = !ffmpegStatus.installed;
      generateBtn.title = ffmpegStatus.installed ? 
        "Generar video" : 
        "FFmpeg es necesario para generar videos. Por favor, instálelo primero.";
    }
  }

  // Verificar FFmpeg al cargar la página
  checkFFmpeg();

  // Exponer funciones globalmente
  window.ffmpegHelper = {
    check: checkFFmpeg,
    install: installFFmpeg,
    showManualInstall: showManualInstallModal
  };
});